import logging
import uvicorn
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.routers import auth, audio_files
from app.db.models import Base
from app.db.session import engine

# 로깅 설정 - 디버깅을 위해 DEBUG 레벨로 설정
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)

app = FastAPI(
    title="Hello Sally API", 
    version="0.1.0",
    # 연결 안정성을 위한 설정
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 미들웨어 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 환경에서는 모든 origin 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 요청 크기 제한 미들웨어 추가
class RequestSizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_size: int = 100 * 1024 * 1024):  # 100MB
        super().__init__(app)
        self.max_size = max_size

    async def dispatch(self, request: Request, call_next):
        if request.method in ["POST", "PUT", "PATCH"]:
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > self.max_size:
                raise HTTPException(
                    status_code=413, 
                    detail="Request entity too large"
                )
        
        response = await call_next(request)
        return response

app.add_middleware(RequestSizeMiddleware)

# DB 테이블은 Alembic 마이그레이션으로 관리
# Base.metadata.create_all(bind=engine)  # Alembic 사용으로 주석 처리

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(
    audio_files.router, 
    prefix="/audio-files", 
    tags=["AudioFiles"]
)

@app.get("/")
def root():
    return {"message": "Hello Sally FastAPI server is running."}
