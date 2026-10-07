import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: `${siteConfig.name} | ${siteConfig.tagline}`,
        short_name: siteConfig.name,
        description: siteConfig.description,
        lang: "pt-PT",
        start_url: "/",
        display: "standalone",
        background_color: "#f7f5f0",
        theme_color: "#681c2b",
        icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
    };
}
