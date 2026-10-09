import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { StatusBadge } from "@/components/account/status-badge";
import { Panel } from "@/components/admin/panel";
import { ProductDetailsForm } from "@/components/admin/product-details-form";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImages } from "@/components/admin/product-images";
import { requireAdmin } from "@/lib/admin/auth";
import { dateTime, describeProductAudit, stockStatusTone } from "@/lib/admin/format";
import { getCategoryOptions } from "@/lib/admin/categories";
import { getAdminProduct, getBrandOptions, getCommittedUnits, getProductAuditLog, getProductDetails } from "@/lib/admin/products";
import { listProductImages } from "@/lib/admin/product-images";
import { stockStatusLabels } from "@/lib/product-display";
import { getProductHref } from "@/lib/routes";
import type { StockStatus } from "@/types/product";

export const metadata: Metadata = { title: "Produto · Backoffice" };

export default async function AdminProductPage({ params }: PageProps<"/admin/produtos/[id]">) {
    const { id } = await params;
    await requireAdmin(`/admin/produtos/${id}`);
    const product = await getAdminProduct(id);

    if (!product) {
        notFound();
    }

    const [auditLog, committed, details, brands, images, categories] = await Promise.all([
        getProductAuditLog(product.id),
        getCommittedUnits(product.id),
        getProductDetails(product.id),
        getBrandOptions(),
        listProductImages(product.id),
        getCategoryOptions(),
    ]);

    if (!details) {
        notFound();
    }

    return (
        <>
            <Link href="/admin/produtos" className="inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-wine hover:text-wine-dark focus-visible:outline-2 focus-visible:outline-wine">
                <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
                Produtos
            </Link>

            <div className="mt-4 mb-8">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-display text-4xl font-medium tracking-[-0.035em] text-charcoal sm:text-5xl">{product.name}</h1>
                    <StatusBadge label={stockStatusLabels[product.stockStatus.toLowerCase() as StockStatus]} tone={stockStatusTone(product.stockStatus)} />
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                    {product.brand.name} · {product.sku}
                    {product.active && (
                        <Link
                            href={getProductHref({ brandSlug: product.brand.slug, slug: product.slug })}
                            className="inline-flex items-center gap-1 font-semibold text-wine underline-offset-4 hover:underline"
                        >
                            Ver na loja <ExternalLink size={13} aria-hidden="true" />
                        </Link>
                    )}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="min-w-0 space-y-6">
                    <Panel title="Preço, stock e visibilidade">
                        <ProductForm
                            product={{
                                id: product.id,
                                priceCents: product.priceCents,
                                compareAtPriceCents: product.compareAtPriceCents,
                                stockQuantity: product.stockQuantity,
                                stockStatus: product.stockStatus,
                                active: product.active,
                                featured: product.featured,
                                version: product.updatedAt.getTime(),
                            }}
                        />
                    </Panel>
                    <Panel title="Fotografias">
                        <ProductImages productId={product.id} productName={product.name} images={images} />
                    </Panel>
                    <Panel title="Detalhes do produto">
                        <ProductDetailsForm
                            brands={brands}
                            categories={categories}
                            product={{ ...details, version: details.updatedAt.getTime(), categoryIds: details.categories.map((entry) => entry.categoryId) }}
                        />
                    </Panel>
                </div>

                <div className="min-w-0 space-y-6">
                    <Panel title="Unidades comprometidas">
                        <dl className="space-y-3 text-sm">
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted">Encomendas por pagar</dt>
                                <dd className="font-semibold text-charcoal">{committed.unpaidOrders} un.</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted">Reservas com stock</dt>
                                <dd className="font-semibold text-charcoal">{committed.heldReservations} un.</dd>
                            </div>
                        </dl>
                        <p className="mt-3 text-xs text-muted">Estas unidades já não contam no stock disponível.</p>
                    </Panel>
                    <Panel title="Alterações recentes">
                        {auditLog.length > 0 ? (
                            <ul className="space-y-2 text-xs text-muted">
                                {auditLog.map((entry) => (
                                    <li key={entry.id}>
                                        <span className="font-semibold text-charcoal">{describeProductAudit(entry.action, entry.data)}</span> · {entry.actorEmail} · {dateTime.format(entry.createdAt)}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted">Sem alterações no backoffice.</p>
                        )}
                    </Panel>
                </div>
            </div>
        </>
    );
}
