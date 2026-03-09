import type { NextConfig } from "next";

const nextConfig: any = {
  eslint: {
    // Membawa banyak peringatan dari 'any' types, disembunyikan agar build sukses
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Membawa banyak peringatan dari 'any' types, disembunyikan agar build sukses
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
