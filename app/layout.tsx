import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Wine Cellar Store",
    template: "%s | Wine Cellar Store",
  },
  description:
    "Premium wine cellars for storing and preserving your wine collection.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  );
}