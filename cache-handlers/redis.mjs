/**
 * Redis-backed handler for 'use cache' (next.config.ts → cacheHandlers),
 * enabled when REDIS_URL is set. Shares cached catalogue data and tag
 * invalidations between all instances of the app.
 *
 * - Entries are stored as JSON (value as base64) with a Redis TTL.
 * - Tag invalidations (revalidateTag/updateTag) are written to a Redis hash
 *   and pulled into every instance by refreshTags(): lazily by Next.js when
 *   a request runs a 'use cache' function, and by a background poll every
 *   second, because pages served straight from the page cache never call
 *   it. An edit on one instance reaches the others within about a second.
 * - Tag semantics mirror Next's default handler: an "expired" tag drops the
 *   entry, a "stale" tag serves it once while it is regenerated.
 * - Availability over consistency: every Redis call has a timeout and a
 *   circuit breaker; while Redis is unavailable the handler falls back to
 *   a small in-process cache, and get() never throws (a miss re-renders).
 *
 * Plain JavaScript: Next.js loads this file at runtime, unbundled.
 */
import { createClient } from "redis";

/**
 * Next's process-wide tag manifest, read by the page (ISR) cache. Remote
 * invalidations are merged into it so prerendered pages on this instance
 * are regenerated too. Internal module: if it cannot be loaded, data
 * caches still invalidate and pages fall back to their revalidate time.
 */
let pageTagsManifest;
try {
    ({ tagsManifest: pageTagsManifest } = await import("next/dist/server/lib/incremental-cache/tags-manifest.external.js"));
} catch {
    pageTagsManifest = undefined;
}

const PREFIX = process.env.REDIS_KEY_PREFIX || "cellarium";
const ENTRY_PREFIX = `${PREFIX}:uc:entry:`;
const TAGS_KEY = `${PREFIX}:uc:tags`;

const OPERATION_TIMEOUT_MS = 250;
const REFRESH_INTERVAL_MS = 500;
const POLL_INTERVAL_MS = 1_000;
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 30_000;
const MAX_ENTRY_BYTES = 2 * 1024 * 1024;
const MAX_TTL_SECONDS = 30 * 24 * 60 * 60;
const FALLBACK_MAX_ENTRIES = 500;

const now = () => performance.timeOrigin + performance.now();

function log(level, message, details = {}) {
    const line = JSON.stringify({ level, scope: "cache.redis", message, time: new Date().toISOString(), ...details });
    (level === "error" ? console.error : console.warn)(line);
}

// ─── Connection + circuit breaker ───────────────────────────────────────────

let client;
let connecting;
let failures = 0;
let openUntil = 0;

function getClient() {
    if (!client) {
        client = createClient({
            url: process.env.REDIS_URL,
            // Fail fast while disconnected instead of queueing commands.
            disableOfflineQueue: true,
            socket: {
                connectTimeout: 2_000,
                reconnectStrategy: (retries) => Math.min(250 * 2 ** retries, 10_000),
            },
        });
        client.on("error", (error) => {
            // Logged once per breaker trip by `run`; avoid flooding here.
            if (failures === 0) log("warn", "Redis connection error", { error: String(error?.message ?? error) });
        });
        connecting = client.connect().catch(() => {});
    }

    return client;
}

/** Gives the first operations up to 1s for the initial connection. */
async function waitForInitialConnection(redis) {
    if (redis.isReady || !connecting) return;

    let timer;
    await Promise.race([connecting, new Promise((resolve) => (timer = setTimeout(resolve, 1_000)))]);
    clearTimeout(timer);
    connecting = undefined;
}

/** Runs a Redis operation with a timeout; returns `fallback` on failure. */
async function run(operation, fallback) {
    if (now() < openUntil) {
        return fallback;
    }

    let timer;

    try {
        const redis = getClient();
        await waitForInitialConnection(redis);

        if (!redis.isReady) {
            throw new Error("Redis not ready");
        }

        const result = await Promise.race([
            operation(redis),
            new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error("Redis timeout")), OPERATION_TIMEOUT_MS);
            }),
        ]);

        failures = 0;
        return result;
    } catch (error) {
        failures += 1;

        if (failures >= BREAKER_THRESHOLD && now() >= openUntil) {
            openUntil = now() + BREAKER_COOLDOWN_MS;
            log("warn", "Redis unavailable, using in-memory fallback", {
                cooldownMs: BREAKER_COOLDOWN_MS,
                error: String(error?.message ?? error),
            });
        }

        return fallback;
    } finally {
        clearTimeout(timer);
    }
}

// ─── Tags ────────────────────────────────────────────────────────────────────

/** tag → { stale?: number, expired?: number } (ms timestamps) */
const tagsManifest = new Map();
let lastRefresh = 0;
/** Invalidations not yet written to Redis (outage); retried on refresh. */
const unsyncedTags = {};

async function flushTags() {
    if (Object.keys(unsyncedTags).length === 0) return;

    const batch = { ...unsyncedTags };
    const written = await run((redis) => redis.hSet(TAGS_KEY, batch), null);

    if (written !== null) {
        for (const tag of Object.keys(batch)) {
            if (unsyncedTags[tag] === batch[tag]) delete unsyncedTags[tag];
        }
    }
}

function mergeIntoPageManifest(tag, remote) {
    if (!pageTagsManifest) return;

    const local = pageTagsManifest.get(tag) ?? {};
    const merged = { ...local };

    if ((remote.stale ?? 0) > (local.stale ?? 0)) merged.stale = remote.stale;
    if ((remote.expired ?? 0) > (local.expired ?? 0)) merged.expired = remote.expired;

    if (merged.stale !== local.stale || merged.expired !== local.expired) {
        pageTagsManifest.set(tag, merged);
    }
}

