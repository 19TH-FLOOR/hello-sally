from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AudioFileBase(BaseModel):
    filename: str = Field(..., description="파일명")
    file_size: Optional[int] = Field(None, description="파일 크기 (bytes)")
    duration: Optional[int] = Field(None, description="재생 시간 (초)")


class AudioFileCreate(AudioFileBase):
    report_id: int = Field(..., description="보고서 ID")


class AudioFileUpdate(BaseModel):
    filename: Optional[str] = None
    file_size: Optional[int] = None
    duration: Optional[int] = None


class AudioFileResponse(AudioFileBase):
    id: int
    report_id: int
    s3_url: str
    upload_status: str
    stt_status: str
    uploaded_at: datetime
    stt_processed_at: Optional[datetime] = None
    stt_error_message: Optional[str] = None
    
    class Config:
        from_attributes = True


class AudioFileListResponse(BaseModel):
    audio_files: list[AudioFileResponse]
    total: int
    page: int
    size: int 