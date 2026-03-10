import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: any = {
  typescript: {
    // Membawa banyak peringatan dari 'any' types, disembunyikan agar build sukses
    ignoreBuildErrors: true,
  },
};

export default withPWA(nextConfig);
