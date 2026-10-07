import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo/metadata";

/** Private and transactional areas are kept out of search results. */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/admin",
                "/api/",
                "/conta",
                "/carrinho",
                "/checkout",
                "/encomendas/",
                "/reservas/RSV-",
                "/caves/*/reservar",
                "/entrar",
                "/registar",
                "/favoritos",
            ],
        },
        sitemap: absoluteUrl("/sitemap.xml"),
    };
}
