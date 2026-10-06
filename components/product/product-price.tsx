import { formatCurrency } from "@/lib/format";

type ProductPriceProps = {
    price: number;
    compareAtPrice?: number;
};

export function ProductPrice({ price, compareAtPrice }: ProductPriceProps) {
    const hasDiscount = compareAtPrice !== undefined && compareAtPrice > price;

    return (
        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="text-xl font-semibold tracking-tight text-charcoal">
                {hasDiscount && <span className="sr-only">Preço atual: </span>}
                {formatCurrency(price)}
            </span>

            {hasDiscount && (
                <s className="text-sm text-muted">
                    <span className="sr-only">Preço anterior: </span>
                    {formatCurrency(compareAtPrice)}
                </s>
            )}
        </p>
    );
}
