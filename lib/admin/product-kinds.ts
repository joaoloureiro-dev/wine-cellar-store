import type { ProductKindValue } from "@/lib/admin/product-details-schema";

/** Backoffice labels and URL tokens (?tipo=) per product kind. */
export const adminProductKinds: { value: ProductKindValue; param: string; label: string }[] = [
    { value: "WINE_CELLAR", param: "cave", label: "Cave de vinho" },
    { value: "CLIMATE_UNIT", param: "climatizador", label: "Climatizador de adega" },
    { value: "WINE_RACK", param: "garrafeira", label: "Garrafeira / estante" },
    { value: "ACCESSORY", param: "acessorio", label: "Acessório" },
];

export function adminKindFromParam(param: unknown): ProductKindValue {
    return adminProductKinds.find((kind) => kind.param === param)?.value ?? "WINE_CELLAR";
}

export function adminKindLabel(value: ProductKindValue) {
    return adminProductKinds.find((kind) => kind.value === value)?.label ?? value;
}
