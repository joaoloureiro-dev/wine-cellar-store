import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { Header } from "@/components/layout/header";

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
  title: {
    default: "Wine Cellar Store",
    template: "%s | Wine Cellar Store",
  },
  description:
    "Premium wine cellars designed to preserve your wine collection under ideal conditions.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-PT">
      <body className={`${manrope.variable} ${cormorant.variable}`}>
        <Header />
        {children}
      </body>
    </html>
  );
}