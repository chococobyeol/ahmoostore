/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 프로덕션 빌드 시 ESLint 검사를 비활성화
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 프로덕션 빌드 시 타입 검사를 비활성화
    ignoreBuildErrors: true,
  },
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig 