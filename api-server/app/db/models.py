from sqlalchemy import (
    Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    parent_name = Column(String(100), nullable=True)
    child_name = Column(String(100), nullable=True)
    status = Column(String(50), default="draft")  # draft, analyzing, completed, published
    user_id = Column(Integer, nullable=True)  # 향후 사용자 인증 시스템 대비
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime, 
        default=datetime.datetime.utcnow, 
        onupdate=datetime.datetime.utcnow
    )
    
    # Relationships
    audio_files = relationship(
        "AudioFile", back_populates="report", cascade="all, delete-orphan"
    )
    report_data = relationship(
        "ReportData", back_populates="report", cascade="all, delete-orphan",
        order_by="ReportData.generated_at.desc()"
    )
    published_reports = relationship(
        "PublishedReport", back_populates="report", cascade="all, delete-orphan"
    )


class AudioFile(Base):
    __tablename__ = "audio_files"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    filename = Column(String(255), nullable=False)  # 실제 파일명
    display_name = Column(String(255), nullable=True)  # 사용자가 입력한 표시용 파일명
    s3_url = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)
    duration = Column(Integer, nullable=True)  # 초 단위
    upload_status = Column(String(50), default="uploaded")  # uploaded, processing, completed, failed
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # STT 관련 필드
    stt_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    stt_processed_at = Column(DateTime, nullable=True)
    stt_error_message = Column(Text, nullable=True)
    
    # Relationships
    report = relationship("Report", back_populates="audio_files")
    transcript = relationship(
        "Transcript", back_populates="audio_file", uselist=False, 
        cascade="all, delete-orphan"
    )
    stt_config = relationship(
        "STTConfig", back_populates="audio_file", uselist=False, 
        cascade="all, delete-orphan"
    )


class Transcript(Base):
    __tablename__ = "transcripts"
    id = Column(Integer, primary_key=True, index=True)
    audio_file_id = Column(Integer, ForeignKey("audio_files.id"), nullable=False)
    content = Column(Text, nullable=False)
    confidence_score = Column(Integer, nullable=True)  # 0-100
    is_edited = Column(Boolean, default=False)
    
    # 화자 분리 관련 필드
    speaker_labels = Column(JSON, nullable=True)  # 화자별 텍스트 세그먼트
    speaker_names = Column(JSON, nullable=True)  # 화자 이름 매핑 {"speaker1": "부모", "speaker2": "아이"}
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime, 
        default=datetime.datetime.utcnow, 
        onupdate=datetime.datetime.utcnow
    )
    
    # Relationships
    audio_file = relationship("AudioFile", back_populates="transcript")


class AIPromptForReport(Base):
    __tablename__ = "ai_prompts_for_report"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    prompt_content = Column(Text, nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime, 
        default=datetime.datetime.utcnow, 
        onupdate=datetime.datetime.utcnow
    )
    
    # Relationships
    report_data = relationship("ReportData", back_populates="ai_prompt")


class ReportData(Base):
    __tablename__ = "report_data"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    ai_prompt_id = Column(Integer, ForeignKey("ai_prompts_for_report.id"), nullable=False)
    analysis_data = Column(JSON, nullable=False)  # AI 분석 결과 JSON
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    report = relationship("Report", back_populates="report_data")
    ai_prompt = relationship("AIPromptForReport", back_populates="report_data")


class PublishedReport(Base):
    __tablename__ = "published_reports"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    canva_design_id = Column(String(255), nullable=True)
    pdf_url = Column(String(500), nullable=True)
    published_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    report = relationship("Report", back_populates="published_reports")


class STTConfig(Base):
    __tablename__ = "stt_configs"
    id = Column(Integer, primary_key=True, index=True)
    audio_file_id = Column(Integer, ForeignKey("audio_files.id"), nullable=False)
    
    # 모델 설정
    model_type = Column(String(50), default="sommers")  # sommers, whisper
    language = Column(String(10), default="ko")  # ko, detect, multi 등 (whisper 모델일 때만)
    language_candidates = Column(JSON, nullable=True)  # 언어 감지 후보군
    
    # 화자 분리 설정
    speaker_diarization = Column(Boolean, default=True)
    spk_count = Column(Integer, nullable=True)  # 화자 수 (1 이상), None이면 자동 감지
    
    # 필터 설정
    profanity_filter = Column(Boolean, default=False)
    use_disfluency_filter = Column(Boolean, default=True)  # 간투어 필터
    use_paragraph_splitter = Column(Boolean, default=False)
    paragraph_max_length = Column(Integer, nullable=True)
    
    # 기타 설정
    domain = Column(String(20), default="GENERAL")  # GENERAL, CALL
    keywords = Column(JSON, nullable=True)  # 키워드 부스팅
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime, 
        default=datetime.datetime.utcnow, 
        onupdate=datetime.datetime.utcnow
    )
    
    # Relationships
    audio_file = relationship("AudioFile", back_populates="stt_config") 