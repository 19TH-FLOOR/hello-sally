from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
import os
from app.services.s3 import upload_file_to_s3, s3_client, S3_BUCKET_NAME, delete_file_from_s3
from app.db.models import AudioFile
from app.db.session import get_db
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from fastapi.responses import RedirectResponse

# 슬래시 리다이렉션을 방지하는 옵션 추가
router = APIRouter(redirect_slashes=False)

@router.get("/test")
def test():
    return {"message": "audio files router is alive"}

@router.post("/")
def upload_audio(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 파일 확장자 체크 (간단 예시: wav, mp3만 허용)
    allowed_ext = {".wav", ".mp3", ".m4a", ".ogg"}
    _, ext = os.path.splitext(file.filename)
    if ext.lower() not in allowed_ext:
        raise HTTPException(status_code=400, detail="지원하지 않는 파일 형식입니다.")

    # S3 업로드
    s3_result = upload_file_to_s3(file.file, file.filename, file.content_type)
    
    # DB 저장 (direct_url 사용)
    audio = AudioFile(filename=file.filename, s3_url=s3_result["direct_url"])
    db.add(audio)
    db.commit()
    db.refresh(audio)

    return {
        "id": audio.id, 
        "filename": audio.filename, 
        "s3_url": s3_result["direct_url"],
        "presigned_url": s3_result["presigned_url"],  # 사전 서명 URL 추가
        "uploaded_at": audio.uploaded_at, 
        "message": "S3 업로드 및 DB 저장 성공"
    }

@router.get("", response_model=List[dict])
def get_files(db: Session = Depends(get_db)):
    """
    업로드된 모든 음성 파일 목록 조회
    """
    files = db.query(AudioFile).order_by(AudioFile.uploaded_at.desc()).all()
    
    # SQLAlchemy 모델을 dict 변환 (사전 서명 URL 생성 제외)
    result = []
    for file in files:
        result.append({
            "id": file.id,
            "filename": file.filename,
            "s3_url": file.s3_url,
            "uploaded_at": file.uploaded_at.isoformat() if isinstance(file.uploaded_at, datetime) else file.uploaded_at
        })
    
    return result

@router.get("/{file_id}/download")
def download_file(file_id: int, db: Session = Depends(get_db)):
    """
    파일 다운로드를 위한 사전 서명 URL 생성
    """
    # DB에서 파일 정보 조회
    file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    
    # 파일명 추출
    filename = file.filename
    
    try:
        # 사전 서명된 URL 생성 (10분 유효)
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET_NAME, 'Key': filename},
            ExpiresIn=600  # 10분
        )
        
        # 사전 서명 URL로 리다이렉트
        return RedirectResponse(url=presigned_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"다운로드 URL 생성 실패: {str(e)}")

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(file_id: int, db: Session = Depends(get_db)):
    """
    음성 파일 삭제 (S3 및 DB에서 모두 삭제)
    """
    # DB에서 파일 정보 조회
    file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    
    try:
        # S3에서 파일 삭제
        delete_file_from_s3(file.filename)
        
        # DB에서 파일 정보 삭제
        db.delete(file)
        db.commit()
        
        return None  # 204 응답은 본문이 없음
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"파일 삭제 실패: {str(e)}")