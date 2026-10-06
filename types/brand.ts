import type { WineCellarBrand } from "@/types/product";

export type Brand = {
    slug: string;
    name: Exclude<WineCellarBrand, "Other">;
    country: string;
    description: string;
};
