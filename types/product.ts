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

/** What the store sells. Wine cellars keep their own URLs under /caves. */
export type ProductKind = "wine-cellar" | "climate-unit" | "wine-rack" | "accessory";

/** Fields every product has, whatever its kind. */
export type BaseProduct = {
    id: string;
    kind: ProductKind;

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

    weight?: number;

    energyClass?: string;
    annualEnergyConsumption?: number;
    noiseLevel?: number;

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

export type WineCellarProduct = BaseProduct & {
    kind: "wine-cellar";

    capacity: number;
    zones: TemperatureZoneCount;

    temperatureRanges: TemperatureRange[];

    installationType: InstallationType;

    dimensions: ProductDimensions;

    reversibleDoor?: boolean;
    uvProtectedGlass?: boolean;
    ledLighting?: boolean;
    lock?: boolean;
};

/** Climatizador de adega: cools a whole room. */
export type ClimateUnitProduct = BaseProduct & {
    kind: "climate-unit";
    /** Largest room it can keep at temperature, in m³. */
    roomVolume: number;
    /** Cooling power in watts. */
    coolingPower?: number;
    dimensions?: ProductDimensions;
};

/** Garrafeira/estante: stores bottles, no refrigeration. */
export type WineRackProduct = BaseProduct & {
    kind: "wine-rack";
    capacity: number;
    material?: string;
    dimensions?: ProductDimensions;
};

export type AccessoryProduct = BaseProduct & {
    kind: "accessory";
    dimensions?: ProductDimensions;
};

export type Product = WineCellarProduct | ClimateUnitProduct | WineRackProduct | AccessoryProduct;