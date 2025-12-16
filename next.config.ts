import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**', // Allow all paths from Cloudinary
      },
      // If you use Google Auth, you might need this too for profile pics:
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', 
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;