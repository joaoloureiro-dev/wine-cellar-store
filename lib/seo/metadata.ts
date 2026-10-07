import "server-only";

import type { Metadata } from "next";

import { env } from "@/lib/env";
import { siteConfig } from "@/lib/site";

/** Public origin used for canonical URLs, sitemaps and structured data. */
export const siteUrl = new URL(env.APP_URL);

export function absoluteUrl(path: string) {
    return new URL(path, siteUrl).toString();
}

type PageMetadataInput = {
    title: string;
    description: string;
    /** Canonical path, e.g. "/caves". */
    path: string;
    /** Absolute or root-relative image; defaults to the site OG image. */
    image?: { url: string; alt: string };
    type?: "website" | "article";
};

/**
 * Metadata for an indexable page: canonical URL plus matching Open Graph
 * and Twitter cards. Child `openGraph` objects replace the parent's, so
 * every page builds the full set here.
 */
export function pageMetadata({ title, description, path, image, type = "website" }: PageMetadataInput): Metadata {
    const fullTitle = `${title} | ${siteConfig.name}`;

    return {
        title,
        description,
        alternates: { canonical: path },
        openGraph: {
            type,
            locale: "pt_PT",
            siteName: siteConfig.name,
            url: path,
            title: fullTitle,
            description,
            ...(image ? { images: [{ url: image.url, alt: image.alt }] } : {}),
        },
        twitter: {
            card: "summary_large_image",
            title: fullTitle,
            description,
            ...(image ? { images: [image.url] } : {}),
        },
    };
}
