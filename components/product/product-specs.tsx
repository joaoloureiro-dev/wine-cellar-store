import {
    formatDimensions,
    formatTemperatureRange,
    formatYesNo,
    getZonesLabel,
    installationTypeLabels,
} from "@/lib/product-display";
import type { Product } from "@/types/product";

type ProductSpecsProps = {
    product: Product;
};

type SpecRow = {
    label: string;
    value: string;
};

/** Rows only some kinds have: zones and installation for cellars, room volume… */
function getKindRows(product: Product): (SpecRow | null)[] {
    switch (product.kind) {
        case "wine-cellar":
            return [
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
            ];
        case "climate-unit":
            return [
                { label: "Volume máximo da divisão", value: `${product.roomVolume} m³` },
                product.coolingPower !== undefined
                    ? { label: "Potência de refrigeração", value: `${product.coolingPower} W` }
                    : null,
            ];
        case "wine-rack":
            return [
                { label: "Capacidade", value: `${product.capacity} garrafas` },
                product.material ? { label: "Material", value: product.material } : null,
            ];
        case "accessory":
            return [];
    }
}

function getSpecRows(product: Product): SpecRow[] {
    const cellar = product.kind === "wine-cellar" ? product : null;
    const rows: (SpecRow | null)[] = [
        { label: "Marca", value: product.brand },
        { label: "Referência", value: product.sku },
        product.ean ? { label: "EAN", value: product.ean } : null,
        ...getKindRows(product),
        product.dimensions
            ? {
                  label: "Dimensões (L × A × P)",
                  value: formatDimensions(product.dimensions),
              }
            : null,
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
        cellar?.reversibleDoor !== undefined
            ? { label: "Porta reversível", value: formatYesNo(cellar.reversibleDoor) }
            : null,
        cellar?.uvProtectedGlass !== undefined
            ? {
                  label: "Vidro com proteção UV",
                  value: formatYesNo(cellar.uvProtectedGlass),
              }
            : null,
        cellar?.ledLighting !== undefined
            ? { label: "Iluminação LED", value: formatYesNo(cellar.ledLighting) }
            : null,
        cellar?.lock !== undefined
            ? { label: "Fechadura", value: formatYesNo(cellar.lock) }
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
