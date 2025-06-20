from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AIPromptForReportBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="템플릿명")
    description: Optional[str] = Field(None, description="템플릿 설명")
    prompt_content: str = Field(..., description="프롬프트 내용")
    is_default: bool = Field(False, description="기본 템플릿 여부")


class AIPromptForReportCreate(AIPromptForReportBase):
    pass


class AIPromptForReportUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    prompt_content: Optional[str] = None
    is_default: Optional[bool] = None


class AIPromptForReportResponse(AIPromptForReportBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AIPromptForReportListResponse(BaseModel):
    templates: list[AIPromptForReportResponse]
    total: int
    page: int
    size: int 