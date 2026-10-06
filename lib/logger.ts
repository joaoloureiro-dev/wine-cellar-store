import "server-only";

type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

/**
 * Minimal structured (JSON) logger. One line per event so log platforms
 * (Vercel, Better Stack, Grafana Loki…) can index fields. Never log secrets
 * or personal data: pass identifiers (order reference, payment id) instead.
 */
function write(level: Level, scope: string, message: string, fields: Fields = {}) {
    const entry = {
        level,
        time: new Date().toISOString(),
        scope,
        message,
        ...fields,
        ...(fields.error instanceof Error
            ? { error: { name: fields.error.name, message: fields.error.message } }
            : {}),
    };
    const line = JSON.stringify(entry);

    if (level === "error") {
        console.error(line);
    } else if (level === "warn") {
        console.warn(line);
    } else {
        console.log(line);
    }
}

export function createLogger(scope: string) {
    return {
        debug: (message: string, fields?: Fields) => write("debug", scope, message, fields),
        info: (message: string, fields?: Fields) => write("info", scope, message, fields),
        warn: (message: string, fields?: Fields) => write("warn", scope, message, fields),
        error: (message: string, fields?: Fields) => write("error", scope, message, fields),
    };
}
