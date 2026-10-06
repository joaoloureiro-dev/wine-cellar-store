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
