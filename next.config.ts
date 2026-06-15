import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "app-api.sabturno.com",
      },
    ],
  },
  // Optimize for production
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
