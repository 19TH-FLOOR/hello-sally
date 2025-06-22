# 개발용 Dockerfile
FROM node:18-alpine

WORKDIR /app

# package.json과 package-lock.json을 먼저 복사하여 캐시 활용
COPY package*.json ./

# 의존성 설치 (캐시 레이어 최적화)
RUN npm ci

# 소스 코드 복사
COPY . .

# 개발 모드로 실행
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]