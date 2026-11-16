import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  // Route contracts and canonical URLs are normalized to a trailing slash by
  // the engine, so the exported file layout has to match them exactly.
  trailingSlash: true,
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    cpus: 2,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
