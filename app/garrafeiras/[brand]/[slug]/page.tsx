import type { Metadata } from "next";

import { KindProductPage, kindProductMetadata, kindProductStaticParams } from "@/components/product/kind-product-page";

export function generateStaticParams() {
    return kindProductStaticParams("wine-rack");
}

export function generateMetadata({ params }: PageProps<"/garrafeiras/[brand]/[slug]">): Promise<Metadata> {
    return kindProductMetadata("wine-rack", params);
}

export default function Page({ params }: PageProps<"/garrafeiras/[brand]/[slug]">) {
    return <KindProductPage kind="wine-rack" params={params} />;
}
