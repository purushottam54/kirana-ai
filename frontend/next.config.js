/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Leaflet requires this for SSR compatibility
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
  // Suppress build noise from Leaflet
  transpilePackages: ["leaflet", "react-leaflet"],
};

export default nextConfig;
