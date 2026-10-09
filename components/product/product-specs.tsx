import {
    formatDimensions,
    formatTemperatureRange,
    formatYesNo,
    getZonesLabel,
    installationTypeLabels,
} from "@/lib/product-display";
import type { WineCellarProduct } from "@/types/product";

type ProductSpecsProps = {
    product: WineCellarProduct;
};

type SpecRow = {
    label: string;
    value: string;
};

function getSpecRows(product: WineCellarProduct): SpecRow[] {
    const rows: (SpecRow | null)[] = [
        { label: "Marca", value: product.brand },
        { label: "Referência", value: product.sku },
        product.ean ? { label: "EAN", value: product.ean } : null,
        { label: "Capacidade", value: `${product.capacity} garrafas` },
        { label: "Zonas de temperatura", value: getZonesLabel(product.zones) },
        ...product.temperatureRanges.map((range, index) => ({
            label:
                product.temperatureRanges.length > 1
                    ? `Temperatura (zona ${index + 1})`
                    : "Temperatura",
            value: formatTemperatureRange(range),
        })),
        {
            label: "Tipo de instalação",
            value: installationTypeLabels[product.installationType],
        },
        {
            label: "Dimensões (L × A × P)",
            value: formatDimensions(product.dimensions),
        },
        product.weight !== undefined
            ? { label: "Peso", value: `${product.weight} kg` }
            : null,
        product.energyClass
            ? { label: "Classe energética", value: product.energyClass }
            : null,
        product.annualEnergyConsumption !== undefined
            ? {
                  label: "Consumo anual de energia",
                  value: `${product.annualEnergyConsumption} kWh/ano`,
              }
            : null,
        product.noiseLevel !== undefined
            ? { label: "Nível de ruído", value: `${product.noiseLevel} dB` }
            : null,
        product.reversibleDoor !== undefined
            ? { label: "Porta reversível", value: formatYesNo(product.reversibleDoor) }
            : null,
        product.uvProtectedGlass !== undefined
            ? {
                  label: "Vidro com proteção UV",
                  value: formatYesNo(product.uvProtectedGlass),
              }
            : null,
        product.ledLighting !== undefined
            ? { label: "Iluminação LED", value: formatYesNo(product.ledLighting) }
            : null,
        product.lock !== undefined
            ? { label: "Fechadura", value: formatYesNo(product.lock) }
            : null,
    ];

    return rows.filter((row): row is SpecRow => row !== null);
}

export function ProductSpecs({ product }: ProductSpecsProps) {
    return (
        <dl className="divide-y divide-border">
            {getSpecRows(product).map((row) => (
                <div
                    key={row.label}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 py-3.5 text-sm"
                >
                    <dt className="text-muted">{row.label}</dt>
                    <dd className="text-right font-semibold tabular-nums text-charcoal">
                        {row.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
