from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class ReportStatus(str, Enum):
    DRAFT = "draft"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    PUBLISHED = "published"


# Base 스키마
class ReportBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="보고서명")
    parent_name: Optional[str] = Field(None, max_length=100, description="부모 이름")
    child_name: Optional[str] = Field(None, max_length=100, description="아이 이름")


# 생성용 스키마
class ReportCreate(ReportBase):
    pass


# 업데이트용 스키마
class ReportUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    parent_name: Optional[str] = Field(None, max_length=100)
    child_name: Optional[str] = Field(None, max_length=100)
    status: Optional[ReportStatus] = None


# 응답용 스키마
class ReportResponse(ReportBase):
    id: int
    status: ReportStatus
    user_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# STT 결과 스키마
class TranscriptBase(BaseModel):
    content: str
    confidence_score: Optional[int] = None
    is_edited: bool = False
    speaker_labels: Optional[Dict[str, Any]] = None  # 화자별 텍스트 세그먼트
    speaker_names: Optional[Dict[str, str]] = None  # 화자 이름 매핑


class TranscriptResponse(TranscriptBase):
    id: int
    audio_file_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# STT 설정 스키마
class STTConfigBase(BaseModel):
    model_type: str = "sommers"  # sommers, whisper
    language: str = "ko"  # ko, detect, multi 등 (whisper 모델일 때만)
    language_candidates: Optional[List[str]] = Field(
        None, 
        description="언어 감지 후보군 (whisper 모델이고 language가 detect 또는 multi일 때만 적용)"
    )
    speaker_diarization: bool = True
    spk_count: Optional[int] = Field(
        None, ge=2, description="화자 수 (2 이상), None이면 자동 감지"
    )
    profanity_filter: bool = False
    use_disfluency_filter: bool = True  # 간투어 필터
    use_paragraph_splitter: bool = False
    paragraph_max_length: Optional[int] = Field(None, ge=1, description="문단 최대 길이")
    domain: str = "GENERAL"  # GENERAL, CALL
    keywords: Optional[List[str]] = None  # 키워드 부스팅


class STTConfigCreate(STTConfigBase):
    pass


class STTConfigUpdate(BaseModel):
    model_type: Optional[str] = None
    language: Optional[str] = None
    language_candidates: Optional[List[str]] = None
    speaker_diarization: Optional[bool] = None
    spk_count: Optional[int] = Field(None, ge=2)
    profanity_filter: Optional[bool] = None
    use_disfluency_filter: Optional[bool] = None
    use_paragraph_splitter: Optional[bool] = None
    paragraph_max_length: Optional[int] = Field(None, ge=1)
    domain: Optional[str] = None
    keywords: Optional[List[str]] = None


class STTConfigResponse(STTConfigBase):
    id: int
    audio_file_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# 음성 파일 스키마
class AudioFileBase(BaseModel):
    filename: str
    display_name: Optional[str] = None  # 사용자가 입력한 표시용 파일명
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
    stt_transcript: Optional[str] = None  # STT 결과 텍스트
    stt_config: Optional[STTConfigResponse] = None  # STT 설정
    
    class Config:
        from_attributes = True


# AI 분석 결과 스키마
class ReportDataBase(BaseModel):
    analysis_data: Dict[str, Any]


class ReportDataResponse(ReportDataBase):
    id: int
    report_id: int
    ai_prompt_id: int
    generated_at: datetime
    
    class Config:
        from_attributes = True


# 최종 보고서 스키마
class PublishedReportBase(BaseModel):
    canva_design_id: Optional[str] = None
    pdf_url: Optional[str] = None


class PublishedReportResponse(PublishedReportBase):
    id: int
    report_id: int
    published_at: datetime
    
    class Config:
        from_attributes = True


# 상세 보고서 응답 (관계 포함)
class ReportDetailResponse(ReportResponse):
    audio_files: List[AudioFileResponse] = []
    report_data: List[ReportDataResponse] = []
    published_reports: List[PublishedReportResponse] = []
    
    class Config:
        from_attributes = True


# 보고서 목록 응답
class ReportListResponse(BaseModel):
    reports: List[ReportResponse]
    total: int
    page: int
    size: int 