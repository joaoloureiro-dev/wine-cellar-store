import type { Metadata } from "next";

import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata({ title: siteConfig.tagline, description: siteConfig.description, path: "/" }),
  title: { absolute: `${siteConfig.name} | ${siteConfig.tagline}` },
};

export default function Home() {
  return (
    <main>
      <Hero />
      <FeaturedProducts />
    </main>
  );
}
