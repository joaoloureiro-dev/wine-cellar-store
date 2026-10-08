import type { Metadata } from "next";

import { BrandStrip } from "@/components/home/brand-strip";
import { CellarGuide } from "@/components/home/cellar-guide";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { ReservationCta } from "@/components/home/reservation-cta";
import { Services } from "@/components/home/services";
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
      <BrandStrip />
      <FeaturedProducts />
      <CellarGuide />
      <Services />
      <ReservationCta />
    </main>
  );
}
