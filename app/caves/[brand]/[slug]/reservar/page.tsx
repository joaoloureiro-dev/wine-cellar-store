import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { ProductImage } from "@/components/product/product-image";
import { ProductPrice } from "@/components/product/product-price";
import { StockBadge } from "@/components/product/stock-badge";
import { ReservationForm } from "@/components/reservations/reservation-form";
import { ReservationSteps } from "@/components/reservations/reservation-steps";
import { getDefaultAddress } from "@/lib/account/queries";
import { getSession } from "@/lib/auth/session";
import { getProductImageAlt, getZonesLabel } from "@/lib/product-display";
import { getProductBySlug } from "@/lib/products";
import { getBrandHref, getProductHref } from "@/lib/routes";

type ReservePageProps = PageProps<"/caves/[brand]/[slug]/reservar">;

/** Per-request page (session, cookies or private data): rendered on demand. */
export const instant = false;

export async function generateMetadata(props: ReservePageProps): Promise<Metadata> {
    const { slug } = await props.params;
    const product = await getProductBySlug(slug);

    return {
        title: product ? `Reservar ${product.name}` : "Reservar",
        robots: { index: false, follow: true },
    };
}

export default async function ReserveProductPage(props: ReservePageProps) {
    const { brand: brandSlug, slug } = await props.params;
    const product = await getProductBySlug(slug);

    if (!product) {
        notFound();
    }

    if (product.brandSlug !== brandSlug) {
        permanentRedirect(`${getProductHref(product)}/reservar`);
    }

    const productHref = getProductHref(product);
    const session = await getSession();
    const address = session ? await getDefaultAddress(session.user.id) : null;

    return (
        <main>
            <Container className="py-8 sm:py-12 lg:py-16">
                <Breadcrumbs
                    items={[
                        { label: "Início", href: "/" },
                        { label: "Caves de Vinho", href: "/caves" },
                        { label: product.brand, href: getBrandHref(product.brandSlug) },
                        { label: product.name, href: productHref },
                        { label: "Reservar" },
                    ]}
                />

                {/* Mobile order: product, form, steps. Desktop: product + steps | form. */}
                <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-x-16 lg:gap-y-8">
                    <aside aria-label="Produto a reservar" className="lg:col-start-1 lg:row-start-1">
                        <div className="flex gap-5 rounded-xl border border-border bg-surface p-5">
                            <div className="relative aspect-4/5 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-muted sm:w-28">
                                <ProductImage
                                    src={product.images[0]}
                                    alt={getProductImageAlt(product)}
                                    sizes="112px"
                                />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-wine">
                                    {product.brand}
                                </p>
                                <p className="mt-1 font-display text-2xl font-semibold leading-tight text-charcoal">
                                    {product.name}
                                </p>
                                <p className="mt-1 text-xs text-muted">
                                    {product.capacity} garrafas · {getZonesLabel(product.zones)}
                                </p>
                                <div className="mt-3">
                                    <ProductPrice
                                        price={product.price}
                                        compareAtPrice={product.compareAtPrice}
                                    />
                                </div>
                                <div className="mt-2">
                                    <StockBadge status={product.stockStatus} />
                                </div>
                            </div>
                        </div>
                    </aside>

                    <section
                        aria-labelledby="reservation-heading"
                        className="lg:col-start-2 lg:row-span-2 lg:row-start-1"
                    >
                        <h1
                            id="reservation-heading"
                            className="font-display text-4xl font-medium tracking-[-0.035em] text-charcoal sm:text-5xl"
                        >
                            Reservar {product.name}
                        </h1>

                        <p className="mt-4 max-w-xl text-base leading-7 text-muted">
                            Deixe os seus contactos e entraremos em contacto para confirmar a
                            disponibilidade, o prazo e as condições da reserva.
                        </p>

                        <div className="mt-8">
                            <ReservationForm
                                productId={product.id}
                                defaults={
                                    session
                                        ? { name: session.user.name, email: session.user.email, phone: address?.phone }
                                        : undefined
                                }
                            />
                        </div>
                    </section>

                    <section
                        aria-labelledby="reservation-steps-heading"
                        className="lg:col-start-1 lg:row-start-2"
                    >
                        <h2
                            id="reservation-steps-heading"
                            className="text-xs font-bold uppercase tracking-[0.16em] text-charcoal"
                        >
                            Como funciona
                        </h2>
                        <div className="mt-4">
                            <ReservationSteps />
                        </div>
                    </section>
                </div>
            </Container>
        </main>
    );
}
