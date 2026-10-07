import type { Instrumentation } from "next";

/**
 * Structured log line for every server error (rendering, route handlers,
 * server actions, proxy), matching lib/logger's JSON format so any log
 * collector can index it. The query string is dropped: it may carry
 * search terms or emails. `digest` matches the reference shown to the
 * user on the error page.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
    const details = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) };
    const digest =
        typeof error === "object" && error !== null && "digest" in error ? String((error as { digest: unknown }).digest) : undefined;

    console.error(
        JSON.stringify({
            level: "error",
            scope: "request",
            message: "Unhandled server error",
            time: new Date().toISOString(),
            digest,
            method: request.method,
            path: request.path.split("?")[0],
            routePath: context.routePath,
            routeType: context.routeType,
            renderSource: context.renderSource,
            error: details,
        }),
    );
};
