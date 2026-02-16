import type { NextConfig } from "next";
import {
  getCspHeader,
  getHstsHeader,
  getPermissionsPolicyHeader,
} from "./src/lib/security/headers";

function getSecurityHeaders() {
  const headers: { key: string; value: string }[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-XSS-Protection", value: "1; mode=block" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Content-Security-Policy", value: getCspHeader() },
    { key: "Permissions-Policy", value: getPermissionsPolicyHeader() },
  ];

  const hsts = getHstsHeader();
  if (hsts) headers.push({ key: "Strict-Transport-Security", value: hsts });

  return headers;
}

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},

  async headers() {
    const securityHeaders = getSecurityHeaders();
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/video/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
};

// Conditionally apply PWA config
let config = nextConfig;

if (process.env.NODE_ENV === "production") {
  try {
    const withPWA = require("next-pwa")({
      dest: "public",
      register: true,
      skipWaiting: true,
      disable: false,
      runtimeCaching: [
        {
          urlPattern: /^https?.*/,
          handler: "NetworkFirst",
          options: {
            cacheName: "offlineCache",
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 24 * 60 * 60, // 24 hours
            },
            networkTimeoutSeconds: 10,
          },
        },
        {
          urlPattern: /\/api\/issues/,
          handler: "NetworkFirst",
          options: {
            cacheName: "apiCache",
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 5 * 60, // 5 minutes
            },
          },
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
          handler: "CacheFirst",
          options: {
            cacheName: "imageCache",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            },
          },
        },
      ],
    });
    config = withPWA(nextConfig);
  } catch (error) {
    console.warn("[PWA] Failed to load next-pwa, continuing without PWA support:", error);
  }
}

export default config;
