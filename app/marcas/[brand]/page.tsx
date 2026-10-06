import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageIntro } from "@/components/catalog/page-intro";
import { ProductGrid } from "@/components/catalog/product-grid";
import { Container } from "@/components/layout/container";
import { getBrandBySlug, getBrands } from "@/lib/brands";
import { getProductCountLabel } from "@/lib/product-display";
import { getProductsByBrand } from "@/lib/products";

export const dynamicParams = false;

export async function generateStaticParams() {
    const brands = await getBrands();

    return brands.map((brand) => ({ brand: brand.slug }));
}

export async function generateMetadata(
    props: PageProps<"/marcas/[brand]">,
): Promise<Metadata> {
    const { brand: brandSlug } = await props.params;
    const brand = await getBrandBySlug(brandSlug);

    if (!brand) {
        return {};
    }

    return {
        title: `Caves de Vinho ${brand.name}`,
        description: `Caves de vinho ${brand.name}. ${brand.description}`,
    };
}

export default async function BrandPage(props: PageProps<"/marcas/[brand]">) {
    const { brand: brandSlug } = await props.params;
    const brand = await getBrandBySlug(brandSlug);

    if (!brand) {
        notFound();
    }

    const products = await getProductsByBrand(brand.slug);

    return (
        <main>
            <PageIntro
                breadcrumbs={[
                    { label: "Início", href: "/" },
                    { label: "Marcas", href: "/marcas" },
                    { label: brand.name },
                ]}
                eyebrow={`Marca · ${brand.country}`}
                title={brand.name}
                description={brand.description}
                meta={<p>{getProductCountLabel(products.length)}</p>}
            />

            <Container className="py-10 sm:py-14 lg:py-20">
                <ProductGrid products={products} />
            </Container>
        </main>
    );
}
