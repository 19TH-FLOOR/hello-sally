from fastapi import (
    APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
)
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import logging

from app.db.session import get_db
from app.db.models import (
    Report, AudioFile, Transcript, ReportData
)
from app.schemas.reports import (
    ReportCreate, ReportUpdate, ReportResponse, 
    ReportDetailResponse, ReportListResponse, ReportStatus,
    AIAnalysisRequest
)
from app.services.ai_analysis import ai_analysis_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    report_data: ReportCreate,
    db: Session = Depends(get_db)
):
    """새로운 보고서 생성"""
    report = Report(
        title=report_data.title,
        parent_name=report_data.parent_name,
        child_name=report_data.child_name,
        status=ReportStatus.DRAFT,
        user_id=None  # 향후 인증 시스템 구현 시 수정
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return report


@router.get("", response_model=ReportListResponse)
def get_reports(
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(10, ge=1, le=100, description="페이지 크기"),
    status_filter: Optional[ReportStatus] = Query(
        None, description="상태 필터"
    ),
    db: Session = Depends(get_db)
):
    """보고서 목록 조회 (페이지네이션 지원)"""
    query = db.query(Report)
    
    # 상태 필터 적용
    if status_filter:
        query = query.filter(Report.status == status_filter)
    
    # 전체 개수 조회
    total = query.count()
    
    # 페이지네이션 적용
    reports = query.order_by(Report.created_at.desc()).offset(
        (page - 1) * size
    ).limit(size).all()
    
    return ReportListResponse(
        reports=reports,
        total=total,
        page=page,
        size=size
    )


@router.get("/{report_id}", response_model=ReportDetailResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    """보고서 상세 조회 (관계 데이터 포함)"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="보고서를 찾을 수 없습니다."
        )
    
    # AudioFile 객체에 stt_transcript 필드 추가
    for audio_file in report.audio_files:
        if audio_file.transcript:
            audio_file.stt_transcript = audio_file.transcript.content
        else:
            audio_file.stt_transcript = ""
    
    return report


@router.put("/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: int,
    report_data: ReportUpdate,
    db: Session = Depends(get_db)
):
    """보고서 정보 업데이트"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="보고서를 찾을 수 없습니다."
        )
    
    # 업데이트할 필드만 적용
    update_data = report_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(report, field, value)
    
    report.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(report)
    
    return report


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(report_id: int, db: Session = Depends(get_db)):
    """보고서 삭제"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="보고서를 찾을 수 없습니다."
        )
    
    db.delete(report)
    db.commit()
    
    return None


@router.post("/{report_id}/status/{new_status}")
def update_report_status(
    report_id: int,
    new_status: ReportStatus,
    db: Session = Depends(get_db)
):
    """보고서 상태 업데이트"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="보고서를 찾을 수 없습니다."
        )
    
    report.status = new_status
    report.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(report)
    
    return {
        "message": f"보고서 상태가 {new_status}로 변경되었습니다.",
        "report": report
    }


@router.get("/{report_id}/ai-analysis/models")
def get_supported_models(report_id: int, db: Session = Depends(get_db)):
    """지원되는 OpenAI 모델 목록 조회"""
    # 보고서 존재 확인
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="보고서를 찾을 수 없습니다."
        )
    
    return {
        "report_id": report_id,
        "supported_models": ai_analysis_service.get_supported_models()
    }


@router.post("/{report_id}/ai-analysis/preview")
def preview_ai_analysis(
    report_id: int,
    ai_prompt_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """AI 분석 프롬프트 미리보기"""
    try:
        preview_data = ai_analysis_service.preview_prompt(
            report_id=report_id,
            ai_prompt_id=ai_prompt_id
        )
        return preview_data
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{report_id}/ai-analysis/latest")
def get_latest_analysis(report_id: int, db: Session = Depends(get_db)):
    """최신 AI 분석 결과 조회"""
    # 보고서 존재 확인
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="보고서를 찾을 수 없습니다."
        )
    
    # 최신 분석 결과 조회
    latest_analysis = db.query(ReportData).filter(
        ReportData.report_id == report_id
    ).order_by(ReportData.generated_at.desc()).first()
    
    if not latest_analysis:
        return {
            "report_id": report_id,
            "has_analysis": False,
            "analysis_data": None
        }
    
    return {
        "report_id": report_id,
        "has_analysis": True,
        "analysis_data": latest_analysis.analysis_data,
        "generated_at": latest_analysis.generated_at,
        "ai_prompt_id": latest_analysis.ai_prompt_id
    }


@router.post("/{report_id}/analyze")
def analyze_report(
    report_id: int,
    request: AIAnalysisRequest,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """보고서 AI 분석 시작"""
    # 보고서 존재 확인
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="보고서를 찾을 수 없습니다."
        )
    
    # 음성 파일과 STT 결과 확인
    audio_files = db.query(AudioFile).filter(
        AudioFile.report_id == report_id
    ).all()
    
    if not audio_files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="분석할 음성 파일이 없습니다."
        )
    
    # STT 완료된 파일 확인
    completed_stt = 0
    for audio_file in audio_files:
        transcript = db.query(Transcript).filter(
            Transcript.audio_file_id == audio_file.id
        ).first()
        if transcript and transcript.content:
            completed_stt += 1
    
    if completed_stt == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="STT 처리가 완료된 파일이 없습니다."
        )
    
    # 상태를 analyzing로 변경
    report.status = ReportStatus.ANALYZING
    db.commit()
    
    # 백그라운드에서 분석 실행
    if background_tasks:
        background_tasks.add_task(
            run_analysis_background,
            report_id,
            request.ai_prompt_id,
            request.model
        )
    
    return {
        "message": "AI 분석이 시작되었습니다.",
        "report_id": report_id,
        "status": "analyzing"
    }


@router.get("/{report_id}/analysis-status")
def get_analysis_status(report_id: int, db: Session = Depends(get_db)):
    """AI 분석 상태 조회"""
    status_info = ai_analysis_service.get_analysis_status(report_id)
    
    if "error" in status_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=status_info["error"]
        )
    
    return status_info


def run_analysis_background(
    report_id: int, 
    ai_prompt_id: Optional[int] = None,
    model: Optional[str] = None
):
    """백그라운드에서 AI 분석 실행"""
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    try:
        # AI 분석 실행
        result = ai_analysis_service.analyze_conversation(
            report_id=report_id,
            ai_prompt_id=ai_prompt_id,
            model=model
        )
        
        # 보고서 상태를 completed로 변경
        report = db.query(Report).filter(Report.id == report_id).first()
        if report:
            report.status = ReportStatus.COMPLETED
            db.commit()
        
        return result
        
    except Exception as e:
        # 오류 발생 시 상태를 draft로 되돌림
        report = db.query(Report).filter(Report.id == report_id).first()
        if report:
            report.status = ReportStatus.DRAFT
            db.commit()
        
        logger.error(f"AI 분석 백그라운드 오류: {str(e)}")
        raise
    finally:
        db.close() 