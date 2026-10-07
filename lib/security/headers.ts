/**
 * HTTP security headers, applied to every response from next.config.ts.
 *
 * The CSP uses no nonces on purpose: nonces force every page to render
 * dynamically, which would disable the prerendered catalogue (Cache
 * Components / partial prerendering). Inline scripts stay allowed because
 * Next.js inlines its bootstrap; everything else is locked to this origin:
 * no third-party scripts, frames, plugins, <base> hijacking, or form posts
 * to other sites (except Stripe Checkout, reached by a redirect after the
 * checkout form is submitted).
 */
export function contentSecurityPolicy({ isDev }: { isDev: boolean }) {
    const directives = {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "blob:"],
        "font-src": ["'self'"],
        "connect-src": ["'self'", ...(isDev ? ["ws:"] : [])],
        "frame-src": ["'none'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'", "https://checkout.stripe.com"],
        "frame-ancestors": ["'none'"],
        "manifest-src": ["'self'"],
        "worker-src": ["'self'", "blob:"],
    };

    const policy = Object.entries(directives)
        .map(([name, values]) => `${name} ${values.join(" ")}`)
        .join("; ");

    return isDev ? policy : `${policy}; upgrade-insecure-requests`;
}

export function securityHeaders({ isDev }: { isDev: boolean }) {
    return [
        { key: "Content-Security-Policy", value: contentSecurityPolicy({ isDev }) },
        // Browsers only honour HSTS over HTTPS; two years, no preload commitment.
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
        },
    ];
}
