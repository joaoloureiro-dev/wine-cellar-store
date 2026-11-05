import Link from "next/link";

import { Container } from "@/components/layout/container";
import { buttonStyles } from "@/components/ui/button-styles";
import { formatCurrency } from "@/lib/format";
import { installationTypeLabels, stockStatusLabels } from "@/lib/product-display";
import { getProductsByKind } from "@/lib/products";
import { getProductHref } from "@/lib/routes";
import type { WineCellarProduct } from "@/types/product";

export const metadata = {
    title: "Comparar caves de vinho",
    robots: { index: false, follow: true },
};

export const instant = false;

const rows: [string, (product: WineCellarProduct) => string][] = [
    ["Preço", (product) => formatCurrency(product.price)],
    ["Capacidade", (product) => `${product.capacity} garrafas`],
    ["Instalação", (product) => installationTypeLabels[product.installationType]],
    ["Largura × altura × profundidade", ({ dimensions }) => `${dimensions.width} × ${dimensions.height} × ${dimensions.depth} cm`],
    ["Zonas de temperatura", (product) => String(product.zones)],
    ["Ruído", (product) => product.noiseLevel === undefined ? "Por confirmar" : `${product.noiseLevel} dB`],
    ["Disponibilidade", (product) => stockStatusLabels[product.stockStatus]],
];

export default async function CompareCellars({ searchParams }: PageProps<"/caves/comparar">) {
    const [params, catalogue] = await Promise.all([searchParams, getProductsByKind("wine-cellar")]);
    const cellars = catalogue.filter((product): product is WineCellarProduct => product.kind === "wine-cellar");
    const input = Array.isArray(params.modelo) ? params.modelo : [params.modelo];
    const selected = [...new Set(input.slice(0, 3))].flatMap((id) => {
        const product = cellars.find((cellar) => cellar.id === id);
        return product ? [product] : [];
    });

    return (
        <main>
            <Container className="py-10 sm:py-16">
                <Link href="/caves" className="text-sm font-semibold text-wine underline">Voltar ao catálogo</Link>
                <h1 className="mt-4 font-display text-4xl text-charcoal sm:text-5xl">Comparar caves de vinho</h1>
                <p className="mt-3 text-muted">Escolha até três modelos para comparar dimensões, capacidade e disponibilidade.</p>
                <form action="/caves/comparar" className="mt-6 grid gap-4 sm:grid-cols-3">
                    {[0, 1, 2].map((index) => (
                        <label key={index} className="grid min-w-0 gap-2 text-sm font-semibold text-charcoal">
                            Modelo {index + 1}
                            <select name="modelo" defaultValue={selected[index]?.id ?? ""} className="w-full rounded-xl border border-border bg-surface p-3">
                                <option value="">Escolher modelo</option>
                                {cellars.map((product) => <option key={product.id} value={product.id}>{product.brand} {product.name}</option>)}
                            </select>
                        </label>
                    ))}
                    <button className={buttonStyles({ variant: "primary" })}>Comparar modelos</button>
                </form>
                {selected.length >= 2 && (
                    <div tabIndex={0} role="region" aria-label="Comparação de caves" className="mt-8 overflow-x-auto rounded-2xl border border-border">
                        <table className="w-full min-w-xl text-left text-sm text-charcoal">
                            <thead className="bg-surface">
                                <tr>
                                    <th scope="col" className="p-4">Característica</th>
                                    {selected.map((product) => (
                                        <th key={product.id} scope="col" className="p-4">
                                            <Link href={getProductHref(product)} className="text-wine underline">{product.brand} {product.name}</Link>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(([label, value]) => (
                                    <tr key={label} className="border-t border-border">
                                        <th scope="row" className="p-4 font-medium">{label}</th>
                                        {selected.map((product) => <td key={product.id} className="p-4">{value(product)}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {params.modelo !== undefined && selected.length < 2 && (
                    <p className="mt-6 text-sm text-muted">Escolha pelo menos dois modelos diferentes para ver a comparação.</p>
                )}
            </Container>
        </main>
    );
}
