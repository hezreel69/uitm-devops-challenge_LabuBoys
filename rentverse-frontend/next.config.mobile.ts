import type { NextConfig } from "next";

/**
 * Mobile Build Configuration
 * This config is used for Capacitor mobile builds (static export)
 * 
 * Note: API routes are temporarily moved during build to exclude them
 * The mobile app calls the backend directly via NEXT_PUBLIC_API_URL
 */

const nextConfig: NextConfig = {
    output: 'export',
    trailingSlash: true,

    // Skip type checking during mobile build for speed
    typescript: {
        ignoreBuildErrors: true,
    },

    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'cdn.fazwaz.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
                port: '',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;
