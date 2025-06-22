import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from openai import OpenAI
from app.db.models import Report, AudioFile, Transcript, AIPromptForReport, ReportData
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)

class AIAnalysisService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.default_model = "gpt-4o-mini"
        # 지원되는 OpenAI 모델 목록
        self.supported_models = [
            "gpt-4.1",
            "gpt-4o",
            "gpt-4o-mini", 
            "gpt-4-turbo",
            "gpt-4",
            "gpt-3.5-turbo"
        ]
    
    def get_supported_models(self) -> List[str]:
        """지원되는 OpenAI 모델 목록 반환"""
        return self.supported_models
    
    def interpolate_prompt(
        self, 
        prompt_template: str, 
        conversation_content: str, 
        conversation_duration: int
    ) -> str:
        """
        프롬프트 템플릿에서 인터폴레이션 지시자를 실제 값으로 치환
        
        Args:
            prompt_template: 프롬프트 템플릿 문자열
            conversation_content: 모든 대화 내용을 결합한 텍스트
            conversation_duration: 총 대화 시간 (초)
        
        Returns:
            인터폴레이션된 프롬프트
        """
        # 초 단위 숫자로 포맷팅
        duration_text = str(conversation_duration)
        
        # 인터폴레이션 실행 - ai-research 예제와 동일한 방식
        interpolated = prompt_template.replace(
            "{{audio_text}}", conversation_content
        )
        interpolated = interpolated.replace(
            "{{audio_duration}}", duration_text
        )
        
        # JSON 모드 사용을 위해 JSON 형식 요청 추가
        if "JSON" not in interpolated.upper():
            interpolated += "\n\n응답은 반드시 유효한 JSON 형식으로만 작성해주세요."
        
        return interpolated
    
    def get_conversation_data(self, report_id: int) -> Dict[str, Any]:
        """
        보고서의 대화 데이터 수집 및 가공
        """
        db = SessionLocal()
        try:
            # 보고서와 관련 데이터 조회
            report = db.query(Report).filter(Report.id == report_id).first()
            if not report:
                raise ValueError(f"Report with id {report_id} not found")
            
            # 오디오 파일들과 트랜스크립트 조회
            audio_files = db.query(AudioFile).filter(
                AudioFile.report_id == report_id
            ).all()
            
            if not audio_files:
                raise ValueError("No audio files found for this report")
            
            # 모든 트랜스크립트 수집
            all_conversations = []
            total_duration = 0
            
            for audio_file in audio_files:
                if audio_file.transcript and audio_file.transcript.content:
                    all_conversations.append({
                        "audio_file_id": audio_file.id,
                        "filename": (
                            audio_file.display_name or audio_file.filename
                        ),
                        "content": audio_file.transcript.content,
                        "speaker_labels": audio_file.transcript.speaker_labels,
                        "speaker_names": audio_file.transcript.speaker_names
                    })
                    # 오디오 파일 길이 합산
                    if audio_file.duration:
                        total_duration += audio_file.duration
            
            if not all_conversations:
                raise ValueError("No transcripts found for analysis")
            
            # 대화 내용을 하나의 텍스트로 결합 (파일명 제외)
            combined_text = "\n\n".join([
                conv['content'] for conv in all_conversations
            ])
            
            return {
                "report": report,
                "conversations": all_conversations,
                "combined_text": combined_text,
                "total_duration": total_duration
            }
            
        finally:
            db.close()
    
    def preview_prompt(
        self, 
        report_id: int, 
        ai_prompt_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        AI 프롬프트 미리보기 생성
        
        Args:
            report_id: 보고서 ID
            ai_prompt_id: AI 프롬프트 ID (선택사항)
        
        Returns:
            미리보기 데이터
        """
        db = SessionLocal()
        try:
            # 대화 데이터 수집
            conversation_data = self.get_conversation_data(report_id)
            
            # 템플릿 조회 (기본값 또는 지정된 템플릿)
            if ai_prompt_id:
                template = db.query(AIPromptForReport).filter(
                    AIPromptForReport.id == ai_prompt_id
                ).first()
            else:
                template = db.query(AIPromptForReport).filter(
                    AIPromptForReport.is_default == True
                ).first()
            
            if not template:
                raise ValueError("No template found")
            
            # 프롬프트 인터폴레이션
            interpolated_prompt = self.interpolate_prompt(
                prompt_template=template.prompt_content,
                conversation_content=conversation_data["combined_text"],
                conversation_duration=conversation_data["total_duration"]
            )
            
            return {
                "template_id": template.id,
                "template_name": template.name,
                "original_prompt": template.prompt_content,
                "interpolated_prompt": interpolated_prompt,
                "conversation_summary": {
                    "total_files": len(conversation_data["conversations"]),
                    "total_duration": conversation_data["total_duration"],
                    "total_characters": len(conversation_data["combined_text"])
                }
            }
            
        finally:
            db.close()
    
    def analyze_conversation(
        self, 
        report_id: int, 
        ai_prompt_id: Optional[int] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        대화 내용을 분석하여 육아 인사이트 생성
        
        Args:
            report_id: 보고서 ID
            ai_prompt_id: AI 프롬프트 ID (선택사항, 기본값 사용 시 None)
            model: 사용할 OpenAI 모델 (선택사항)
        
        Returns:
            분석 결과 딕셔너리
        """
        db = SessionLocal()
        try:
            # 대화 데이터 수집
            conversation_data = self.get_conversation_data(report_id)
            
            # 템플릿 조회 (기본값 또는 지정된 템플릿)
            if ai_prompt_id:
                template = db.query(AIPromptForReport).filter(
                    AIPromptForReport.id == ai_prompt_id
                ).first()
            else:
                template = db.query(AIPromptForReport).filter(
                    AIPromptForReport.is_default == True
                ).first()
            
            if not template:
                raise ValueError("No template found")
            
            # 사용할 모델 결정
            selected_model = (
                model if model in self.supported_models else self.default_model
            )
            
            # AI 분석 실행
            analysis_result = self._run_ai_analysis(
                conversation_data=conversation_data,
                template=template,
                model=selected_model
            )
            
            # 분석 결과 저장 (항상 새로운 레코드로 생성)
            report_data = ReportData(
                report_id=report_id,
                ai_prompt_id=template.id,
                analysis_data=analysis_result
            )
            db.add(report_data)
            
            # 보고서 상태 업데이트
            conversation_data["report"].status = "completed"
            db.commit()
            
            return analysis_result
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    def _run_ai_analysis(
        self, 
        conversation_data: Dict[str, Any],
        template: AIPromptForReport,
        model: str
    ) -> Dict[str, Any]:
        """
        OpenAI API를 사용한 실제 AI 분석 - ai-research 예제와 동일한 구조
        """
        # 프롬프트 인터폴레이션
        interpolated_prompt = self.interpolate_prompt(
            prompt_template=template.prompt_content,
            conversation_content=conversation_data["combined_text"],
            conversation_duration=conversation_data["total_duration"]
        )
        
        try:
            # ai-research 예제와 동일한 방식: user role 단일 메시지, max_tokens 제거
            # JSON 모드 사용으로 순수 JSON 응답 보장
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": interpolated_prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            # 실제 사용된 모델 확인 (OpenAI 응답에서)
            actual_model = getattr(response, 'model', model)
            logger.info(f"요청 모델: {model}, 실제 모델: {actual_model}")
            
            # 응답 파싱
            content = response.choices[0].message.content
            
            # JSON 모드 사용으로 직접 파싱 가능
            try:
                # JSON 유효성 검사를 위해 파싱 시도
                parsed_json = json.loads(content)
                
                # 메타데이터 추가를 위해 딕셔너리로 변환
                if isinstance(parsed_json, dict):
                    # 원본 JSON 문자열과 메타데이터를 함께 저장
                    analysis_result = {
                                                 "original_json": content,  # 순서가 유지된 원본 JSON
                         "parsed_data": parsed_json,  # 파싱된 데이터
                        "_metadata": {
                            "model_used": actual_model,
                            "template_id": template.id,
                            "template_name": template.name,
                            "total_duration": conversation_data["total_duration"],
                            "total_files": len(conversation_data["conversations"])
                        }
                    }
                else:
                    # 딕셔너리가 아닌 경우
                    analysis_result = {
                        "original_json": content,
                        "parsed_data": {"raw_analysis": parsed_json},
                        "_metadata": {
                            "model_used": actual_model,
                            "template_id": template.id,
                            "template_name": template.name,
                            "total_duration": conversation_data["total_duration"],
                            "total_files": len(conversation_data["conversations"])
                        }
                    }
                
                return analysis_result
                
            except json.JSONDecodeError:
                # JSON 파싱 실패 시 원본 텍스트 반환
                return {
                    "original_json": content,
                    "parse_error": "JSON 파싱에 실패했습니다.",
                    "_metadata": {
                        "model_used": actual_model,
                        "template_id": template.id,
                        "template_name": template.name,
                        "total_duration": conversation_data["total_duration"],
                        "total_files": len(conversation_data["conversations"])
                    }
                }
                
        except Exception as e:
            logger.error(f"OpenAI API 호출 중 오류: {str(e)}")
            raise ValueError(f"AI 분석 중 오류가 발생했습니다: {str(e)}")
    
    def get_analysis_status(self, report_id: int) -> Dict[str, Any]:
        """
        분석 상태 조회
        """
        db = SessionLocal()
        try:
            report = db.query(Report).filter(Report.id == report_id).first()
            if not report:
                return {"error": "보고서를 찾을 수 없습니다."}
            
            # 최신 분석 결과 조회
            latest_analysis = db.query(ReportData).filter(
                ReportData.report_id == report_id
            ).order_by(ReportData.generated_at.desc()).first()
            
            return {
                "report_status": report.status,
                "has_analysis": latest_analysis is not None,
                "latest_analysis": latest_analysis.generated_at if latest_analysis else None,
                "analysis_count": db.query(ReportData).filter(
                    ReportData.report_id == report_id
                ).count()
            }
            
        finally:
            db.close()


# 싱글톤 인스턴스
ai_analysis_service = AIAnalysisService() 