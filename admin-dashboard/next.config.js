/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 프로덕션 빌드를 위한 standalone 출력
  output: 'standalone',
  // API 서버로 요청을 프록시
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: (process.env.API_URL || 'http://api-server:8000') + '/:path*', // API_URL=http://api-server:8000 (Docker 내부)
      },
    ]
  },
  // 서버 설정 개선
  experimental: {
    // 프록시 타임아웃 증가 (파일 업로드를 위해)
    proxyTimeout: 300000, // 5분
  },
  // HTTP 요청 크기 제한 증가
  serverRuntimeConfig: {
    // 서버 사이드에서만 사용 가능
    apiUrl: process.env.API_URL || 'http://api-server:8000',
  },
  publicRuntimeConfig: {
    // 클라이언트와 서버 양쪽에서 사용 가능
    apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  },
  // HTTP 에이전트 설정 추가
  env: {
    CUSTOM_KEY: 'value',
  },
}

module.exports = nextConfig 