import { ogImageSize, renderOgImage } from "@/lib/seo/og-image";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} | ${siteConfig.tagline}`;
export const size = ogImageSize;
export const contentType = "image/png";

export default async function Image() {
    return renderOgImage({
        eyebrow: siteConfig.tagline,
        title: "A cave certa para a sua coleção",
        subtitle: siteConfig.description,
    });
}
