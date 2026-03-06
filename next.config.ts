import type { NextConfig } from "next";

const allowedHostnames = [
  'yfgciamhzjvarwgzosto.supabase.co',
  'aifzkybxhmefbirujvdg.supabase.co',
];

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const hostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
    if (!allowedHostnames.includes(hostname)) {
      allowedHostnames.push(hostname);
    }
  } catch (e) {
    console.error('Invalid NEXT_PUBLIC_SUPABASE_URL:', e);
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: allowedHostnames.map((hostname) => ({
      protocol: 'https',
      hostname,
      port: '',
      pathname: '/storage/v1/object/public/**',
    })),
  },
};

export default nextConfig;
