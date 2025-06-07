FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

# MySQL 초기화 스크립트와 마이그레이션 스크립트에 실행 권한 부여
RUN chmod +x mysql/init/*.sh && chmod +x migrate.sh

CMD ["./migrate.sh"]