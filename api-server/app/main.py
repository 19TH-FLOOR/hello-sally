from fastapi import FastAPI
from app.routers import auth, audio_files
from app.db.models import Base
from app.db.session import engine

app = FastAPI(title="Hello Sally API", version="0.1.0")

# DB 테이블 자동 생성
Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(audio_files.router, prefix="/audio-files", tags=["AudioFiles"])

@app.get("/")
def root():
    return {"message": "Hello Sally FastAPI server is running."}
