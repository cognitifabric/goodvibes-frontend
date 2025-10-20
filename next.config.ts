import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // prevent ESLint from failing the production build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