function areTagsExpired(tags, timestamp) {
    const current = now();
    return tags.some((tag) => {
        const expired = tagsManifest.get(tag)?.expired;
        return typeof expired === "number" && expired <= current && expired > timestamp;
    });
}

function areTagsStale(tags, timestamp) {
    return tags.some((tag) => (tagsManifest.get(tag)?.stale ?? 0) > timestamp);
}

// ─── Fallback (Redis down) ──────────────────────────────────────────────────

const fallback = new Map();

function rememberFallback(cacheKey, record) {
    fallback.delete(cacheKey);
    fallback.set(cacheKey, record);

    if (fallback.size > FALLBACK_MAX_ENTRIES) {
        fallback.delete(fallback.keys().next().value);
    }
}

// ─── Serialisation ──────────────────────────────────────────────────────────

async function readStream(stream) {
    const reader = stream.getReader();
    const chunks = [];
    let size = 0;

    for (let chunk; !(chunk = await reader.read()).done; ) {
        size += chunk.value.byteLength;
        chunks.push(Buffer.from(chunk.value));
    }

    return { buffer: Buffer.concat(chunks), size };
}

function toEntry(record) {
    const bytes = Buffer.from(record.value, "base64");

    return {
        value: new ReadableStream({
            start(controller) {
                controller.enqueue(new Uint8Array(bytes));
                controller.close();
            },
        }),
        tags: record.tags,
        stale: record.stale,
        timestamp: record.timestamp,
        expire: record.expire,
        revalidate: record.revalidate,
    };
}

// ─── Handler ────────────────────────────────────────────────────────────────

const pendingSets = new Map();

const handler = {
    async get(cacheKey) {
        try {
            const pending = pendingSets.get(cacheKey);
            if (pending) await pending;

            const raw = await run((redis) => redis.get(ENTRY_PREFIX + cacheKey), undefined);
            const record = raw ? JSON.parse(raw) : fallback.get(cacheKey);

            if (!record) return undefined;

            // Like Next's production default: past `revalidate`, regenerate.
            if (now() > record.timestamp + record.revalidate * 1000) return undefined;
            if (areTagsExpired(record.tags, record.timestamp)) return undefined;

            const entry = toEntry(record);

            if (areTagsStale(record.tags, record.timestamp)) {
                entry.revalidate = -1;
            }

            return entry;
        } catch (error) {
            log("warn", "Cache read failed", { error: String(error?.message ?? error) });
            return undefined;
        }
    },

    async set(cacheKey, pendingEntry) {
        let resolvePending = () => {};
        pendingSets.set(cacheKey, new Promise((resolve) => (resolvePending = resolve)));

        try {
            const entry = await pendingEntry;

            // expire: 0 marks a dynamic entry that is never served back.
            if (entry.expire === 0) return;

            const { buffer, size } = await readStream(entry.value);

            if (size > MAX_ENTRY_BYTES) {
                log("warn", "Cache entry too large, not stored", { size });
                return;
            }

            const record = {
                value: buffer.toString("base64"),
                tags: entry.tags,
                stale: entry.stale,
                timestamp: entry.timestamp,
                expire: entry.expire,
                revalidate: entry.revalidate,
            };
            const ttl = Math.max(1, Math.min(Math.ceil(entry.expire), MAX_TTL_SECONDS));
            const stored = await run(
                (redis) => redis.set(ENTRY_PREFIX + cacheKey, JSON.stringify(record), { EX: ttl }),
                null,
            );

            if (stored === null) {
                rememberFallback(cacheKey, record);
            }
        } catch (error) {
            // A failed write only costs a re-render later.
            log("warn", "Cache write failed", { error: String(error?.message ?? error) });
        } finally {
            resolvePending();
            pendingSets.delete(cacheKey);
        }
    },

    async refreshTags() {
        if (now() - lastRefresh < REFRESH_INTERVAL_MS) return;
        lastRefresh = now();

        await flushTags();

        const all = await run((redis) => redis.hGetAll(TAGS_KEY), null);
        if (!all) return;

        for (const [tag, value] of Object.entries(all)) {
            if (tag in unsyncedTags) continue;

            try {
                const remote = JSON.parse(value);
                tagsManifest.set(tag, remote);
                mergeIntoPageManifest(tag, remote);
            } catch {
                // Ignore malformed entries.
            }
        }
    },

    async getExpiration(tags) {
        return Math.max(0, ...tags.map((tag) => tagsManifest.get(tag)?.expired ?? 0));
    },

    async updateTags(tags, durations) {
        const timestamp = Math.round(now());

        for (const tag of tags) {
            const next = { ...tagsManifest.get(tag) };

            if (durations) {
                next.stale = timestamp;
                if (durations.expire !== undefined) next.expired = timestamp + durations.expire * 1000;
            } else {
                next.expired = timestamp;
            }

            tagsManifest.set(tag, next);
            unsyncedTags[tag] = JSON.stringify(next);

            // Same instance: drop fallback entries carrying the tag right away.
            for (const [key, record] of fallback) {
                if (record.tags.includes(tag)) fallback.delete(key);
            }
        }

        await flushTags();
    },
};

// Background sync (see header). unref(): never keeps the process alive.
if (process.env.REDIS_URL) {
    setInterval(() => {
        handler.refreshTags().catch(() => {});
    }, POLL_INTERVAL_MS).unref();
}

export default handler;
