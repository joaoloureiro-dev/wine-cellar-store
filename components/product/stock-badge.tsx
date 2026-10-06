import { stockStatusLabels } from "@/lib/product-display";
import type { StockStatus } from "@/types/product";

const stockStatusStyles: Record<StockStatus, string> = {
    in_stock: "bg-success",
    low_stock: "bg-warning",
    out_of_stock: "bg-danger",
    preorder: "bg-wine",
};

type StockBadgeProps = {
    status: StockStatus;
};

export function StockBadge({ status }: StockBadgeProps) {
    return (
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-charcoal">
            <span
                aria-hidden="true"
                className={`size-2 shrink-0 rounded-full ${stockStatusStyles[status]}`}
            />
            {stockStatusLabels[status]}
        </span>
    );
}
