/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['html5-qrcode'],
  },
};
module.exports = nextConfig;
