import { formatTemperatureRange } from "@/lib/product-display";
import type { TemperatureRange } from "@/types/product";

type TemperatureZonesProps = {
    ranges: TemperatureRange[];
};

/** Fixed scale so zones from different products read the same way. */
const SCALE_MIN = 0;
const SCALE_MAX = 22;
const ticks = [0, 5, 10, 15, 20];

const zoneStyles = [
    "from-champagne to-champagne-soft",
    "from-wine to-[#8a2b3c]",
    "from-charcoal to-[#4a403b]",
];

function toPercent(value: number) {
    const clamped = Math.min(Math.max(value, SCALE_MIN), SCALE_MAX);

    return ((clamped - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;
}

/**
 * Each temperature zone drawn on a shared °C scale. Decorative bars; the
 * ranges are also written out as text for screen readers and copy-paste.
 */
export function TemperatureZones({ ranges }: TemperatureZonesProps) {
    if (ranges.length === 0) {
        return null;
    }

    return (
        <div className="space-y-5">
            <ul role="list" className="space-y-5">
                {ranges.map((range, index) => {
                    const left = toPercent(range.min);
                    const width = Math.max(toPercent(range.max) - left, 4);

                    return (
                        <li key={index}>
                            <div className="flex items-baseline justify-between gap-4 text-sm">
                                <span className="font-semibold text-charcoal">
                                    {ranges.length > 1 ? `Zona ${index + 1}` : "Zona única"}
                                </span>
                                <span className="tabular-nums text-muted">
                                    {formatTemperatureRange(range)}
                                </span>
                            </div>

                            <div aria-hidden="true" className="relative mt-2.5 h-3 rounded-full bg-surface-muted">
                                <div
                                    className={`absolute inset-y-0 origin-left animate-[grow-x_900ms_var(--ease-cellar)_both] rounded-full bg-linear-to-r motion-reduce:animate-none ${zoneStyles[index % zoneStyles.length]}`}
                                    style={{ left: `${left}%`, width: `${width}%` }}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>

            <div aria-hidden="true" className="relative h-4 text-[0.6875rem] tabular-nums text-muted">
                {ticks.map((tick) => (
                    <span
                        key={tick}
                        className="absolute -translate-x-1/2 first:translate-x-0"
                        style={{ left: `${toPercent(tick)}%` }}
                    >
                        {tick} °C
                    </span>
                ))}
            </div>
        </div>
    );
}
