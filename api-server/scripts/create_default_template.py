#!/usr/bin/env python3
"""
기본 보고서 템플릿 생성 스크립트
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.db.models import AIPromptForReport

def create_default_template():
    """기본 보고서 템플릿 생성"""
    db = SessionLocal()
    
    try:
        # 기존 기본 템플릿 확인
        existing_default = db.query(AIPromptForReport).filter(
            AIPromptForReport.is_default == True
        ).first()
        
        if existing_default:
            print(f"기본 템플릿이 이미 존재합니다: {existing_default.name}")
            return
        
        # 기본 템플릿 생성
        default_template = AIPromptForReport(
            name="기본 육아 대화 분석 템플릿",
            description="부모와 아이의 대화를 분석하여 육아 인사이트를 제공하는 기본 템플릿",
            prompt_content="""당신은 육아 전문가입니다. 부모와 아이의 대화 내용을 분석하여 다음과 같은 구조화된 보고서를 작성해주세요.

분석해야 할 주요 영역:
1. 의사소통 패턴: 대화의 흐름, 질문-답변 패턴, 대화 주도권
2. 감정 표현: 부모와 아이의 감정 상태, 공감 표현, 스트레스 신호
3. 상호작용 품질: 긍정적/부정적 상호작용 비율, 관심과 집중도
4. 발달 인사이트: 아이의 언어 발달, 인지 발달, 사회성 발달
5. 권장사항: 개선할 수 있는 부분과 구체적인 제안사항

다음 JSON 형식으로 응답해주세요:
{
  "communication_pattern": {
    "summary": "의사소통 패턴 요약",
    "details": ["세부 관찰 사항들"],
    "score": 85
  },
  "emotional_expression": {
    "summary": "감정 표현 분석",
    "positive_moments": ["긍정적 순간들"],
    "concerns": ["우려사항들"],
    "score": 90
  },
  "interaction_quality": {
    "summary": "상호작용 품질 평가",
    "strengths": ["강점들"],
    "improvements": ["개선점들"],
    "score": 88
  },
  "development_insights": {
    "language_development": "언어 발달 상태",
    "cognitive_development": "인지 발달 상태",
    "social_development": "사회성 발달 상태"
  },
  "recommendations": [
    "구체적인 권장사항 1",
    "구체적인 권장사항 2",
    "구체적인 권장사항 3"
  ],
  "summary": "전체적인 육아 상황 요약 및 종합 평가"
}

각 점수는 0-100 사이의 값으로 평가해주세요.""",
            is_default=True
        )
        
        db.add(default_template)
        db.commit()
        
        print("기본 템플릿이 성공적으로 생성되었습니다.")
        print(f"템플릿 ID: {default_template.id}")
        print(f"템플릿명: {default_template.name}")
        
    except Exception as e:
        print(f"템플릿 생성 중 오류 발생: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_default_template() 