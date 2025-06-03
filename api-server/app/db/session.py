from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import time
import logging

# .env 파일에서 환경변수 로드
load_dotenv()

# 환경 설정 (development/production)
ENV = os.getenv("ENV", "development")

def get_db_url():
    if ENV == "production":
        # 운영 환경 - AWS RDS MySQL
        DB_HOST = os.getenv("DB_HOST")
        DB_PORT = os.getenv("DB_PORT", "3306")
        DB_USER = os.getenv("DB_USER")
        DB_PASSWORD = os.getenv("DB_PASSWORD")
        DB_NAME = os.getenv("DB_NAME", "hello_sally")
        
        return f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    else:
        # 개발 환경 - Docker MySQL
        DB_HOST = os.getenv("DB_HOST", "db")  # docker-compose의 서비스명
        DB_PORT = os.getenv("DB_PORT", "3306")
        DB_USER = os.getenv("DB_USER", "sally_user")
        DB_PASSWORD = os.getenv("DB_PASSWORD", "sally_password")
        DB_NAME = os.getenv("DB_NAME", "hello_sally")
        
        return f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

# DB 연결 시도 (최대 5번, 각 시도 간 3초 대기)
def create_db_engine(max_retries=5, retry_interval=3):
    db_url = get_db_url()
    retries = 0
    
    while retries < max_retries:
        try:
            print(f"DB 연결 시도 {retries+1}/{max_retries}: {db_url}")
            engine = create_engine(db_url)
            # 테스트 쿼리 실행 (SQLAlchemy 2.0+ 호환 방식)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                conn.commit()
            print("DB 연결 성공!")
            return engine
        except Exception as e:
            print(f"DB 연결 실패: {e}")
            retries += 1
            if retries < max_retries:
                print(f"{retry_interval}초 후 재시도...")
                time.sleep(retry_interval)
    
    # 최대 재시도 횟수 초과
    raise Exception(f"DB 연결 실패: 최대 시도 횟수({max_retries})를 초과했습니다.")

# 연결 시도
engine = create_db_engine()

# 세션 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 