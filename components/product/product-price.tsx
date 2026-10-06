import { formatCurrency } from "@/lib/format";

type ProductPriceProps = {
    price: number;
    compareAtPrice?: number;
    size?: "md" | "lg";
};

const priceSizes = {
    md: { current: "text-xl", previous: "text-sm" },
    lg: { current: "text-3xl", previous: "text-base" },
} as const;

export function ProductPrice({
    price,
    compareAtPrice,
    size = "md",
}: ProductPriceProps) {
    const hasDiscount = compareAtPrice !== undefined && compareAtPrice > price;

    return (
        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span
                className={`${priceSizes[size].current} font-semibold tracking-tight text-charcoal`}
            >
                {hasDiscount && <span className="sr-only">Preço atual: </span>}
                {formatCurrency(price)}
            </span>

            {hasDiscount && (
                <s className={`${priceSizes[size].previous} text-muted`}>
                    <span className="sr-only">Preço anterior: </span>
                    {formatCurrency(compareAtPrice)}
                </s>
            )}
        </p>
    );
}
