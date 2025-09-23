import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for Vercel deployment
  serverExternalPackages: ['sharp'],
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
  }
};

export default nextConfig;
