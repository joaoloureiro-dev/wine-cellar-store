import type { Metadata } from "next";

import { PageIntro } from "@/components/catalog/page-intro";
import { ProductGrid } from "@/components/catalog/product-grid";
import { Container } from "@/components/layout/container";
import { getProductCountLabel } from "@/lib/product-display";
import { getActiveProducts } from "@/lib/products";

export const metadata: Metadata = {
    title: "Caves de Vinho",
    description:
        "Catálogo de caves de vinho de livre instalação, encastre e sob bancada, com uma, duas ou três zonas de temperatura.",
};

export default async function CatalogPage() {
    const products = await getActiveProducts();

    return (
        <main>
            <PageIntro
                breadcrumbs={[
                    { label: "Início", href: "/" },
                    { label: "Caves de Vinho" },
                ]}
                eyebrow="Catálogo"
                title="Caves de Vinho"
                description="Compare capacidades, zonas de temperatura e tipos de instalação para encontrar a cave certa para a sua coleção."
                meta={<p>{getProductCountLabel(products.length)}</p>}
            />

            <Container className="py-10 sm:py-14 lg:py-20">
                <ProductGrid products={products} />
            </Container>
        </main>
    );
}
