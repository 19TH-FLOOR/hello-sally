import os
import json
import logging
from typing import Dict, Any, List, Optional
from openai import OpenAI
from app.db.models import Report, AudioFile, Transcript, AIPromptForReport, ReportData
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)

class AIAnalysisService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-4o-mini"  # 또는 "gpt-4" 사용 가능
    
    def analyze_conversation(
        self, 
        report_id: int, 
        ai_prompt_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        대화 내용을 분석하여 육아 인사이트 생성
        
        Args:
            report_id: 보고서 ID
            ai_prompt_id: AI 프롬프트 ID (선택사항, 기본값 사용 시 None)
        
        Returns:
            분석 결과 딕셔너리
        """
        db = SessionLocal()
        try:
            # 보고서와 관련 데이터 조회
            report = db.query(Report).filter(Report.id == report_id).first()
            if not report:
                raise ValueError(f"Report with id {report_id} not found")
            
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
            
            # 오디오 파일들과 트랜스크립트 조회
            audio_files = db.query(AudioFile).filter(
                AudioFile.report_id == report_id
            ).all()
            
            if not audio_files:
                raise ValueError("No audio files found for this report")
            
            # 모든 트랜스크립트 수집
            all_conversations = []
            for audio_file in audio_files:
                if audio_file.transcript and audio_file.transcript.content:
                    all_conversations.append({
                        "audio_file_id": audio_file.id,
                        "filename": audio_file.filename,
                        "content": audio_file.transcript.content,
                        "speaker_labels": audio_file.transcript.speaker_labels,
                        "speaker_names": audio_file.transcript.speaker_names
                    })
            
            if not all_conversations:
                raise ValueError("No transcripts found for analysis")
            
            # AI 분석 실행
            analysis_result = self._run_ai_analysis(
                conversations=all_conversations,
                report_info={
                    "title": report.title,
                    "parent_name": report.parent_name,
                    "child_name": report.child_name
                },
                template=template
            )
            
            # 분석 결과 저장
            report_data = ReportData(
                report_id=report_id,
                ai_prompt_id=template.id,
                analysis_data=analysis_result
            )
            db.add(report_data)
            
            # 보고서 상태 업데이트
            report.status = "completed"
            db.commit()
            
            return analysis_result
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    def _run_ai_analysis(
        self, 
        conversations: List[Dict[str, Any]], 
        report_info: Dict[str, Any],
        template: AIPromptForReport
    ) -> Dict[str, Any]:
        """
        OpenAI API를 사용한 실제 AI 분석
        """
        # 대화 내용을 하나의 텍스트로 결합
        combined_text = "\n\n".join([
            f"[{conv['filename']}]\n{conv['content']}"
            for conv in conversations
        ])
        
        # 프롬프트 구성
        system_prompt = template.prompt_content
        
        user_prompt = f"""
다음은 부모와 아이의 대화 내용입니다. 위의 지시사항에 따라 분석해주세요.

보고서 정보:
- 제목: {report_info['title']}
- 부모 이름: {report_info['parent_name'] or '미지정'}
- 아이 이름: {report_info['child_name'] or '미지정'}

대화 내용:
{combined_text}

분석 결과는 JSON 형태로 반환해주세요.
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=4000
            )
            
            # 응답 파싱
            content = response.choices[0].message.content
            
            # JSON 추출 시도
            try:
                # JSON 블록이 있는 경우 추출
                if "```json" in content:
                    json_start = content.find("```json") + 7
                    json_end = content.find("```", json_start)
                    json_str = content[json_start:json_end].strip()
                else:
                    # 전체 내용이 JSON인 경우
                    json_str = content.strip()
                
                analysis_result = json.loads(json_str)
                
                # 기본 구조 보장
                if not isinstance(analysis_result, dict):
                    analysis_result = {"raw_analysis": analysis_result}
                
                return analysis_result
                
            except json.JSONDecodeError:
                # JSON 파싱 실패 시 원본 텍스트 반환
                return {
                    "raw_analysis": content,
                    "parse_error": "JSON 파싱에 실패했습니다."
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