from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()


class AudioFile(Base):
    __tablename__ = "audio_files"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    s3_url = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # STT 관련 필드 추가
    stt_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    stt_transcript = Column(Text, nullable=True)  # STT 결과 텍스트
    stt_processed_at = Column(DateTime, nullable=True)  # STT 처리 완료 시간
    stt_error_message = Column(Text, nullable=True)  # STT 실패 시 오류 메시지 