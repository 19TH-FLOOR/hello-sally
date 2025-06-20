# 멀티스테이지 빌드로 최적화
FROM python:3.11-slim as builder

WORKDIR /app

# 시스템 의존성 설치 (빌드용)
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치 (캐싱 최적화)
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# 프로덕션 이미지
FROM python:3.11-slim

WORKDIR /app

# 런타임 의존성만 설치
RUN apt-get update && apt-get install -y \
    default-mysql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 빌더에서 설치된 Python 패키지 복사
COPY --from=builder /root/.local /root/.local

# PATH에 로컬 bin 추가
ENV PATH=/root/.local/bin:$PATH

# 애플리케이션 코드 복사
COPY . /app

# MySQL 초기화 스크립트와 마이그레이션 스크립트에 실행 권한 부여
RUN chmod +x mysql/init/*.sh && chmod +x migrate.sh

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000 || exit 1

CMD ["./migrate.sh"]