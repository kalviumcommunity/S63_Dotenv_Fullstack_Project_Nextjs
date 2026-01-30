import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API-only backend - no static pages needed
  output: "standalone",
  // Disable static optimization for API routes
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
