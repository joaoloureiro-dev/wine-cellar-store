import type { NextConfig } from "next";

import { securityHeaders } from "./lib/security/headers";

// Product photos uploaded in the backoffice (lib/media/storage.ts): the
// bucket's public URL in production, /media/** with local storage.
const mediaPublicUrl = process.env.MEDIA_PUBLIC_URL?.trim().replace(/\/+$/, "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Version-skew protection when traffic moves between deployments (e.g.
  // Vercel → Railway failover): a client from another build hard-reloads
  // instead of mixing assets and server actions. Vercel sets its own ID;
  // elsewhere NEXT_DEPLOYMENT_ID or Railway's deployment ID is used.
  deploymentId:
    process.env.NEXT_DEPLOYMENT_ID ??
    (process.env.RAILWAY_DEPLOYMENT_ID ? `railway-${process.env.RAILWAY_DEPLOYMENT_ID}` : undefined),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({ isDev: process.env.NODE_ENV === "development" }),
      },
    ];
  },
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
      {
        pathname: "/media/**",
        search: "",
      },
    ],
    remotePatterns: mediaPublicUrl ? [new URL(`${mediaPublicUrl}/products/**`)] : [],
  },
  experimental: {
    serverActions: {
      // Photo uploads: 4 MB per file plus multipart overhead, under
      // Vercel's 4.5 MB request limit.
      bodySizeLimit: "4.4mb",
    },
  },
};

export default nextConfig;
