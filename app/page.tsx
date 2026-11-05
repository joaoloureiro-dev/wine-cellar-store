import Link from "next/link";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
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
      <Container className="py-10 sm:py-14">
        <nav aria-label="Escolher por utilização" className="grid gap-4 sm:grid-cols-3">
          {[
            { title: "Encastrar na cozinha", href: "/caves?instalacao=encastre&instalacao=sob-bancada", detail: "Modelos de encastre e sob bancada." },
            { title: "Guardar a minha coleção", href: "/caves?instalacao=livre-instalacao", detail: "Caves de livre instalação para diferentes capacidades." },
            { title: "Equipar uma garrafeira", href: "/climatizadores", detail: "Climatizadores para adegas e espaços dedicados." },
          ].map(({ title, href, detail }) => (
            <Link key={href} href={href} className="rounded-2xl border border-border bg-surface p-5 hover:border-wine">
              <span className="block font-display text-2xl text-charcoal">{title}</span>
              <span className="mt-2 block text-sm text-muted">{detail}</span>
            </Link>
          ))}
        </nav>
      </Container>
      <BrandStrip />
      <FeaturedProducts />
      <CellarGuide />
      <Services />
      <ReservationCta />
    </main>
  );
}
