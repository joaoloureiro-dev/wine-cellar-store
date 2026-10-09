import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro } from "@/components/catalog/page-intro";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { capacitySegments, DEFAULT_SORT, installationOptions, type CapacitySegmentValue, type InstallationValue } from "@/lib/catalog/options";
import { getCatalogHref, type CatalogQuery } from "@/lib/catalog/query";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbNode, jsonLdGraph } from "@/lib/seo/structured-data";
import type { TemperatureZoneCount } from "@/types/product";

const title = "Como escolher a sua cave de vinho";
const description =
    "Guia prático para escolher uma cave de vinho: capacidade, zonas de temperatura, tipo de instalação, ruído, humidade e medidas.";
const breadcrumbs = [{ label: "Início", href: "/" }, { label: "Como escolher" }];

export const metadata: Metadata = pageMetadata({ title, description, path: "/guia" });

/** Catalogue link with only the given filters. */
function catalog(filters: Partial<Pick<CatalogQuery, "capacity" | "zones" | "installation" | "maxNoise">>) {
    const none: CatalogQuery = { brands: [], categories: [], capacity: [], zones: [], installation: [], inStock: false, energyClasses: [], sort: DEFAULT_SORT };

    return getCatalogHref({ ...none, ...filters });
}

const capacityLink = (value: CapacitySegmentValue) => catalog({ capacity: [value] });
const zonesLink = (zones: TemperatureZoneCount) => catalog({ zones: [zones] });
const installationLink = (value: InstallationValue) => catalog({ installation: [value] });

const servingTemperatures = [
    ["Espumantes e champanhe", "6–8 °C"],
    ["Brancos leves e rosés", "8–10 °C"],
    ["Brancos encorpados", "10–13 °C"],
    ["Tintos leves", "12–14 °C"],
    ["Tintos encorpados e Porto", "15–18 °C"],
] as const;

const installationCopy: Record<InstallationValue, { title: string; text: string }> = {
    "livre-instalacao": {
        title: "Livre instalação",
        text: "Fica solta, em qualquer divisão. Precisa de espaço livre à volta para ventilar (o fabricante indica quanto) e não deve ser metida num móvel.",
    },
    encastre: {
        title: "Encastre",
        text: "Integra-se numa coluna de cozinha. Ventila pela frente, por isso pode ficar à face dos móveis. Meça o vão e compare com as medidas de encastre do fabricante, não com as medidas exteriores.",
    },
    "sob-bancada": {
        title: "Sob bancada",
        text: "Fica debaixo da bancada, como uma máquina de lavar loiça, e também ventila pela frente. Confirme a altura livre por baixo da bancada e a largura do vão.",
    },
};

