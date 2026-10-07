import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Partial prerendering + 'use cache': static shells with tagged data
  // caches, dynamic parts streamed at request time.
  cacheComponents: true,
  // With REDIS_URL, 'use cache' entries and tag invalidations are shared by
  // every instance (see cache-handlers/redis.mjs); otherwise each process
  // keeps its own in-memory cache.
  cacheHandlers: process.env.REDIS_URL
    ? { default: require.resolve("./cache-handlers/redis.mjs") }
    : undefined,
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
