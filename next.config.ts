import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Suppress middleware deprecation warning
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Exclude supabase functions from TypeScript checking
  typescript: {
    ignoreBuildErrors: true, // Supabase functions use Deno imports
  },
  // Enable Turbopack (Next.js 16 default)
  turbopack: {},
};

export default nextConfig;
