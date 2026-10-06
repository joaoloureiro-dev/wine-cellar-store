import type {
    InstallationType,
    StockStatus,
    TemperatureRange,
    WineCellarProduct,
} from "@/types/product";

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
    product: Pick<WineCellarProduct, "price" | "compareAtPrice">,
) {
    const { price, compareAtPrice } = product;

    if (!compareAtPrice || compareAtPrice <= price) {
        return null;
    }

    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function getProductImageAlt(
    product: Pick<WineCellarProduct, "brand" | "name" | "capacity">,
) {
    return `Cave de vinho ${product.brand} ${product.name} para ${product.capacity} garrafas`;
}

export function getProductCountLabel(count: number) {
    return count === 1 ? "1 modelo" : `${count} modelos`;
}

export function formatTemperatureRange(range: TemperatureRange) {
    return `${range.min}–${range.max} °C`;
}

export function formatDimensions(dimensions: WineCellarProduct["dimensions"]) {
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
