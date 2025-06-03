from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, audio_files
from app.db.models import Base
from app.db.session import engine
import uvicorn

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
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

class RequestSizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_size: int = 100 * 1024 * 1024):  # 100MB
        super().__init__(app)
        self.max_size = max_size

    async def dispatch(self, request: Request, call_next):
        if request.method in ["POST", "PUT", "PATCH"]:
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > self.max_size:
                raise HTTPException(status_code=413, detail="Request entity too large")
        
        response = await call_next(request)
        return response

app.add_middleware(RequestSizeMiddleware)

# DB 테이블 자동 생성
Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(audio_files.router, prefix="/audio-files", tags=["AudioFiles"])

@app.get("/")
def root():
    return {"message": "Hello Sally FastAPI server is running."}
