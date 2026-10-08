/** Formats accepted for product photos, recognised by their file signature. */
export const imageTypes = {
    jpeg: { contentType: "image/jpeg", extension: "jpg" },
    png: { contentType: "image/png", extension: "png" },
    webp: { contentType: "image/webp", extension: "webp" },
    avif: { contentType: "image/avif", extension: "avif" },
} as const;

export type ImageType = (typeof imageTypes)[keyof typeof imageTypes];

const ascii = (bytes: Uint8Array, start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));

/**
 * Detects the image format from the first bytes ("magic numbers"), never
 * from the file name or the browser-reported type, which the client
 * controls. Returns null for anything else (SVG, HTML, executables, …).
 */
export function detectImageType(bytes: Uint8Array): ImageType | null {
    if (bytes.length < 12) return null;

    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return imageTypes.jpeg;
    if (ascii(bytes, 0, 8) === "\x89PNG\r\n\x1a\n") return imageTypes.png;
    if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return imageTypes.webp;
    if (ascii(bytes, 4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(bytes, 8, 12))) return imageTypes.avif;

    return null;
}
