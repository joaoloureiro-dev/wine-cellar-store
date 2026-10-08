import { afterEach, describe, expect, it, vi } from "vitest";

import { detectImageType } from "@/lib/media/image-type";

const bytes = (...parts: (string | number[])[]) =>
    new Uint8Array(parts.flatMap((part) => (typeof part === "string" ? [...part].map((char) => char.charCodeAt(0)) : part)));

const pad = (data: Uint8Array) => {
    const padded = new Uint8Array(Math.max(32, data.length));
    padded.set(data);
    return padded;
};

describe("detectImageType", () => {
    it.each([
        ["jpeg", pad(bytes([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg"],
        ["png", pad(bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a])), "image/png"],
        ["webp", pad(bytes("RIFF", [0, 0, 0, 0], "WEBP")), "image/webp"],
        ["avif", pad(bytes([0, 0, 0, 0x20], "ftypavif")), "image/avif"],
    ])("recognises %s", (_name, data, contentType) => {
        expect(detectImageType(data)?.contentType).toBe(contentType);
    });

    it.each([
        ["svg", pad(bytes('<svg xmlns="http://www.w3.org/2000/svg">'))],
        ["html", pad(bytes("<!doctype html><script>"))],
        ["gif", pad(bytes("GIF89a"))],
        ["heic", pad(bytes([0, 0, 0, 0x20], "ftypheic"))],
        ["too short", bytes([0xff, 0xd8, 0xff])],
    ])("rejects %s", (_name, data) => {
        expect(detectImageType(data)).toBeNull();
    });
});

describe("S3 media storage", () => {
    const s3Env = {
        MEDIA_STORAGE: "s3",
        S3_ENDPOINT: "https://account.r2.cloudflarestorage.com",
        S3_BUCKET: "cellarium-media",
        S3_ACCESS_KEY_ID: "key-id",
        S3_SECRET_ACCESS_KEY: "secret",
        MEDIA_PUBLIC_URL: "https://media.cellarium.test/",
    };
    const key = "products/product-1/0b0f3c62-8f5a-4f39-9a4a-6f0e2b1d2c3a.webp";

    async function loadStorage(env: Record<string, string>, fetchMock: typeof fetch) {
        vi.resetModules();
        for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
        vi.stubGlobal("fetch", fetchMock);
        return import("@/lib/media/storage");
    }

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it("uploads with a signed PUT and serves from the public URL", async () => {
        const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
        const { getMediaStorage } = await loadStorage(s3Env, fetchMock as unknown as typeof fetch);
        const storage = getMediaStorage();

        await storage.put(key, new Uint8Array([1, 2, 3]), "image/webp");

        const request = (fetchMock.mock.calls[0] as unknown as [Request])[0];
        expect(request.method).toBe("PUT");
        expect(request.url).toBe(`https://account.r2.cloudflarestorage.com/cellarium-media/${key}`);
        expect(request.headers.get("authorization")).toMatch(/^AWS4-HMAC-SHA256 Credential=key-id\/\d{8}\/auto\/s3\/aws4_request/);
        expect(request.headers.get("content-type")).toBe("image/webp");

        expect(storage.urlFor(key)).toBe(`https://media.cellarium.test/${key}`);
        expect(storage.keyFor(`https://media.cellarium.test/${key}`)).toBe(key);
        expect(storage.keyFor("/images/products/seeded.webp")).toBeNull();
        expect(storage.keyFor("https://media.cellarium.test/products/x/../../secret")).toBeNull();
    });

    it("reports failures and treats a missing object as deleted", async () => {
        const fetchMock = vi.fn(async (request: Request) => new Response("nope", { status: request.method === "PUT" ? 403 : 404 }));
        const { getMediaStorage, MediaStorageError } = await loadStorage(s3Env, fetchMock as unknown as typeof fetch);

        await expect(getMediaStorage().put(key, new Uint8Array([1]), "image/webp")).rejects.toBeInstanceOf(MediaStorageError);
        await expect(getMediaStorage().remove(key)).resolves.toBeUndefined();
    });

    it("refuses to start half-configured", async () => {
        const { getMediaStorage } = await loadStorage({ ...s3Env, S3_BUCKET: "" }, vi.fn() as unknown as typeof fetch);

        expect(() => getMediaStorage()).toThrow(/S3_BUCKET/);
    });
});