export default function GuidePage() {
    return (
        <main>
            <JsonLd data={jsonLdGraph(breadcrumbNode(breadcrumbs, "/guia"))} />
            <PageIntro
                breadcrumbs={breadcrumbs}
                eyebrow="Guia"
                title="Como escolher"
                description="Quatro perguntas para encontrar a cave certa: quantas garrafas, que vinhos, onde a vai pôr e que cuidados exige o espaço."
            />

            <Container className="py-10 sm:py-14">
                <article className="max-w-3xl space-y-12 text-base leading-7 text-charcoal [&_a]:font-semibold [&_a]:text-wine [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:font-medium [&_h2]:tracking-[-0.02em] [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-semibold [&_li]:mt-1.5 [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
                    <section id="capacidade" aria-labelledby="capacidade-title" className="scroll-mt-24">
                        <h2 id="capacidade-title">1. Quantas garrafas?</h2>
                        <p>
                            Conte as garrafas que tem hoje e pense em quantas vai juntar nos próximos anos. Uma coleção cresce quase sempre: é comum
                            escolher uma cave com folga em relação ao que tem hoje, para não ficar sem espaço ao fim de pouco tempo.
                        </p>
                        <p>
                            A capacidade indicada pelos fabricantes é medida com garrafas de 75 cl de formato bordalês. Garrafas mais largas (borgonha,
                            espumante, magnum) ocupam mais espaço, por isso numa coleção variada cabem menos garrafas do que o número anunciado.
                        </p>
                        <ul>
                            {capacitySegments.map((segment) => (
                                <li key={segment.value}>
                                    <Link href={capacityLink(segment.value)}>{segment.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section id="zonas" aria-labelledby="zonas-title" className="scroll-mt-24">
                        <h2 id="zonas-title">2. Uma, duas ou três zonas de temperatura?</h2>
                        <p>
                            Para <strong>guardar</strong> vinho durante anos, todos os vinhos se dão bem à mesma temperatura constante, em geral entre
                            10 e 14 °C. Mais importante do que o valor exato é que não oscile. Para <strong>servir</strong>, cada vinho tem a sua
                            temperatura.
                        </p>
                        <h3>
                            <Link href={zonesLink(1)}>1 zona</Link>
                        </h3>
                        <p>Ideal para envelhecer e conservar, ou para quem bebe sobretudo um tipo de vinho.</p>
                        <h3>
                            <Link href={zonesLink(2)}>2 zonas</Link>
                        </h3>
                        <p>Uma zona para conservar ou para tintos e outra mais fria para brancos e espumantes, prontos a servir.</p>
                        <h3>
                            <Link href={zonesLink(3)}>3 zonas</Link>
                        </h3>
                        <p>Para coleções variadas: conservação, tintos à temperatura de serviço e brancos ou espumantes, tudo na mesma cave.</p>

                        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
                            <table className="w-full min-w-[20rem] text-left text-sm">
                                <caption className="px-3 pt-3 text-left text-xs text-muted">Temperaturas de serviço habituais</caption>
                                <thead className="text-charcoal">
                                    <tr>
                                        <th scope="col" className="p-3 font-semibold">Vinho</th>
                                        <th scope="col" className="p-3 font-semibold">Servir a</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {servingTemperatures.map(([wine, temperature]) => (
                                        <tr key={wine}>
                                            <td className="p-3">{wine}</td>
                                            <td className="p-3 font-semibold whitespace-nowrap">{temperature}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section id="instalacao" aria-labelledby="instalacao-title" className="scroll-mt-24">
                        <h2 id="instalacao-title">3. Onde a vai instalar?</h2>
                        {installationOptions.map((option) => (
                            <div key={option.value}>
                                <h3>
                                    <Link href={installationLink(option.value)}>{installationCopy[option.value].title}</Link>
                                </h3>
                                <p>{installationCopy[option.value].text}</p>
                            </div>
                        ))}
                        <p className="mt-4">
                            Em qualquer caso, meça também o caminho até ao local (portas, escadas, elevador) e confirme se a porta pode abrir para o
                            lado que lhe convém: muitos modelos têm porta reversível.
                        </p>
                    </section>

                    <section id="cuidados" aria-labelledby="cuidados-title" className="scroll-mt-24">
                        <h2 id="cuidados-title">4. O que mais conta</h2>
                        <ul>
                            <li>
                                <strong>Ruído.</strong> Numa sala, num quarto ou numa cozinha aberta, prefira valores baixos de decibéis. Pode filtrar
                                o catálogo por <Link href={catalog({ maxNoise: 38 })}>até 38 dB</Link> ou{" "}
                                <Link href={catalog({ maxNoise: 40 })}>até 40 dB</Link>.
                            </li>
                            <li>
                                <strong>Vibração.</strong> As vibrações perturbam o vinho que envelhece. Instale a cave nivelada, longe de máquinas de
                                lavar e de outras fontes de vibração.
                            </li>
                            <li>
                                <strong>Humidade.</strong> Uma humidade moderada (em geral entre 50 e 80%) evita que as rolhas sequem. Guarde as garrafas
                                deitadas, para a rolha se manter húmida.
                            </li>
                            <li>
                                <strong>Luz.</strong> A luz, sobretudo a ultravioleta, degrada o vinho. Prefira portas com vidro de proteção UV e
                                iluminação LED, que aquece pouco.
                            </li>
                            <li>
                                <strong>Local.</strong> Evite sol direto e fontes de calor (forno, radiador). Respeite a temperatura ambiente de
                                funcionamento indicada pelo fabricante, sobretudo em garagens e arrecadações.
                            </li>
                            <li>
                                <strong>Consumo.</strong> A cave está sempre ligada: compare a classe energética e o consumo anual em kWh na ficha
                                técnica.
                            </li>
                            <li>
                                <strong>Prateleiras e fechadura.</strong> Prateleiras deslizantes facilitam o acesso às garrafas; uma fechadura é útil
                                com crianças em casa ou em espaços partilhados.
                            </li>
                        </ul>
                    </section>

                    <section id="resumo" aria-labelledby="resumo-title" className="scroll-mt-24 rounded-xl border border-border bg-surface p-5 sm:p-6">
                        <h2 id="resumo-title">Em resumo</h2>
                        <ul>
                            <li>Escolha a capacidade a pensar na coleção que vai ter, não só na que tem hoje.</li>
                            <li>Uma zona para guardar; duas ou três para guardar e servir.</li>
                            <li>Encastre e sob bancada ventilam pela frente; uma cave de livre instalação precisa de espaço à volta.</li>
                            <li>Meça o vão e o caminho até lá, e veja o ruído e o consumo na ficha técnica.</li>
                        </ul>
                        <p className="mt-4">
                            <Link href="/caves">Ver todas as caves</Link> · <Link href="/pesquisa">Pesquisar por modelo ou marca</Link>
                        </p>
                    </section>
                </article>
            </Container>
        </main>
    );
}
