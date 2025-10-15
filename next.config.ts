import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for Vercel deployment
  serverExternalPackages: ['sharp'],
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  // Do not fail production builds on ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
