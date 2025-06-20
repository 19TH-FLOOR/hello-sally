import os
import json
import logging
import requests
from typing import Dict, Any, Optional
from app.db.models import Report, ReportData, PublishedReport
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)


class CanvaService:
    def __init__(self):
        self.api_key = os.getenv("CANVA_API_KEY")
        self.base_url = "https://api.canva.com"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def create_report_design(
        self, 
        report_id: int, 
        template_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Canva에서 보고서 디자인 생성
        """
        db = SessionLocal()
        try:
            # 보고서 정보 조회
            report = db.query(Report).filter(Report.id == report_id).first()
            if not report:
                raise ValueError("보고서를 찾을 수 없습니다.")
            
            # 최신 분석 결과 조회
            latest_analysis = db.query(ReportData).filter(
                ReportData.report_id == report_id
            ).order_by(ReportData.generated_at.desc()).first()
            
            if not latest_analysis:
                raise ValueError("분석 결과가 없습니다.")
            
            # Canva 디자인 생성
            design_data = self._create_design(
                report=report,
                analysis_data=latest_analysis.analysis_data,
                template_id=template_id
            )
            
            # 발행된 보고서 정보 저장
            published_report = PublishedReport(
                report_id=report_id,
                canva_design_id=design_data.get("design_id"),
                pdf_url=design_data.get("pdf_url")
            )
            
            db.add(published_report)
            db.commit()
            db.refresh(published_report)
            
            return {
                "success": True,
                "published_report_id": published_report.id,
                "canva_design_id": design_data.get("design_id"),
                "pdf_url": design_data.get("pdf_url")
            }
            
        except Exception as e:
            logger.error(f"Canva 디자인 생성 중 오류: {str(e)}")
            db.rollback()
            raise
        finally:
            db.close()
    
    def _create_design(
        self, 
        report: Report, 
        analysis_data: Dict[str, Any],
        template_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Canva API를 사용한 실제 디자인 생성
        """
        # 기본 템플릿 ID (실제 Canva 템플릿 ID로 변경 필요)
        default_template_id = template_id or "template_id_here"
        
        # 디자인 생성 요청 데이터
        design_request = {
            "template_id": default_template_id,
            "brand_kit_id": os.getenv("CANVA_BRAND_KIT_ID"),
            "elements": self._prepare_design_elements(report, analysis_data)
        }
        
        try:
            # Canva API 호출 (실제 구현 시 Canva API 문서 참조)
            response = requests.post(
                f"{self.base_url}/v1/designs",
                headers=self.headers,
                json=design_request
            )
            
            if response.status_code == 200:
                design_data = response.json()
                return {
                    "design_id": design_data.get("id"),
                    "pdf_url": design_data.get("pdf_url"),
                    "preview_url": design_data.get("preview_url")
                }
            else:
                logger.error(f"Canva API 오류: {response.status_code} - {response.text}")
                raise ValueError(f"Canva 디자인 생성 실패: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Canva API 요청 오류: {str(e)}")
            raise ValueError(f"Canva API 연결 오류: {str(e)}")
    
    def _prepare_design_elements(
        self, 
        report: Report, 
        analysis_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        디자인 요소 준비 (텍스트, 이미지, 차트 등)
        """
        elements = {
            "text_elements": [
                {
                    "type": "heading",
                    "content": report.title,
                    "position": {"x": 100, "y": 100},
                    "style": {"font_size": 32, "font_weight": "bold"}
                },
                {
                    "type": "subheading",
                    "content": f"부모: {report.parent_name or '미지정'} | 아이: {report.child_name or '미지정'}",
                    "position": {"x": 100, "y": 150},
                    "style": {"font_size": 18, "color": "#666666"}
                }
            ],
            "content_sections": []
        }
        
        # 분석 결과를 섹션별로 구성
        if isinstance(analysis_data, dict):
            for key, value in analysis_data.items():
                if key not in ["raw_analysis", "parse_error"]:
                    section = {
                        "title": self._format_section_title(key),
                        "content": self._format_section_content(value),
                        "type": "text"
                    }
                    elements["content_sections"].append(section)
        
        return elements
    
    def _format_section_title(self, key: str) -> str:
        """섹션 제목 포맷팅"""
        title_mapping = {
            "communication_pattern": "의사소통 패턴",
            "emotional_expression": "감정 표현",
            "interaction_quality": "상호작용 품질",
            "development_insights": "발달 인사이트",
            "recommendations": "권장사항",
            "summary": "요약"
        }
        return title_mapping.get(key, key.replace("_", " ").title())
    
    def _format_section_content(self, content: Any) -> str:
        """섹션 내용 포맷팅"""
        if isinstance(content, str):
            return content
        elif isinstance(content, list):
            return "\n".join([f"• {item}" for item in content])
        elif isinstance(content, dict):
            return "\n".join([f"• {k}: {v}" for k, v in content.items()])
        else:
            return str(content)
    
    def get_design_status(self, design_id: str) -> Dict[str, Any]:
        """디자인 상태 조회"""
        try:
            response = requests.get(
                f"{self.base_url}/v1/designs/{design_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"상태 조회 실패: {response.status_code}"}
                
        except Exception as e:
            logger.error(f"디자인 상태 조회 오류: {str(e)}")
            return {"error": str(e)}
    
    def download_pdf(self, design_id: str) -> Optional[str]:
        """PDF 다운로드 URL 생성"""
        try:
            response = requests.post(
                f"{self.base_url}/v1/designs/{design_id}/exports",
                headers=self.headers,
                json={"format": "pdf"}
            )
            
            if response.status_code == 200:
                export_data = response.json()
                return export_data.get("download_url")
            else:
                logger.error(f"PDF 내보내기 실패: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"PDF 다운로드 오류: {str(e)}")
            return None


# 싱글톤 인스턴스
canva_service = CanvaService() 