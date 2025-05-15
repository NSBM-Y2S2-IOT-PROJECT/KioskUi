import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore ESLint errors during build - continues build even with ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
