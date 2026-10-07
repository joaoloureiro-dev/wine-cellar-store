/**
 * Only same-site relative paths are allowed as post-login destinations,
 * preventing open redirects such as ?next=https://evil.example.
 */
export function safeNextPath(value: unknown, fallback = "/conta") {
    return typeof value === "string" && /^\/(?!\/)[^\s\\]*$/.test(value) ? value : fallback;
}
