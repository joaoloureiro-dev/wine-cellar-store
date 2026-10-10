import { Box, Gauge, Layers, Ruler, Thermometer, TreePine, Volume2, Wine, type LucideIcon } from "lucide-react";

/** Icon per fact label from getProductFacts (lib/product-display.ts). */
const factIcons: Record<string, LucideIcon> = {
    Capacidade: Wine,
    Zonas: Layers,
    Temperatura: Thermometer,
    "Divisão até": Box,
    Potência: Gauge,
    Ruído: Volume2,
    Material: TreePine,
    Medidas: Ruler,
};

export function getFactIcon(label: string): LucideIcon {
    return factIcons[label] ?? Wine;
}
