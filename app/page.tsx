import type { Metadata } from "next";

import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";
import { jsonLdGraph, organizationNode, websiteNode } from "@/lib/seo/structured-data";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata({ title: siteConfig.tagline, description: siteConfig.description, path: "/" }),
  title: { absolute: `${siteConfig.name} | ${siteConfig.tagline}` },
};

export default function Home() {
  return (
    <main>
      <JsonLd data={jsonLdGraph(organizationNode(), websiteNode())} />
      <Hero />
      <FeaturedProducts />
    </main>
  );
}
