/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Keeps images loading even if server optimization fails or if using static export
    unoptimized: true, 
    
    // Your existing external domains
    domains: ['images.pexels.com'],

    // The new SAFE configuration for your Supabase bucket
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kybgrsqqvejbvjediowo.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;
