/** Example categories for development and tests. */
export const categories: { slug: string; name: string; description: string; position: number; kind?: "WINE_RACK" }[] = [
    {
        slug: "caves-de-servico",
        name: "Caves de serviço",
        description: "Caves com uma ou mais zonas prontas a servir: vinhos à temperatura certa para abrir a qualquer momento.",
        position: 0,
    },
    {
        slug: "caves-de-envelhecimento",
        name: "Caves de envelhecimento",
        description: "Caves de grande capacidade e temperatura estável para guardar vinho durante anos.",
        position: 1,
    },
    {
        slug: "caves-compactas",
        name: "Caves compactas",
        description: "Caves para pequenas coleções e espaços reduzidos: cozinhas, salas e apartamentos.",
        position: 2,
    },
    {
        slug: "garrafeiras-modulares",
        name: "Garrafeiras modulares",
        description: "Módulos que se empilham e juntam para crescer com a coleção.",
        position: 3,
        kind: "WINE_RACK",
    },
];
