import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yfgciamhzjvarwgzosto.supabase.co'; // Fallback to existing dev URL if env is missing (e.g. build time without env)
const supabaseHostname = new URL(supabaseUrl).hostname;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
