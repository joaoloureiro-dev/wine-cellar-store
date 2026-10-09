/** Brand display name. Brands are data (database), not a closed list. */
export type WineCellarBrand = string;

export type InstallationType =
    | "freestanding"
    | "built-in"
    | "undercounter";

export type TemperatureZoneCount = 1 | 2 | 3;

export type StockStatus =
    | "in_stock"
    | "low_stock"
    | "out_of_stock"
    | "preorder";

export type ProductDimensions = {
    width: number;
    height: number;
    depth: number;
};

export type TemperatureRange = {
    min: number;
    max: number;
};

export type WineCellarProduct = {
    id: string;

    slug: string;
    sku: string;
    ean?: string;

    name: string;
    brand: WineCellarBrand;
    brandSlug: string;
    /** Categories the product belongs to, in display order. */
    categories: { slug: string; name: string }[];

    shortDescription: string;
    description: string;

    price: number;
    compareAtPrice?: number;

    capacity: number;
    zones: TemperatureZoneCount;

    temperatureRanges: TemperatureRange[];

    installationType: InstallationType;

    dimensions: ProductDimensions;
    weight?: number;

    energyClass?: string;
    annualEnergyConsumption?: number;

    noiseLevel?: number;

    reversibleDoor?: boolean;
    uvProtectedGlass?: boolean;
    ledLighting?: boolean;
    lock?: boolean;

    stockStatus: StockStatus;
    stockQuantity: number;

    featured: boolean;
    active: boolean;

    images: string[];

    seo: {
        title: string;
        description: string;
    };

    createdAt: string;
    updatedAt: string;
};