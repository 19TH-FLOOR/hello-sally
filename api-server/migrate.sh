#!/bin/bash

echo "🚀 Starting Hello Sally API Server..."

# DB 연결 대기
echo "⏳ Waiting for database connection..."
python -c "
import time
import sys
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

def get_db_url():
    env = os.getenv('ENV', 'development')
    if env == 'production':
        host = os.getenv('DB_HOST')
        port = os.getenv('DB_PORT', '3306')
        user = os.getenv('DB_USER')
        password = os.getenv('DB_PASSWORD')
        database = os.getenv('DB_NAME', 'hello_sally_prod')
    else:
        host = os.getenv('DB_HOST', 'db')
        port = os.getenv('DB_PORT', '3306')
        user = os.getenv('DB_USER', 'sally_dev_user')
        password = os.getenv('DB_PASSWORD', 'sally_dev_password')
        database = os.getenv('DB_NAME', 'hello_sally_dev')
    return f'mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4'

max_retries = 30
for i in range(max_retries):
    try:
        engine = create_engine(get_db_url())
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
            conn.commit()
        print('✅ Database connection successful!')
        break
    except Exception as e:
        if i == max_retries - 1:
            print(f'❌ Database connection failed after {max_retries} attempts: {e}')
            sys.exit(1)
        print(f'⏳ Attempt {i+1}/{max_retries} failed, retrying in 2 seconds...')
        time.sleep(2)
"

# Alembic 마이그레이션 실행
echo "📊 Running database migrations..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully!"
else
    echo "❌ Database migrations failed!"
    exit 1
fi

# FastAPI 서버 시작
echo "🌟 Starting FastAPI server..."
if [ "$ENV" = "production" ]; then
    uvicorn app.main:app --host 0.0.0.0 --port 8000
else
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
fi 