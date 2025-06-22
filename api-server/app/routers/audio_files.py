from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status, Form
import os
from app.services.s3 import (
    upload_file_to_s3,
    delete_file_from_s3,
    generate_presigned_url_for_download,
)
from app.services.stt import get_stt_service
from app.services.audio_utils import get_audio_duration
from app.db.models import AudioFile, Report, Transcript, STTConfig
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
def upload_audio(
    file: UploadFile = File(...), 
    report_id: int = Form(...),
    display_name: str = Form(None),
    db: Session = Depends(get_db)
):
    # 파일 확장자 체크 (간단 예시: wav, mp3만 허용)
    allowed_ext = {".wav", ".mp3", ".m4a", ".ogg"}
    _, ext = os.path.splitext(file.filename)
    if ext.lower() not in allowed_ext:
        raise HTTPException(
            status_code=400, 
            detail="지원하지 않는 파일 형식입니다."
        )

    # 보고서 ID 유효성 검사
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=404, 
            detail="지정된 보고서를 찾을 수 없습니다."
        )

    # 파일 사이즈 계산
    file.file.seek(0, 2)  # 파일 끝으로 이동
    file_size = file.file.tell()
    file.file.seek(0)  # 파일 시작으로 되돌리기
    
    # 오디오 파일 길이 추출
    duration = get_audio_duration(file.file, file.content_type)
    
    # S3 업로드
    s3_result = upload_file_to_s3(file.file, file.filename, file.content_type)
    
    # display_name이 없으면 filename을 기본값으로 사용
    final_display_name = display_name if display_name else file.filename
    
    # DB 저장 (report_id와 duration 포함)
    audio = AudioFile(
        filename=file.filename,
        display_name=final_display_name,
        s3_url=s3_result["direct_url"],
        report_id=report_id,
        duration=duration,
        file_size=file_size
    )
    db.add(audio)
    db.commit()
    db.refresh(audio)

    return {
        "id": audio.id, 
        "filename": audio.filename,
        "display_name": audio.display_name,
        "s3_url": s3_result["direct_url"],
        "presigned_url": s3_result["presigned_url"],  # 사전 서명 URL 추가
        "report_id": audio.report_id,
        "uploaded_at": audio.uploaded_at,
        "duration": audio.duration,
        "file_size": audio.file_size,
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
        # Transcript 내용 가져오기
        transcript_content = ""
        if file.transcript:
            transcript_content = file.transcript.content
        
        result.append({
            "id": file.id,
            "filename": file.filename,
            "display_name": file.display_name or file.filename,
            "s3_url": file.s3_url,
            "uploaded_at": file.uploaded_at.isoformat() if isinstance(file.uploaded_at, datetime) else file.uploaded_at,
            "stt_status": file.stt_status or "pending",
            "stt_transcript": transcript_content,
            "stt_processed_at": file.stt_processed_at.isoformat() if file.stt_processed_at else None,
            "stt_error_message": file.stt_error_message,
            "duration": file.duration,
            "file_size": file.file_size
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

@router.get("/{file_id}/download-url")
def get_download_url(file_id: int, db: Session = Depends(get_db)):
    """
    파일 다운로드를 위한 사전 서명 URL 반환 (JSON 응답)
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
        
        return {
            "download_url": presigned_url,
            "filename": file.display_name or file.filename
        }
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
        # S3에서 파일 삭제 (S3 URL 사용)
        delete_file_from_s3(file.s3_url)
        
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
    
    # STT 설정 가져오기 (없으면 기본값 사용)
    stt_config = file.stt_config
    if not stt_config:
        stt_config = {
            "model_type": "sommers",
            "language": "ko",
            "language_candidates": None,
            "speaker_diarization": False,
            "spk_count": 2,
            "profanity_filter": False,
            "use_disfluency_filter": True,
            "use_paragraph_splitter": True,
            "paragraph_max_length": 50,
            "domain": "GENERAL",
            "keywords": None
        }
    else:
        # STTConfig 객체를 딕셔너리로 변환
        stt_config = {
            "model_type": stt_config.model_type,
            "language": stt_config.language,
            "language_candidates": stt_config.language_candidates,
            "speaker_diarization": stt_config.speaker_diarization,
            "spk_count": stt_config.spk_count,
            "profanity_filter": stt_config.profanity_filter,
            "use_disfluency_filter": stt_config.use_disfluency_filter,
            "use_paragraph_splitter": stt_config.use_paragraph_splitter,
            "paragraph_max_length": stt_config.paragraph_max_length,
            "domain": stt_config.domain,
            "keywords": stt_config.keywords
        }
    
    # STT 상태를 processing으로 변경
    file.stt_status = "processing"
    db.commit()
    
    # 백그라운드에서 STT 처리 시작 (설정 포함)
    background_tasks.add_task(
        process_stt_background, 
        file_id, 
        file.s3_url, 
        stt_config
    )
    
    return {
        "message": "STT 처리가 시작되었습니다.",
        "file_id": file_id,
        "status": "processing",
        "config": stt_config
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
    
    # Transcript 내용 가져오기
    transcript_content = ""
    if file.transcript:
        transcript_content = file.transcript.content
    
    return {
        "file_id": file_id,
        "filename": file.filename,
        "stt_status": file.stt_status or "pending",
        "stt_transcript": transcript_content,
        "stt_processed_at": file.stt_processed_at,
        "stt_error_message": file.stt_error_message
    }


def process_stt_background(file_id: int, s3_url: str, stt_config: dict):
    """
    백그라운드에서 STT 처리를 수행하는 함수
    """
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    try:
        # STT 서비스 인스턴스 생성
        stt_service = get_stt_service()
        
        # STT 처리 실행
        result = stt_service.transcribe_file(s3_url, stt_config)
        
        # DB 업데이트
        file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
        if file:
            file.stt_status = "completed"
            file.stt_processed_at = datetime.utcnow()
            
            # Transcript 생성 또는 업데이트 (화자 정보 포함)
            transcript_content = result.get("transcript", "")
            speaker_labels = result.get("speaker_labels")
            speaker_names = result.get("speaker_names")
            
            if file.transcript:
                file.transcript.content = transcript_content
                file.transcript.speaker_labels = speaker_labels
                file.transcript.speaker_names = speaker_names
                file.transcript.updated_at = datetime.utcnow()
            else:
                transcript = Transcript(
                    audio_file_id=file_id,
                    content=transcript_content,
                    speaker_labels=speaker_labels,
                    speaker_names=speaker_names,
                    is_edited=False
                )
                db.add(transcript)
            
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

@router.put("/{file_id}/transcript")
def update_transcript(
    file_id: int,
    content: str = Form(...),
    db: Session = Depends(get_db)
):
    """STT 결과 텍스트 편집"""
    # DB에서 파일 정보 조회
    file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    
    # Transcript가 없으면 생성
    if not file.transcript:
        transcript = Transcript(
            audio_file_id=file_id,
            content=content,
            is_edited=True
        )
        db.add(transcript)
    else:
        # 기존 Transcript 업데이트
        file.transcript.content = content
        file.transcript.is_edited = True
        file.transcript.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "STT 결과가 업데이트되었습니다.",
        "file_id": file_id,
        "content": content,
        "is_edited": True
    }


@router.get("/{file_id}/transcript/edit")
def get_transcript_for_edit(file_id: int, db: Session = Depends(get_db)):
    """STT 결과 편집을 위한 데이터 조회"""
    # DB에서 파일 정보 조회
    file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    
    transcript_content = ""
    is_edited = False
    
    if file.transcript:
        transcript_content = file.transcript.content
        is_edited = file.transcript.is_edited
    
    return {
        "file_id": file_id,
        "filename": file.filename,
        "stt_status": file.stt_status,
        "transcript_content": transcript_content,
        "is_edited": is_edited,
        "stt_processed_at": file.stt_processed_at
    }


@router.get("/{file_id}/stt-config")
def get_stt_config(file_id: int, db: Session = Depends(get_db)):
    """STT 설정 조회"""
    # DB에서 파일 정보 조회
    file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    
    # STT 설정이 없으면 기본값 반환
    if not file.stt_config:
        return {
            "model_type": "sommers",
            "language": "ko",
            "language_candidates": None,
            "speaker_diarization": True,
            "spk_count": None,  # 자동 감지
            "profanity_filter": False,
            "use_disfluency_filter": True,
            "use_paragraph_splitter": False,
            "paragraph_max_length": None,
            "domain": "GENERAL",
            "keywords": None
        }
    
    return file.stt_config


@router.post("/{file_id}/stt-config")
def create_stt_config(
    file_id: int,
    config_data: dict,
    db: Session = Depends(get_db)
):
    """STT 설정 생성"""
    # DB에서 파일 정보 조회
    file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    
    # 유효한 필드만 필터링
    valid_fields = {
        'model_type', 'language', 'language_candidates', 'speaker_diarization', 
        'spk_count', 'profanity_filter', 'use_disfluency_filter', 
        'use_paragraph_splitter', 'paragraph_max_length', 'domain', 'keywords'
    }
    filtered_config = {k: v for k, v in config_data.items() if k in valid_fields}
    
    # 기존 설정이 있으면 업데이트
    if file.stt_config:
        for key, value in filtered_config.items():
            setattr(file.stt_config, key, value)
        file.stt_config.updated_at = datetime.utcnow()
    else:
        # 새 설정 생성
        stt_config = STTConfig(
            audio_file_id=file_id,
            **filtered_config
        )
        db.add(stt_config)
    
    db.commit()
    db.refresh(file)
    
    return {"message": "STT 설정이 저장되었습니다."}


@router.put("/{file_id}/stt-config")
def update_stt_config(
    file_id: int,
    config_data: dict,
    db: Session = Depends(get_db)
):
    """STT 설정 업데이트"""
    # DB에서 파일 정보 조회
    file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    
    if not file.stt_config:
        raise HTTPException(status_code=404, detail="STT 설정을 찾을 수 없습니다.")
    
    # 유효한 필드만 필터링
    valid_fields = {
        'model_type', 'language', 'language_candidates', 'speaker_diarization', 
        'spk_count', 'profanity_filter', 'use_disfluency_filter', 
        'use_paragraph_splitter', 'paragraph_max_length', 'domain', 'keywords'
    }
    filtered_config = {k: v for k, v in config_data.items() if k in valid_fields}
    
    # 설정 업데이트
    for key, value in filtered_config.items():
        setattr(file.stt_config, key, value)
    file.stt_config.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(file)
    
    return {"message": "STT 설정이 업데이트되었습니다."}

@router.put("/{file_id}/transcript/speakers")
def update_speaker_labels(
    file_id: int,
    speaker_names: dict,
    db: Session = Depends(get_db)
):
    """화자 라벨링 업데이트"""
    # DB에서 파일 정보 조회
    file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    
    if not file.transcript:
        raise HTTPException(status_code=404, detail="STT 결과를 찾을 수 없습니다.")
    
    # 화자 이름 업데이트
    file.transcript.speaker_names = speaker_names
    file.transcript.updated_at = datetime.utcnow()
    
    # 화자 이름이 변경된 경우 텍스트도 업데이트
    if file.transcript.speaker_labels and speaker_names:
        updated_content_parts = []
        for label in file.transcript.speaker_labels:
            speaker = label.get("speaker", "")
            text = label.get("text", "")
            if speaker and text:
                # 새로운 화자 이름으로 교체
                new_speaker_name = speaker_names.get(speaker, speaker)
                updated_content_parts.append(f"{new_speaker_name}: {text}")
            elif text:
                updated_content_parts.append(text)
        
        file.transcript.content = "\n".join(updated_content_parts)
    
    db.commit()
    
    return {
        "message": "화자 라벨링이 업데이트되었습니다.",
        "file_id": file_id,
        "speaker_names": speaker_names
    }


@router.get("/{file_id}/transcript/speakers")
def get_speaker_labels(file_id: int, db: Session = Depends(get_db)):
    """화자 라벨링 정보 조회"""
    # DB에서 파일 정보 조회
    file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    
    if not file.transcript:
        raise HTTPException(status_code=404, detail="STT 결과를 찾을 수 없습니다.")
    
    return {
        "file_id": file_id,
        "speaker_labels": file.transcript.speaker_labels,
        "speaker_names": file.transcript.speaker_names or {},
        "transcript_content": file.transcript.content
    }

@router.post("/{file_id}/transcribe/restart")
def restart_stt_processing(
    file_id: int, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    """
    STT 처리 재시작 (기존 결과 초기화 후 새로운 설정으로 재처리)
    """
    # DB에서 파일 정보 조회
    file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    
    # 기존 Transcript 삭제
    if file.transcript:
        db.delete(file.transcript)
    
    # STT 설정 가져오기 (없으면 기본값 사용)
    stt_config = file.stt_config
    if not stt_config:
        stt_config = {
            "model_type": "sommers",
            "language": "ko",
            "language_candidates": None,
            "speaker_diarization": False,
            "spk_count": 2,
            "profanity_filter": False,
            "use_disfluency_filter": True,
            "use_paragraph_splitter": True,
            "paragraph_max_length": 50,
            "domain": "GENERAL",
            "keywords": None
        }
    else:
        # STTConfig 객체를 딕셔너리로 변환
        stt_config = {
            "model_type": stt_config.model_type,
            "language": stt_config.language,
            "language_candidates": stt_config.language_candidates,
            "speaker_diarization": stt_config.speaker_diarization,
            "spk_count": stt_config.spk_count,
            "profanity_filter": stt_config.profanity_filter,
            "use_disfluency_filter": stt_config.use_disfluency_filter,
            "use_paragraph_splitter": stt_config.use_paragraph_splitter,
            "paragraph_max_length": stt_config.paragraph_max_length,
            "domain": stt_config.domain,
            "keywords": stt_config.keywords
        }
    
    # STT 상태를 processing으로 변경
    file.stt_status = "processing"
    file.stt_processed_at = None
    file.stt_error_message = None
    db.commit()
    
    # 백그라운드에서 STT 처리 시작 (설정 포함)
    background_tasks.add_task(
        process_stt_background, 
        file_id, 
        file.s3_url, 
        stt_config
    )
    
    return {
        "message": "STT 처리가 새로운 설정으로 재시작되었습니다.",
        "file_id": file_id,
        "status": "processing",
        "config": stt_config
    }

@router.post("/{file_id}/transcript/speakers/preview")
def preview_speaker_labels(
    file_id: int,
    speaker_names: dict,
    db: Session = Depends(get_db)
):
    """화자 라벨링 미리보기"""
    # DB에서 파일 정보 조회
    file = db.query(AudioFile).filter(
        AudioFile.id == file_id
    ).first()
    if not file:
        raise HTTPException(
            status_code=404, 
            detail="파일을 찾을 수 없습니다."
        )
    
    if not file.transcript:
        raise HTTPException(
            status_code=404, 
            detail="STT 결과를 찾을 수 없습니다."
        )
    
    # 화자 라벨이 없으면 에러
    if not file.transcript.speaker_labels:
        raise HTTPException(
            status_code=404, 
            detail="화자 분리 정보가 없습니다."
        )
    
    # 미리보기 텍스트 생성
    preview_content_parts = []
    for label in file.transcript.speaker_labels:
        speaker = label.get("speaker", "")
        text = label.get("text", "")
        if speaker and text:
            # 새로운 화자 이름으로 교체
            new_speaker_name = speaker_names.get(speaker, speaker)
            preview_content_parts.append(f"{new_speaker_name}: {text}")
        elif text:
            preview_content_parts.append(text)
    
    preview_content = "\n".join(preview_content_parts)
    
    return {
        "file_id": file_id,
        "preview_content": preview_content,
        "speaker_names": speaker_names
    }

@router.put("/{file_id}/display-name")
def update_display_name(
    file_id: int,
    display_name_data: dict,
    db: Session = Depends(get_db)
):
    """파일 표시명 업데이트"""
    # DB에서 파일 정보 조회
    file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not file:
        raise HTTPException(
            status_code=404, 
            detail="파일을 찾을 수 없습니다."
        )
    
    # display_name 업데이트
    file.display_name = display_name_data.get("display_name")
    db.commit()
    
    return {
        "message": "파일명이 업데이트되었습니다.",
        "file_id": file_id,
        "display_name": file.display_name
    }