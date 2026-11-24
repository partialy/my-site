import type { NextConfig } from "next";

const serverInternalUrl = (
  process.env.SERVER_INTERNAL_URL || "http://127.0.0.1:3000"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${serverInternalUrl}/api/v1/:path*`,
      },
      {
        source: "/health",
        destination: `${serverInternalUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
