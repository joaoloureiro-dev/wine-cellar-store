import type { Metadata } from "next";

import { KindProductPage, kindProductMetadata, kindProductStaticParams } from "@/components/product/kind-product-page";

export function generateStaticParams() {
    return kindProductStaticParams("accessory");
}

export function generateMetadata({ params }: PageProps<"/acessorios/[brand]/[slug]">): Promise<Metadata> {
    return kindProductMetadata("accessory", params);
}

export default function Page({ params }: PageProps<"/acessorios/[brand]/[slug]">) {
    return <KindProductPage kind="accessory" params={params} />;
}
