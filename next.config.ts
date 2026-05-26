import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow local images to use query strings for cache busting
  // Configured specifically for the /uploads directory where Logos are stored
  images: {
    localPatterns: [
      {
        pathname: "/uploads/**",
        search: "?*",
      },
      {
        pathname: "/favicon.ico",
        search: "?*",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
