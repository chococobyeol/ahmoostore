/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'ahmoostore.local',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
    ],
    unoptimized: true,
    domains: ['ahmoostore.local'],
  },
  output: 'export',
}

module.exports = nextConfig 