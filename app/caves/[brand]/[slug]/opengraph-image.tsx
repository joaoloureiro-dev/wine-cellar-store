import { formatCurrency } from "@/lib/format";
import { getActiveProducts, getProductBySlug } from "@/lib/products";
import { ogImageSize, renderOgImage } from "@/lib/seo/og-image";
import { siteConfig } from "@/lib/site";

export const alt = `Cave de vinho | ${siteConfig.name}`;
export const size = ogImageSize;
export const contentType = "image/png";

/** Prerender a card per product at build time (new products: on demand). */
export async function generateStaticParams() {
    const products = await getActiveProducts();
    return products.map((product) => ({ brand: product.brandSlug, slug: product.slug }));
}

export default async function Image({ params }: { params: Promise<{ brand: string; slug: string }> }) {
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    if (!product) {
        return renderOgImage({ eyebrow: siteConfig.tagline, title: siteConfig.name });
    }

    return renderOgImage({
        eyebrow: product.brand,
        title: product.name,
        subtitle: product.shortDescription,
        details: [
            `${product.capacity} garrafas`,
            product.zones === 1 ? "1 zona" : `${product.zones} zonas`,
            formatCurrency(product.price),
        ],
    });
}
