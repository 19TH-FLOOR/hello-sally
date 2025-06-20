from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.db.session import get_db
from app.db.models import AIPromptForReport
from app.schemas.ai_prompts_for_report import (
    AIPromptForReportCreate, AIPromptForReportUpdate, 
    AIPromptForReportResponse, AIPromptForReportListResponse
)

router = APIRouter()


@router.post("", response_model=AIPromptForReportResponse, 
             status_code=status.HTTP_201_CREATED)
def create_template(
    template_data: AIPromptForReportCreate,
    db: Session = Depends(get_db)
):
    """새로운 보고서 템플릿 생성"""
    # 기본 템플릿으로 설정하는 경우, 기존 기본 템플릿 해제
    if template_data.is_default:
        db.query(AIPromptForReport).filter(
            AIPromptForReport.is_default.is_(True)
        ).update({"is_default": False})
    
    template = AIPromptForReport(**template_data.dict())
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return template


@router.get("", response_model=AIPromptForReportListResponse)
def get_templates(
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(10, ge=1, le=100, description="페이지 크기"),
    is_default: Optional[bool] = Query(None, description="기본 템플릿 필터"),
    db: Session = Depends(get_db)
):
    """템플릿 목록 조회"""
    query = db.query(AIPromptForReport)
    
    if is_default is not None:
        query = query.filter(AIPromptForReport.is_default == is_default)
    
    total = query.count()
    templates = query.order_by(AIPromptForReport.created_at.desc()).offset(
        (page - 1) * size
    ).limit(size).all()
    
    return AIPromptForReportListResponse(
        templates=templates,
        total=total,
        page=page,
        size=size
    )


@router.get("/{ai_prompt_id}", response_model=AIPromptForReportResponse)
def get_template(ai_prompt_id: int, db: Session = Depends(get_db)):
    """템플릿 상세 조회"""
    template = db.query(AIPromptForReport).filter(
        AIPromptForReport.id == ai_prompt_id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="템플릿을 찾을 수 없습니다."
        )
    
    return template


@router.put("/{ai_prompt_id}", response_model=AIPromptForReportResponse)
def update_template(
    ai_prompt_id: int,
    template_data: AIPromptForReportUpdate,
    db: Session = Depends(get_db)
):
    """템플릿 업데이트"""
    template = db.query(AIPromptForReport).filter(
        AIPromptForReport.id == ai_prompt_id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="템플릿을 찾을 수 없습니다."
        )
    
    update_data = template_data.dict(exclude_unset=True)
    
    # 기본 템플릿으로 설정하는 경우, 기존 기본 템플릿 해제
    if update_data.get("is_default"):
        db.query(AIPromptForReport).filter(
            AIPromptForReport.is_default.is_(True),
            AIPromptForReport.id != ai_prompt_id
        ).update({"is_default": False})
    
    for field, value in update_data.items():
        setattr(template, field, value)
    
    template.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(template)
    
    return template


@router.delete("/{ai_prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(ai_prompt_id: int, db: Session = Depends(get_db)):
    """템플릿 삭제"""
    template = db.query(AIPromptForReport).filter(
        AIPromptForReport.id == ai_prompt_id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="템플릿을 찾을 수 없습니다."
        )
    
    # 기본 템플릿은 삭제 불가
    if template.is_default:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="기본 템플릿은 삭제할 수 없습니다."
        )
    
    # 이 프롬프트를 사용하는 보고서가 있는지 확인
    from app.db.models import ReportData
    report_data_count = db.query(ReportData).filter(
        ReportData.ai_prompt_id == ai_prompt_id
    ).count()
    
    if report_data_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="사용 중인 프롬프트는 삭제할 수 없습니다."
        )
    
    db.delete(template)
    db.commit()
    
    return None


@router.get("/default", response_model=AIPromptForReportResponse)
def get_default_template(db: Session = Depends(get_db)):
    """기본 템플릿 조회"""
    template = db.query(AIPromptForReport).filter(
        AIPromptForReport.is_default.is_(True)
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="기본 템플릿이 설정되지 않았습니다."
        )
    
    return template 