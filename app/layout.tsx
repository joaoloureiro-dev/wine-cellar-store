import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { Header } from "@/components/layout/header";
import { LegalBar } from "@/components/legal/legal-bar";
import { FavoritesProvider } from "@/components/favorites/favorites-provider";
import { ToastProvider } from "@/components/ui/toast";
import { siteUrl } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  // Defaults for pages without their own (indexable pages use pageMetadata).
  openGraph: {
    type: "website",
    locale: "pt_PT",
    siteName: siteConfig.name,
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: { card: "summary_large_image" },
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-PT">
      <body className={`${manrope.variable} ${cormorant.variable}`}>
        <ToastProvider>
          <FavoritesProvider>
            <Header />
            {children}
            <LegalBar />
          </FavoritesProvider>
        </ToastProvider>
      </body>
    </html>
  );
}