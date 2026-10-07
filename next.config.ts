import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Partial prerendering + 'use cache': static shells with tagged data
  // caches, dynamic parts streamed at request time.
  cacheComponents: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75],
    localPatterns: [
      {
        pathname: "/images/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
