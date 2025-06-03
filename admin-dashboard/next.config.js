/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // API 서버로 요청을 프록시
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.API_URL + '/:path*', // API_URL=http://api-server:8000 (Docker 내부)
      },
    ]
  },
}

module.exports = nextConfig 