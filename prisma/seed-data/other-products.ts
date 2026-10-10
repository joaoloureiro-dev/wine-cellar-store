/**
 * Seed products of the other kinds (climate units, racks, accessories).
 * No photos: the storefront shows a placeholder until one is uploaded.
 */
export type SeedOtherProduct = {
    id: string;
    kind: "CLIMATE_UNIT" | "WINE_RACK" | "ACCESSORY";
    slug: string;
    sku: string;
    name: string;
    brand: string;
    categories: string[];
    shortDescription: string;
    description: string;
    price: number;
    roomVolumeM3?: number;
    coolingPowerW?: number;
    capacity?: number;
    material?: string;
    dimensions?: { width: number; height: number; depth: number };
    noiseLevel?: number;
    stockQuantity: number;
    seo: { title: string; description: string };
};

export const otherProducts: SeedOtherProduct[] = [
    {
        id: "climate-001",
        kind: "CLIMATE_UNIT",
        slug: "climatizador-wine-room-25",
        sku: "CLIMA-ROOM-25",
        name: "Wine Room 25",
        brand: "Climadiff",
        categories: [],
        shortDescription: "Climatizador para adegas e divisões até 25 m³.",
        description:
            "Mantém a temperatura e a humidade certas para guardar vinho numa adega ou divisão fechada até 25 m³. Instala-se na parede, com saída de ar para uma divisão contígua.",
        price: 1890,
        roomVolumeM3: 25,
        coolingPowerW: 950,
        noiseLevel: 39,
        dimensions: { width: 40, height: 33, depth: 50 },
        stockQuantity: 3,
        seo: {
            title: "Wine Room 25 | Climatizador de Adega até 25 m³",
            description: "Climatizador de adega para divisões até 25 m³, com controlo de temperatura e humidade.",
        },
    },
    {
        id: "rack-001",
        kind: "WINE_RACK",
        slug: "garrafeira-modular-36",
        sku: "RACK-MOD-36",
        name: "Garrafeira Modular 36",
        brand: "Avintage",
        categories: ["garrafeiras-modulares"],
        shortDescription: "Módulo em madeira de pinho para 36 garrafas, empilhável.",
        description:
            "Módulo de garrafeira em madeira de pinho maciça para 36 garrafas deitadas. Os módulos empilham-se e juntam-se lado a lado para crescer com a coleção.",
        price: 129,
        capacity: 36,
        material: "Madeira de pinho",
        dimensions: { width: 60, height: 90, depth: 30 },
        stockQuantity: 12,
        seo: {
            title: "Garrafeira Modular 36 | Estante para 36 Garrafas",
            description: "Garrafeira modular em madeira de pinho para 36 garrafas, empilhável.",
        },
    },
    {
        id: "accessory-001",
        kind: "ACCESSORY",
        slug: "prateleira-deslizante-faia",
        sku: "ACC-SHELF-BEECH",
        name: "Prateleira Deslizante em Faia",
        brand: "Avintage",
        categories: [],
        shortDescription: "Prateleira extra em faia, com calhas deslizantes.",
        description: "Prateleira adicional em madeira de faia, com calhas telescópicas, para caves de 60 cm de largura.",
        price: 49,
        dimensions: { width: 52, height: 4, depth: 45 },
        stockQuantity: 20,
        seo: {
            title: "Prateleira Deslizante em Faia | Acessório para Caves",
            description: "Prateleira adicional deslizante em faia para caves de vinho de 60 cm.",
        },
    },
];
