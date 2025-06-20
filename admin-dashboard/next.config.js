/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 프로덕션 빌드를 위한 standalone 출력
  output: 'standalone',
  // GitHub Actions 환경에서 빌드 최적화
  generateBuildId: async () => {
    // 빌드 ID를 간단하게 하여 메모리 사용량 줄이기
    return 'build'
  },
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
    // 빌드 워커 수 제한 (메모리 사용량 줄이기)
    cpus: 1,
    // 빌드 최적화 (GitHub Actions용)
    workerThreads: false,
    esmExternals: false,
  },
  // 빌드 시 정적 생성 타임아웃 증가
  staticPageGenerationTimeout: 600, // 10분으로 증가
  // 빌드 최적화
  swcMinify: true,
  // 메모리 사용량 최적화
  compress: false, // 빌드 시 압축 비활성화로 메모리 절약
  // 정적 생성 비활성화 (모든 페이지를 SSR로)
  trailingSlash: false,
  // 빌드 시 타입 체크 건너뛰기 (속도 향상)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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