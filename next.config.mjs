/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["firebasestorage.googleapis.com"], // Allow Firebase storage images
  },
}

export default nextConfig
