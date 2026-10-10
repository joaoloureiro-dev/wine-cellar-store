import type { ProductDimensions as Dimensions } from "@/types/product";

type ProductDimensionsProps = {
    dimensions: Dimensions;
    weight?: number;
};

/** Front-view outline drawn to the real width/height ratio, with the measurements. */
export function ProductDimensions({ dimensions, weight }: ProductDimensionsProps) {
    const { width, height, depth } = dimensions;
    const frameHeight = 140;
    const frameWidth = Math.max(Math.min((width / height) * frameHeight, 100), 40);
    const x = (120 - frameWidth) / 2;

    const rows = [
        { label: "Largura", value: `${width} cm` },
        { label: "Altura", value: `${height} cm` },
        { label: "Profundidade", value: `${depth} cm` },
        ...(weight !== undefined ? [{ label: "Peso", value: `${weight} kg` }] : []),
    ];

    return (
        <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-8">
            <svg viewBox="0 0 120 172" aria-hidden="true" className="w-full text-charcoal">
                <rect x={x} y="8" width={frameWidth} height={frameHeight} rx="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <rect x={x + 6} y="14" width={frameWidth - 12} height={frameHeight - 30} rx="5" fill="none" stroke="var(--champagne)" strokeWidth="1.2" />
                <path d={`M${x} 160h${frameWidth}M${x} 156v8M${x + frameWidth} 156v8`} stroke="var(--champagne)" strokeWidth="1.2" fill="none" />
                <path d={`M${x - 10} 8v${frameHeight}M${x - 14} 8h8M${x - 14} ${8 + frameHeight}h8`} stroke="var(--champagne)" strokeWidth="1.2" fill="none" />
            </svg>

            <dl className="grid gap-2 text-sm">
                {rows.map((row) => (
                    <div key={row.label} className="flex justify-between gap-4 rounded-xl bg-background px-4 py-2.5">
                        <dt className="text-muted">{row.label}</dt>
                        <dd className="font-semibold tabular-nums text-charcoal">{row.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
