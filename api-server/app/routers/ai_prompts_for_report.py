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


@router.get("/interpolation/variables")
def get_interpolation_variables():
    """인터폴레이션 변수 정보 조회"""
    variables = [
        {
            "variable": "{{conversation_content}}",
            "description": "모든 오디오 파일의 STT 결과를 결합한 전체 대화 내용",
            "type": "string",
            "example": "부모: 안녕하세요\\n아이: 안녕하세요\\n부모: 오늘 뭐 했어?\\n아이: 놀았어요",
            "notes": [
                "여러 오디오 파일이 있는 경우 모든 내용이 결합됩니다",
                "파일명은 포함되지 않고 순수 대화 내용만 포함됩니다",
                "화자 구분이 있는 경우 \"화자명: 내용\" 형태로 표시됩니다"
            ]
        },
        {
            "variable": "{{conversation_duration}}",
            "description": "모든 오디오 파일의 총 재생 시간 (초 단위)",
            "type": "number",
            "example": "180",
            "notes": [
                "초 단위의 숫자로 제공됩니다 (예: 180 = 3분)",
                "여러 오디오 파일이 있는 경우 모든 파일의 시간이 합산됩니다",
                "프롬프트에서 분 단위로 변환하거나 조건문에 활용할 수 있습니다"
            ]
        }
    ]
    
    return {
        "variables": variables,
        "total": len(variables)
    }