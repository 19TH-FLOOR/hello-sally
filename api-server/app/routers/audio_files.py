from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
import os
from app.services.s3 import (
    upload_file_to_s3,
    delete_file_from_s3,
    generate_presigned_url_for_download,
)
from app.services.stt import get_stt_service
from app.db.models import AudioFile
from app.db.session import get_db
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from fastapi.responses import RedirectResponse
from fastapi import BackgroundTasks

# 슬래시 리다이렉션을 방지하는 옵션 추가
router = APIRouter(redirect_slashes=False)

@router.get("/test")
def test():
    return {"message": "audio files router is alive"}

@router.post("")
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
    
    # SQLAlchemy 모델을 dict 변환 (STT 상태 포함)
    result = []
    for file in files:
        result.append({
            "id": file.id,
            "filename": file.filename,
            "s3_url": file.s3_url,
            "uploaded_at": file.uploaded_at.isoformat() if isinstance(file.uploaded_at, datetime) else file.uploaded_at,
            "stt_status": file.stt_status or "pending",
            "stt_transcript": file.stt_transcript,
            "stt_processed_at": file.stt_processed_at.isoformat() if file.stt_processed_at else None,
            "stt_error_message": file.stt_error_message
        })
    
    return result

@router.get("/{file_id}/download")
def download_file(file_id: int, db: Session = Depends(get_db)):
    """
    파일 다운로드를 위한 사전 서명 URL 생성 및 리다이렉트
    """
    # DB에서 파일 정보 조회
    file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    
    try:
        # 개선된 Pre-signed URL 생성 함수 사용 (10분 유효)
        presigned_url = generate_presigned_url_for_download(
            file.s3_url, 
            expires_in=600
        )
        
        # 사전 서명 URL로 리다이렉트
        return RedirectResponse(url=presigned_url)
    except HTTPException:
        # generate_presigned_url_for_download에서 발생한 HTTPException 재발생
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"다운로드 URL 생성 실패: {str(e)}"
        )

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


@router.post("/{file_id}/transcribe")
def transcribe_audio(
    file_id: int, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    """
    음성 파일 STT 처리 시작 (백그라운드 작업)
    """
    # DB에서 파일 정보 조회
    file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    
    # 이미 처리 중이거나 완료된 경우 체크
    if file.stt_status in ["processing", "completed"]:
        return {
            "message": f"STT 처리가 이미 {file.stt_status} 상태입니다.",
            "status": file.stt_status
        }
    
    # STT 상태를 processing으로 변경
    file.stt_status = "processing"
    db.commit()
    
    # 백그라운드에서 STT 처리 시작
    background_tasks.add_task(process_stt_background, file_id, file.s3_url)
    
    return {
        "message": "STT 처리가 시작되었습니다.",
        "file_id": file_id,
        "status": "processing"
    }


@router.get("/{file_id}/transcript")
def get_transcript(file_id: int, db: Session = Depends(get_db)):
    """
    STT 처리 결과 조회
    """
    # DB에서 파일 정보 조회
    file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    
    return {
        "file_id": file_id,
        "filename": file.filename,
        "stt_status": file.stt_status or "pending",
        "stt_transcript": file.stt_transcript,
        "stt_processed_at": file.stt_processed_at,
        "stt_error_message": file.stt_error_message
    }


def process_stt_background(file_id: int, s3_url: str):
    """
    백그라운드에서 STT 처리를 수행하는 함수
    """
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    try:
        # STT 서비스 인스턴스 생성
        stt_service = get_stt_service()
        
        # STT 처리 실행
        result = stt_service.transcribe_file(s3_url)
        
        # DB 업데이트
        file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
        if file:
            file.stt_status = "completed"
            file.stt_transcript = result.get("transcript", "")
            file.stt_processed_at = datetime.utcnow()
            db.commit()
            
    except Exception as e:
        # 에러 발생 시 DB 업데이트
        file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
        if file:
            file.stt_status = "failed"
            file.stt_error_message = str(e)
            db.commit()
    finally:
        db.close()