import { installationTypeLabels } from "@/lib/product-display";
import type { InstallationType, TemperatureZoneCount } from "@/types/product";

/**
 * Catalogue filter & sort options.
 *
 * `value` is the public, URL-facing token (Portuguese, stable for SEO and
 * shared links); the remaining fields map it onto the domain model.
 */

export const capacitySegments = [
    { value: "ate-20", label: "Até 20 garrafas", min: 0, max: 20 },
    { value: "21-50", label: "21 a 50 garrafas", min: 21, max: 50 },
    { value: "51-100", label: "51 a 100 garrafas", min: 51, max: 100 },
    {
        value: "mais-100",
        label: "Mais de 100 garrafas",
        min: 101,
        max: Number.POSITIVE_INFINITY,
    },
] as const;

export type CapacitySegmentValue = (typeof capacitySegments)[number]["value"];

export const installationOptions = [
    { value: "livre-instalacao", type: "freestanding" },
    { value: "encastre", type: "built-in" },
    { value: "sob-bancada", type: "undercounter" },
] as const satisfies readonly { value: string; type: InstallationType }[];

export type InstallationValue = (typeof installationOptions)[number]["value"];

export function getInstallationLabel(value: InstallationValue) {
    const option = installationOptions.find((item) => item.value === value);

    return option ? installationTypeLabels[option.type] : value;
}

export const zoneOptions = [1, 2, 3] as const satisfies readonly TemperatureZoneCount[];

export const noiseOptions = [38, 40, 42] as const;

export const widthOptions = [40, 50, 60] as const;

/** Lowest temperature the cellar must be able to reach (°C). */
export const temperatureOptions = [5, 7, 10] as const;

export const sortOptions = [
    { value: "relevancia", label: "Relevância" },
    { value: "preco-asc", label: "Preço: mais baixo" },
    { value: "preco-desc", label: "Preço: mais alto" },
    { value: "capacidade-asc", label: "Capacidade: menor" },
    { value: "capacidade-desc", label: "Capacidade: maior" },
    { value: "novidades", label: "Novidades" },
] as const;

export type SortValue = (typeof sortOptions)[number]["value"];

export const DEFAULT_SORT: SortValue = "relevancia";

/** URL search param names. */
export const catalogParams = {
    brand: "marca",
    minPrice: "preco_min",
    maxPrice: "preco_max",
    capacity: "capacidade",
    zones: "zonas",
    installation: "instalacao",
    availability: "disponibilidade",
    energyClass: "classe",
    maxNoise: "ruido_max",
    maxWidth: "largura_max",
    minTemperature: "temp_min",
    sort: "ordenar",
} as const;

export const IN_STOCK_VALUE = "em-stock";
