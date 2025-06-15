#!/bin/bash

echo "🚀 Starting Hello Sally API Server..."

# DB 연결 대기 및 데이터베이스 생성
echo "⏳ Waiting for database connection and creating database if needed..."
python -c "
import time
import sys
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import pymysql

load_dotenv()

def get_db_config():
    env = os.getenv('ENV', 'development')
    if env == 'production':
        host = os.getenv('DB_HOST')
        port = int(os.getenv('DB_PORT', '3306'))
        user = os.getenv('DB_USER')
        password = os.getenv('DB_PASSWORD')
        database = os.getenv('DB_NAME', 'hello_sally_prod')
    else:
        host = os.getenv('DB_HOST', 'db')
        port = int(os.getenv('DB_PORT', '3306'))
        user = os.getenv('DB_USER', 'sally_dev_user')
        password = os.getenv('DB_PASSWORD', 'sally_dev_password')
        database = os.getenv('DB_NAME', 'hello_sally_dev')
    return host, port, user, password, database

def get_db_url_without_db(host, port, user, password):
    return f'mysql+pymysql://{user}:{password}@{host}:{port}?charset=utf8mb4'

def get_db_url_with_db(host, port, user, password, database):
    return f'mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4'

def create_database_if_not_exists(host, port, user, password, database):
    try:
        # MySQL 서버에 연결 (데이터베이스 지정 없이)
        connection = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            charset='utf8mb4'
        )
        
        with connection.cursor() as cursor:
            # 데이터베이스 존재 확인
            cursor.execute(f\"SHOW DATABASES LIKE '{database}'\")
            result = cursor.fetchone()
            
            if not result:
                print(f'📦 Creating database: {database}')
                cursor.execute(f'CREATE DATABASE {database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
                print(f'✅ Database {database} created successfully!')
            else:
                print(f'✅ Database {database} already exists')
        
        connection.close()
        return True
        
    except Exception as e:
        print(f'❌ Failed to create database: {e}')
        return False

host, port, user, password, database = get_db_config()

# 1단계: MySQL 서버 연결 대기
print('🔍 Step 1: Waiting for MySQL server connection...')
max_retries = 30
server_connected = False

for i in range(max_retries):
    try:
        engine = create_engine(get_db_url_without_db(host, port, user, password))
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
            conn.commit()
        print('✅ MySQL server connection successful!')
        server_connected = True
        break
    except Exception as e:
        if i == max_retries - 1:
            print(f'❌ MySQL server connection failed after {max_retries} attempts: {e}')
            sys.exit(1)
        print(f'⏳ Server connection attempt {i+1}/{max_retries} failed, retrying in 2 seconds...')
        time.sleep(2)

# 2단계: 데이터베이스 생성 (필요한 경우)
if server_connected:
    print('🔍 Step 2: Creating database if needed...')
    if not create_database_if_not_exists(host, port, user, password, database):
        sys.exit(1)

# 3단계: 데이터베이스 연결 확인
print('🔍 Step 3: Verifying database connection...')
for i in range(10):  # 데이터베이스 생성 후 짧은 재시도
    try:
        engine = create_engine(get_db_url_with_db(host, port, user, password, database))
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
            conn.commit()
        print('✅ Database connection successful!')
        break
    except Exception as e:
        if i == 9:
            print(f'❌ Database connection failed after creation: {e}')
            sys.exit(1)
        print(f'⏳ Database connection attempt {i+1}/10 failed, retrying in 1 second...')
        time.sleep(1)
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