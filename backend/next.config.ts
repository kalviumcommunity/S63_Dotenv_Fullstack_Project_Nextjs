import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // CORS and security headers are set in middleware.ts (dynamic, origin-aware)
};

export default nextConfig;
