from fastapi import FastAPI
from app.routers import auth, upload

app = FastAPI(title="Hello Sally API", version="0.1.0")

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(upload.router, prefix="/upload", tags=["Upload"])

@app.get("/")
def root():
    return {"message": "Hello Sally FastAPI server is running."}
