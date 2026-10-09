import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageIntro } from "@/components/catalog/page-intro";
import { ProductGrid } from "@/components/catalog/product-grid";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { getCategories, getCategoryBySlug } from "@/lib/categories";
import { getProductCountLabel } from "@/lib/product-display";
import { getProductsByCategory } from "@/lib/products";
import { getCategoryHref } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbNode, jsonLdGraph } from "@/lib/seo/structured-data";

// New categories render on demand; unknown slugs return 404 via notFound().
export async function generateStaticParams() {
    const categories = await getCategories();

    return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata(props: PageProps<"/categorias/[slug]">): Promise<Metadata> {
    const category = await getCategoryBySlug((await props.params).slug);

    if (!category) {
        return {};
    }

    return pageMetadata({
        title: category.seoTitle ?? category.name,
        description: category.seoDescription ?? category.description,
        path: getCategoryHref(category.slug),
    });
}

export default async function CategoryPage(props: PageProps<"/categorias/[slug]">) {
    const category = await getCategoryBySlug((await props.params).slug);

    if (!category) {
        notFound();
    }

    const products = await getProductsByCategory(category.slug);
    const breadcrumbs = [{ label: "Início", href: "/" }, { label: "Categorias", href: "/categorias" }, { label: category.name }];

    return (
        <main>
            <JsonLd data={jsonLdGraph(breadcrumbNode(breadcrumbs, getCategoryHref(category.slug)))} />
            <PageIntro
                breadcrumbs={breadcrumbs}
                eyebrow="Categoria"
                title={category.name}
                description={category.description}
                meta={<p className="rounded-full border border-border bg-surface px-4 py-2 text-charcoal">{getProductCountLabel(products.length)}</p>}
            />

            <Container className="py-10 sm:py-14 lg:py-20">
                <ProductGrid
                    products={products}
                    emptyState={{
                        title: "Ainda sem caves nesta categoria",
                        description: "Explore o catálogo completo para encontrar alternativas.",
                        action: { label: "Ver todas as caves", href: "/caves" },
                    }}
                />
            </Container>
        </main>
    );
}
