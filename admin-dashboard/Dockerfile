# 개발용 Dockerfile
FROM node:18-alpine

WORKDIR /app

# 의존성 설치
COPY package.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# 개발 모드로 실행
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]