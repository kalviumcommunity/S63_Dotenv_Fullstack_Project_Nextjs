import type { NextConfig } from "next";

const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

const nextConfig: NextConfig = {
  // API-only backend - no static pages needed
  output: "standalone",
  // Disable static optimization for API routes
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: CORS_ORIGIN },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PATCH, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
