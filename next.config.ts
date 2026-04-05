import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      bodySizeLimit: "500mb",
    },
  },
};

export default nextConfig;
