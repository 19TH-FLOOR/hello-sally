from fastapi import APIRouter

router = APIRouter()

@router.get("/test")
def test():
    return {"message": "upload router is alive"}
