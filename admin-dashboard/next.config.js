/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 프로덕션 빌드를 위한 standalone 출력
  output: 'standalone',
  

  
  // 범용 API 프록시 ([...proxy].js)를 사용하므로 rewrites 불필요
  // webpack 설정 최적화
  webpack: (config, { isServer, dev }) => {
    // 개발 환경에서는 기본 설정 사용
    if (dev) return config;
    
    // 프로덕션 빌드에서만 최적화 적용
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // 빌드 최적화
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 1,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
        },
      },
    };
    
    return config;
  },
  
  // 빌드 시 정적 생성 타임아웃 증가
  staticPageGenerationTimeout: 300, // 5분으로 감소
  // 빌드 최적화
  swcMinify: true,
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
}

module.exports = nextConfig 