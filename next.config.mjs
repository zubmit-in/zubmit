/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["img.clerk.com"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
