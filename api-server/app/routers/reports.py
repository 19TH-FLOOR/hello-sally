from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.db.models import Report, AudioFile, Transcript, ReportData, PublishedReport
from app.schemas.reports import (
    ReportCreate, ReportUpdate, ReportResponse, ReportDetailResponse,
    ReportListResponse, ReportStatus
)
from app.services.ai_analysis import ai_analysis_service
from app.services.canva import canva_service

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
    status_filter: Optional[ReportStatus] = Query(None, description="상태 필터"),
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
    reports = query.order_by(Report.created_at.desc()).offset((page - 1) * size).limit(size).all()
    
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
    
    # 이미 발행된 보고서가 있는지 확인
    published_reports = db.query(PublishedReport).filter(
        PublishedReport.report_id == report_id
    ).count()
    
    if published_reports > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 발행된 보고서가 있어 삭제할 수 없습니다."
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
    
    # 상태 전환 검증
    if report.status == ReportStatus.PUBLISHED and new_status != ReportStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 발행된 보고서의 상태를 변경할 수 없습니다."
        )
    
    report.status = new_status
    report.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(report)
    
    return {"message": f"보고서 상태가 {new_status}로 변경되었습니다.", "report": report}


@router.post("/{report_id}/analyze")
def analyze_report(
    report_id: int,
    ai_prompt_id: Optional[int] = None,
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
            ai_prompt_id
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


@router.post("/{report_id}/publish")
def publish_report(
    report_id: int,
    template_id: Optional[str] = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """Canva를 통한 보고서 발행"""
    # 보고서 존재 확인
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="보고서를 찾을 수 없습니다."
        )
    
    # 분석 결과 확인
    latest_analysis = db.query(ReportData).filter(
        ReportData.report_id == report_id
    ).order_by(ReportData.generated_at.desc()).first()
    
    if not latest_analysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI 분석 결과가 없습니다."
        )
    
    # 백그라운드에서 Canva 디자인 생성
    if background_tasks:
        background_tasks.add_task(
            run_publish_background,
            report_id,
            template_id
        )
    
    return {
        "message": "보고서 발행이 시작되었습니다.",
        "report_id": report_id,
        "status": "publishing"
    }


@router.get("/{report_id}/published-reports")
def get_published_reports(report_id: int, db: Session = Depends(get_db)):
    """발행된 보고서 목록 조회"""
    published_reports = db.query(PublishedReport).filter(
        PublishedReport.report_id == report_id
    ).order_by(PublishedReport.published_at.desc()).all()
    
    return {
        "report_id": report_id,
        "published_reports": published_reports
    }


def run_analysis_background(report_id: int, ai_prompt_id: Optional[int] = None):
    """백그라운드에서 AI 분석 실행"""
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    try:
        # AI 분석 실행
        result = ai_analysis_service.analyze_conversation(
            report_id=report_id,
            ai_prompt_id=ai_prompt_id
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


def run_publish_background(report_id: int, template_id: Optional[str] = None):
    """백그라운드에서 Canva 발행 실행"""
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    try:
        # Canva 디자인 생성
        result = canva_service.create_report_design(
            report_id=report_id,
            template_id=template_id
        )
        
        # 보고서 상태를 published로 변경
        report = db.query(Report).filter(Report.id == report_id).first()
        if report:
            report.status = ReportStatus.PUBLISHED
            db.commit()
        
        return result
        
    except Exception as e:
        logger.error(f"Canva 발행 백그라운드 오류: {str(e)}")
        raise
    finally:
        db.close() 