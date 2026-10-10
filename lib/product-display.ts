import type {
    InstallationType,
    Product,
    ProductDimensions,
    ProductKind,
    StockStatus,
    TemperatureRange,
    WineCellarProduct,
} from "@/types/product";

/** Singular and plural names per kind (headings, alt texts, structured data). */
export const productKindLabels: Record<ProductKind, { singular: string; plural: string }> = {
    "wine-cellar": { singular: "Cave de vinho", plural: "Caves de vinho" },
    "climate-unit": { singular: "Climatizador de adega", plural: "Climatizadores de adega" },
    "wine-rack": { singular: "Garrafeira", plural: "Garrafeiras e estantes" },
    accessory: { singular: "Acessório", plural: "Acessórios" },
};

export const installationTypeLabels: Record<InstallationType, string> = {
    freestanding: "Livre instalação",
    "built-in": "Encastre",
    undercounter: "Sob bancada",
};

export const stockStatusLabels: Record<StockStatus, string> = {
    in_stock: "Em stock",
    low_stock: "Últimas unidades",
    out_of_stock: "Esgotado",
    preorder: "Disponível para reserva",
};

export function getZonesLabel(zones: WineCellarProduct["zones"]) {
    return zones === 1 ? "1 zona" : `${zones} zonas`;
}

export function getTemperatureLabel(ranges: TemperatureRange[]) {
    if (ranges.length === 0) {
        return null;
    }

    const min = Math.min(...ranges.map((range) => range.min));
    const max = Math.max(...ranges.map((range) => range.max));

    return `${min}–${max} °C`;
}

export function getDiscountPercentage(
    product: Pick<Product, "price" | "compareAtPrice">,
) {
    const { price, compareAtPrice } = product;

    if (!compareAtPrice || compareAtPrice <= price) {
        return null;
    }

    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function getProductImageAlt(product: Product) {
    const name = `${productKindLabels[product.kind].singular} ${product.brand} ${product.name}`;

    switch (product.kind) {
        case "wine-cellar":
        case "wine-rack":
            return `${name} para ${product.capacity} garrafas`;
        case "climate-unit":
            return `${name} para divisões até ${product.roomVolume} m³`;
        default:
            return name;
    }
}

/**
 * Key facts for cards and the cart, per kind: capacity and zones for
 * cellars, room volume for climate units, capacity and material for racks.
 */
export function getProductFacts(product: Product): { label: string; value: string }[] {
    switch (product.kind) {
        case "wine-cellar": {
            const temperature = getTemperatureLabel(product.temperatureRanges);
            return [
                { label: "Capacidade", value: `${product.capacity} garrafas` },
                { label: "Zonas", value: getZonesLabel(product.zones) },
                ...(temperature ? [{ label: "Temperatura", value: temperature }] : []),
            ];
        }
        case "climate-unit":
            return [
                { label: "Divisão até", value: `${product.roomVolume} m³` },
                ...(product.coolingPower ? [{ label: "Potência", value: `${product.coolingPower} W` }] : []),
                ...(product.noiseLevel ? [{ label: "Ruído", value: `${product.noiseLevel} dB` }] : []),
            ];
        case "wine-rack":
            return [
                { label: "Capacidade", value: `${product.capacity} garrafas` },
                ...(product.material ? [{ label: "Material", value: product.material }] : []),
            ];
        case "accessory":
            return product.dimensions ? [{ label: "Medidas", value: formatDimensions(product.dimensions) }] : [];
    }
}

export function getProductCountLabel(count: number) {
    return count === 1 ? "1 modelo" : `${count} modelos`;
}

export function formatTemperatureRange(range: TemperatureRange) {
    return `${range.min}–${range.max} °C`;
}

export function formatDimensions(dimensions: ProductDimensions) {
    return `${dimensions.width} × ${dimensions.height} × ${dimensions.depth} cm`;
}

export function formatYesNo(value: boolean) {
    return value ? "Sim" : "Não";
}

/** Short, customer-facing highlights derived from the technical data. */
export function getProductHighlights(product: WineCellarProduct) {
    const highlights: string[] = [];

    if (product.zones > 1) {
        highlights.push(
            `${product.zones} zonas com temperatura independente (${product.temperatureRanges
                .map(formatTemperatureRange)
                .join(" e ")})`,
        );
    } else if (product.temperatureRanges[0]) {
        highlights.push(
            `Temperatura regulável entre ${formatTemperatureRange(product.temperatureRanges[0])}`,
        );
    }

    if (product.uvProtectedGlass) {
        highlights.push("Porta de vidro com proteção UV");
    }

    if (product.ledLighting) {
        highlights.push("Iluminação interior LED");
    }

    if (product.lock) {
        highlights.push("Fechadura de segurança");
    }

    if (product.reversibleDoor) {
        highlights.push("Porta reversível");
    }

    if (product.noiseLevel !== undefined) {
        highlights.push(`Funcionamento silencioso (${product.noiseLevel} dB)`);
    }

    return highlights;
}
