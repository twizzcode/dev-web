import type { NextConfig } from "next";

const supabaseHost = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).hostname
  : undefined;

const dynamicRemotePatterns: (URL | { protocol?: 'http' | 'https'; hostname: string; pathname?: string })[] =
  supabaseHost
    ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/**" }]
    : [];

const nextConfig: NextConfig = {
  // Optimize for Vercel deployment
  serverExternalPackages: ['sharp'],
  // Optimize images
  images: {
    remotePatterns: dynamicRemotePatterns,
    formats: ["image/avif", "image/webp"],
  },
  // Do not fail production builds on ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
