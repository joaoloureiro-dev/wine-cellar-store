import "server-only";

import { calculateShippingCents, shippingMethods } from "@/lib/checkout/shipping";
import { getProductHref } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";
import type { StockStatus, WineCellarProduct } from "@/types/product";

/**
 * schema.org structured data (JSON-LD). Only facts the store actually
 * holds are published: no ratings, reviews or return policy until real
 * data exists.
 */

type JsonLdNode = Record<string, unknown>;

const organizationId = () => absoluteUrl("/#organization");

export function organizationNode(): JsonLdNode {
    return {
        "@type": "Organization",
        "@id": organizationId(),
        name: siteConfig.name,
        url: absoluteUrl("/"),
        description: siteConfig.description,
    };
}

export function websiteNode(): JsonLdNode {
    return {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        name: siteConfig.name,
        url: absoluteUrl("/"),
        inLanguage: "pt-PT",
        publisher: { "@id": organizationId() },
    };
}

const availability: Record<StockStatus, string> = {
    in_stock: "https://schema.org/InStock",
    low_stock: "https://schema.org/LimitedAvailability",
    out_of_stock: "https://schema.org/OutOfStock",
    preorder: "https://schema.org/PreOrder",
};

/** Shipping for a single unit, from the same rules the checkout charges. */
function shippingDetails(product: WineCellarProduct) {
    return shippingMethods.map((method) => ({
        "@type": "OfferShippingDetails",
        shippingRate: {
            "@type": "MonetaryAmount",
            value: (calculateShippingCents(method, Math.round(product.price * 100)) / 100).toFixed(2),
            currency: "EUR",
        },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "PT" },
    }));
}

export function productNode(product: WineCellarProduct): JsonLdNode {
    const url = absoluteUrl(getProductHref(product));

    return {
        "@type": "Product",
        "@id": `${url}#product`,
        name: product.name,
        description: product.shortDescription,
        sku: product.sku,
        ...(product.ean && /^\d{13}$/.test(product.ean) ? { gtin13: product.ean } : {}),
        brand: { "@type": "Brand", name: product.brand },
        category: "Caves de vinho",
        image: product.images.map((image) => absoluteUrl(image)),
        url,
        offers: {
            "@type": "Offer",
            url,
            price: product.price.toFixed(2),
            priceCurrency: "EUR",
            availability: availability[product.stockStatus],
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@id": organizationId() },
            shippingDetails: shippingDetails(product),
        },
    };
}

/** Breadcrumb trail; the last item (current page) uses `currentPath`. */
export function breadcrumbNode(items: { label: string; href?: string }[], currentPath: string): JsonLdNode {
    return {
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            item: absoluteUrl(item.href ?? currentPath),
        })),
    };
}

/** Wraps nodes in one @graph document. */
export function jsonLdGraph(...nodes: JsonLdNode[]) {
    return { "@context": "https://schema.org", "@graph": nodes };
}
