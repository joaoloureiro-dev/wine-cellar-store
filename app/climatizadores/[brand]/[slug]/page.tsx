import type { Metadata } from "next";

import { KindProductPage, kindProductMetadata, kindProductStaticParams } from "@/components/product/kind-product-page";

export function generateStaticParams() {
    return kindProductStaticParams("climate-unit");
}

export function generateMetadata({ params }: PageProps<"/climatizadores/[brand]/[slug]">): Promise<Metadata> {
    return kindProductMetadata("climate-unit", params);
}

export default function Page({ params }: PageProps<"/climatizadores/[brand]/[slug]">) {
    return <KindProductPage kind="climate-unit" params={params} />;
}
