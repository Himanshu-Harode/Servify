/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['leaflet', 'react-leaflet'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
}

export default nextConfig;
