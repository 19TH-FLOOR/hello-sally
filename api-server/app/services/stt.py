import requests
import os
import time
import tempfile
import json
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class ReturnZeroSTTService:
    def __init__(self):
        self.client_id = os.getenv("RTZR_CLIENT_ID")
        self.client_secret = os.getenv("RTZR_CLIENT_SECRET")
        self.base_url = "https://openapi.vito.ai/v1"
        self.access_token = None
        self.token_expires_at = 0
        
        if not self.client_id or not self.client_secret:
            raise ValueError(
                "RTZR_CLIENT_ID와 RTZR_CLIENT_SECRET 환경변수가 필요합니다."
            )
    
    def _get_mime_type(self, file_extension: str) -> str:
        """파일 확장자에 따른 MIME 타입 반환"""
        mime_types = {
            '.mp3': 'audio/mpeg',
            '.mp4': 'audio/mp4',
            '.m4a': 'audio/mp4',
            '.wav': 'audio/wav',
            '.flac': 'audio/flac',
            '.amr': 'audio/amr',
            '.ogg': 'audio/ogg'
        }
        
        extension = file_extension.lower()
        mime_type = mime_types.get(extension, 'audio/wav')
        logger.debug(f"파일 확장자 {extension}에 대한 MIME 타입: {mime_type}")
        return mime_type
    
    def _get_access_token(self) -> str:
        """액세스 토큰 발급 또는 갱신"""
        current_time = time.time()
        
        # 토큰이 유효하면 기존 토큰 사용
        if self.access_token and current_time < self.token_expires_at:
            logger.debug("기존 액세스 토큰 사용")
            return self.access_token
        
        # 새 토큰 발급
        auth_url = f"{self.base_url}/authenticate"
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }
        
        logger.info(f"새 액세스 토큰 요청: {auth_url}")
        logger.debug(f"인증 데이터: client_id={self.client_id[:8]}...")
        
        try:
            response = requests.post(auth_url, data=data, timeout=30)
            logger.debug(f"인증 응답 상태: {response.status_code}")
            logger.debug(f"인증 응답 헤더: {dict(response.headers)}")
            
            response.raise_for_status()
            
            token_data = response.json()
            logger.debug(f"토큰 응답: {token_data}")
            
            self.access_token = token_data["access_token"]
            # 토큰 만료 시간을 현재 시간 + 5시간으로 설정 (6시간 유효하지만 여유를 둠)
            self.token_expires_at = current_time + (5 * 60 * 60)
            
            logger.info("리턴제로 STT 액세스 토큰 발급 성공")
            return self.access_token
            
        except requests.RequestException as e:
            logger.error(f"리턴제로 STT 인증 실패: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"인증 실패 응답: {e.response.text}")
            raise Exception(f"STT 서비스 인증 실패: {e}")
    
    def _download_file_from_s3(self, s3_url: str) -> tuple[str, str]:
        """S3에서 파일을 임시 디렉토리로 다운로드"""
        logger.info(f"S3에서 파일 다운로드 시작: {s3_url}")
        
        # S3 URL에서 파일명 추출
        try:
            from app.services.s3 import extract_s3_key_from_url, s3_client, AWS_S3_BUCKET_NAME
            filename = extract_s3_key_from_url(s3_url)
            logger.info(f"추출된 파일명: {filename}")
        except Exception as e:
            logger.error(f"파일명 추출 실패: {e}")
            raise Exception(f"파일명 추출 실패: {e}")
        
        # audio_files.py와 동일한 방식으로 Pre-signed URL 생성
        try:
            # 리전별 엔드포인트를 사용하는 S3 클라이언트 생성
            import boto3
            from botocore.config import Config
            
            regional_s3_client = boto3.client(
                's3',
                region_name='ap-northeast-2',
                config=Config(
                    signature_version='s3v4',
                    region_name='ap-northeast-2',
                    s3={'addressing_style': 'virtual'}
                )
            )
            
            presigned_url = regional_s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': AWS_S3_BUCKET_NAME, 'Key': filename},
                ExpiresIn=1800  # 30분
            )
            logger.info(f"Pre-signed URL 생성 완료")
            logger.debug(f"Pre-signed URL: {presigned_url[:100]}...")
        except Exception as e:
            logger.error(f"Pre-signed URL 생성 실패: {e}")
            raise Exception(f"Pre-signed URL 생성 실패: {e}")
        
        try:
            # Pre-signed URL로 파일 다운로드 (리다이렉트 자동 처리)
            response = requests.get(presigned_url, timeout=60, allow_redirects=True)
            logger.debug(f"S3 응답 상태: {response.status_code}")
            logger.debug(f"S3 응답 헤더: {dict(response.headers)}")
            logger.debug(f"최종 URL: {response.url}")
            
            # 307 리다이렉트 처리
            if response.status_code == 307:
                location = response.headers.get('Location')
                if location:
                    logger.info(f"307 리다이렉트 감지, 새 URL로 재시도: {location[:100]}...")
                    response = requests.get(location, timeout=60, allow_redirects=True)
                    logger.debug(f"리다이렉트 후 응답 상태: {response.status_code}")
                    logger.debug(f"리다이렉트 후 응답 헤더: {dict(response.headers)}")
            
            response.raise_for_status()
            
            # 파일 확장자 추출 (원본 URL에서)
            file_extension = ""
            if "." in s3_url:
                file_extension = "." + s3_url.split(".")[-1].split("?")[0]
            
            logger.info(f"감지된 파일 확장자: {file_extension}")
            
            # Content-Type 헤더에서 실제 파일 타입 확인
            content_type = response.headers.get('content-type', '')
            logger.info(f"S3 파일의 Content-Type: {content_type}")
            
            # 파일 크기 확인
            file_size = len(response.content)
            logger.info(f"다운로드된 파일 크기: {file_size} bytes")
            
            # 파일이 너무 작거나 XML 응답인 경우 에러
            if file_size < 1000:  # 1KB 미만
                logger.error(f"파일 크기가 너무 작음: {file_size} bytes")
                
            if content_type.startswith('application/xml') or content_type.startswith('text/xml'):
                logger.error("S3에서 XML 응답을 받음 - 파일 접근 오류")
                # XML 내용 로깅
                try:
                    xml_content = response.content.decode('utf-8')
                    logger.error(f"XML 응답 내용: {xml_content}")
                except Exception:
                    pass
                raise Exception("S3 파일 접근 실패 - XML 에러 응답")
            
            # 임시 파일 생성
            with tempfile.NamedTemporaryFile(
                delete=False, suffix=file_extension
            ) as temp_file:
                temp_file.write(response.content)
                temp_file_path = temp_file.name
            
            logger.info(
                f"파일 다운로드 완료: {temp_file_path} "
                f"(크기: {file_size} bytes)"
            )
            
            # 파일 시그니처 확인 (처음 몇 바이트)
            if file_size > 0:
                file_signature = response.content[:16].hex()
                logger.debug(f"파일 시그니처 (첫 16바이트): {file_signature}")
                
                # 일반적인 오디오 파일 시그니처 확인
                audio_signatures = {
                    'mp3': ['494433', 'fffb', 'fff3', 'fff2'],  # ID3, MP3 frame sync
                    'wav': ['52494646'],  # RIFF
                    'm4a': ['00000020667479704d344120', '00000018667479704d344120'],  # ftyp M4A
                    'flac': ['664c6143'],  # fLaC
                    'ogg': ['4f676753']  # OggS
                }
                
                is_valid_audio = False
                for format_name, signatures in audio_signatures.items():
                    for sig in signatures:
                        if file_signature.lower().startswith(sig.lower()):
                            logger.info(f"유효한 {format_name.upper()} 파일 감지")
                            is_valid_audio = True
                            break
                    if is_valid_audio:
                        break
                
                if not is_valid_audio:
                    logger.warning(f"알 수 없는 파일 형식. 시그니처: {file_signature}")
            
            return temp_file_path, file_extension
            
        except requests.RequestException as e:
            logger.error(f"S3 파일 다운로드 실패: {e}")
            raise Exception(f"파일 다운로드 실패: {e}")

    def transcribe_file(
        self, 
        file_url: str, 
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        음성 파일을 텍스트로 변환 (리턴제로 RTZR STT API)
        
        Args:
            file_url: S3에 업로드된 음성 파일 URL
            config: STT 설정 (모델명, 화자 분리, 필터 등)
        
        Returns:
            STT 결과 딕셔너리
        """
        logger.info(f"STT 변환 시작: {file_url}")
        
        access_token = self._get_access_token()
        temp_file_path = None
        
        try:
            # S3에서 파일 다운로드
            temp_file_path, file_extension = self._download_file_from_s3(
                file_url
            )
            
            # 리턴제로 API 기본 설정
            default_config = {
                "model_name": "sommers",  # sommers, whisper
                "language": "ko",
                "use_itn": True,  # 영어/숫자/단위 변환
                "use_disfluency_filter": True,  # 간투어 필터
                "use_profanity_filter": False,  # 비속어 필터
                "use_paragraph_splitter": True,  # 문단 나누기
                "paragraph_splitter": {"max": 50},  # 문단 최대 길이
                "domain": "GENERAL",  # 도메인 설정
                "use_word_timestamp": False,  # 단어별 Timestamp
                "use_diarization": False,  # 화자 분리
            }
            
            # 사용자 설정 적용
            if config:
                # 모델 설정
                if config.get("model_type"):
                    default_config["model_name"] = config["model_type"]
                
                # 언어 설정 (Whisper 모델일 때만)
                if config.get("model_type") == "whisper":
                    if config.get("language"):
                        default_config["language"] = config["language"]
                    
                    # 언어 감지 후보군 설정 (detect 또는 multi일 때만)
                    if config.get("language") in ["detect", "multi"] and config.get("language_candidates"):
                        default_config["language_candidates"] = config["language_candidates"]
                
                # 간투어 필터 설정
                if config.get("use_disfluency_filter") is not None:
                    default_config["use_disfluency_filter"] = config["use_disfluency_filter"]
                
                # 욕설 필터 설정
                if config.get("profanity_filter") is not None:
                    default_config["use_profanity_filter"] = config["profanity_filter"]
                
                # 문단 나누기 설정
                if config.get("use_paragraph_splitter") is not None:
                    default_config["use_paragraph_splitter"] = config["use_paragraph_splitter"]
                    # paragraph_max_length가 None이 아닐 때만 포함
                    paragraph_max_length = config.get("paragraph_max_length")
                    if paragraph_max_length is not None:
                        default_config["paragraph_splitter"]["max"] = paragraph_max_length
                
                # 도메인 설정
                if config.get("domain"):
                    default_config["domain"] = config["domain"]
                
                # 키워드 부스팅 설정
                if config.get("keywords"):
                    default_config["keywords"] = config["keywords"]
                
                # 화자 분리 설정 (리턴제로 API 스펙에 맞춤)
                if config.get("speaker_diarization"):
                    default_config["use_diarization"] = True
                    diarization_config = {}
                    
                    # spk_count가 None이 아닐 때만 포함 (자동 감지를 위해)
                    spk_count = config.get("spk_count")
                    if spk_count is not None:
                        diarization_config["spk_count"] = spk_count
                    
                    default_config["diarization"] = diarization_config
            
            logger.info(f"STT 설정: {default_config}")
            
            # 1단계: STT 작업 시작
            transcribe_url = f"{self.base_url}/transcribe"
            headers = {
                "Authorization": f"Bearer {access_token}"
            }
            
            logger.info(f"STT 요청 URL: {transcribe_url}")
            logger.debug(f"요청 헤더: {headers}")
            
            # 파일 확장자에 따른 올바른 MIME 타입 설정
            mime_type = self._get_mime_type(file_extension)
            filename = f'audio{file_extension}'
            
            # 실제 파일을 multipart/form-data로 업로드
            with open(temp_file_path, 'rb') as file:
                # 파일 내용 확인
                file_content = file.read()
                file.seek(0)  # 파일 포인터를 처음으로 되돌림
                
                logger.info(f"업로드할 파일 크기: {len(file_content)} bytes")
                logger.debug(f"파일 시그니처: {file_content[:16].hex()}")
                
                files = {
                    'file': (filename, file, mime_type)
                }
                data = {
                    'config': json.dumps(default_config)
                }
                
                logger.info(f"파일 업로드 시작: {temp_file_path}")
                logger.info(f"파일명: {filename}, MIME 타입: {mime_type}")
                logger.info(f"Config JSON: {json.dumps(default_config)}")
                logger.debug(f"요청 데이터: {data}")
                
                response = requests.post(
                    transcribe_url, 
                    headers=headers, 
                    files=files, 
                    data=data,
                    timeout=120
                )
                
                logger.info(f"STT 요청 응답 상태: {response.status_code}")
                logger.debug(f"STT 요청 응답 헤더: {dict(response.headers)}")
                logger.debug(f"STT 요청 응답 내용: {response.text}")
                
                response.raise_for_status()
                
                result = response.json()
                task_id = result.get("id")
                
                if not task_id:
                    logger.error(f"STT 작업 ID를 받지 못함. 응답: {result}")
                    raise Exception("STT 작업 ID를 받지 못했습니다.")
                
                logger.info(f"STT 작업 시작됨. Task ID: {task_id}")
                
                # 2단계: 결과 폴링
                stt_result = self._poll_transcription_result(task_id, access_token)
                
                return stt_result
                
        except requests.RequestException as e:
            logger.error(f"STT 요청 실패: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"STT 실패 응답: {e.response.text}")
            raise Exception(f"STT 요청 실패: {e}")
        finally:
            # 임시 파일 정리
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                    logger.debug(f"임시 파일 삭제: {temp_file_path}")
                except Exception as e:
                    logger.warning(f"임시 파일 삭제 실패: {e}")
    
    def _poll_transcription_result(
        self, 
        task_id: str, 
        access_token: str, 
        max_attempts: int = 60
    ) -> Dict[str, Any]:
        """
        STT 결과를 폴링으로 가져오기
        
        Args:
            task_id: STT 작업 ID
            access_token: 액세스 토큰
            max_attempts: 최대 시도 횟수 (기본 60회 = 5분)
        
        Returns:
            STT 결과
        """
        result_url = f"{self.base_url}/transcribe/{task_id}"
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        logger.info(f"STT 결과 폴링 시작: {result_url}")
        
        for attempt in range(max_attempts):
            try:
                response = requests.get(result_url, headers=headers, timeout=30)
                logger.debug(
                    f"폴링 시도 {attempt + 1}: 상태 {response.status_code}"
                )
                
                response.raise_for_status()
                
                result = response.json()
                status = result.get("status")
                
                logger.debug(f"STT 상태: {status}")
                
                if status == "completed":
                    logger.info(f"STT 작업 완료. Task ID: {task_id}")
                    logger.debug(f"완료된 결과: {result}")
                    
                    # 텍스트 추출 (화자 정보 포함)
                    extracted_data = self._extract_transcript(result)
                    
                    return {
                        "status": "completed",
                        "transcript": extracted_data["transcript"],
                        "speaker_labels": extracted_data["speaker_labels"],
                        "speaker_names": extracted_data["speaker_names"],
                        "full_result": result
                    }
                elif status == "failed":
                    error_msg = result.get("message", "알 수 없는 오류")
                    logger.error(
                        f"STT 작업 실패. Task ID: {task_id}, Error: {error_msg}"
                    )
                    logger.error(f"실패 상세: {result}")
                    raise Exception(f"STT 작업 실패: {error_msg}")
                elif status in ["transcribing", "uploaded"]:
                    # 작업 진행 중, 5초 대기 후 재시도
                    logger.info(
                        f"STT 작업 진행 중... ({attempt + 1}/{max_attempts}) "
                        f"- 상태: {status}"
                    )
                    time.sleep(5)
                    continue
                else:
                    logger.warning(f"알 수 없는 STT 상태: {status}")
                    logger.debug(f"상태 상세: {result}")
                    time.sleep(5)
                    continue
                    
            except requests.RequestException as e:
                logger.error(f"STT 결과 조회 실패 (시도 {attempt + 1}): {e}")
                if hasattr(e, 'response') and e.response is not None:
                    logger.error(f"조회 실패 응답: {e.response.text}")
                if attempt == max_attempts - 1:
                    raise Exception(f"STT 결과 조회 실패: {e}")
                time.sleep(5)
        
        # 최대 시도 횟수 초과
        logger.error("STT 작업 시간 초과 (5분)")
        raise Exception("STT 작업 시간 초과 (5분)")
    
    def _extract_transcript(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """STT 결과에서 텍스트 추출 (리턴제로 응답 형식)"""
        try:
            # 리턴제로 응답 구조 확인
            utterances = result.get("results", {}).get("utterances", [])
            if not utterances:
                logger.warning("STT 결과에 발화 내용이 없음")
                return {
                    "transcript": "",
                    "speaker_labels": None,
                    "speaker_names": None
                }
            
            # 화자 분리 결과 처리
            transcript_parts = []
            speaker_labels = []
            speaker_names = {}
            
            for utterance in utterances:
                # 화자 정보 추출 (리턴제로 API 스펙에 맞춤)
                speaker = utterance.get("spk", "")  # spk 필드 사용
                text = utterance.get("msg", "")  # msg 필드 사용
                start_time = utterance.get("start_at", 0)
                end_time = utterance.get("start_at", 0) + utterance.get("duration", 0)
                
                if text:
                    # 화자 정보가 있으면 "화자: 텍스트" 형태로 포맷팅
                    if speaker is not None and speaker != "":
                        transcript_parts.append(f"speaker{speaker}: {text}")
                        speaker_labels.append({
                            "speaker": f"speaker{speaker}",
                            "text": text,
                            "start_at": start_time,
                            "end_at": end_time
                        })
                        # 화자 이름 매핑 초기화
                        speaker_key = f"speaker{speaker}"
                        if speaker_key not in speaker_names:
                            speaker_names[speaker_key] = f"화자{speaker + 1}"
                    else:
                        # 화자 정보가 없으면 텍스트만 추가
                        transcript_parts.append(text)
            
            # 결과를 줄바꿈으로 연결
            transcript = "\n".join(transcript_parts)
            
            logger.info(f"추출된 텍스트 길이: {len(transcript)} 문자")
            logger.debug(f"추출된 텍스트: {transcript[:200]}...")
            logger.info(f"화자 수: {len(speaker_names)}")
            
            return {
                "transcript": transcript,
                "speaker_labels": speaker_labels if speaker_labels else None,
                "speaker_names": speaker_names if speaker_names else None
            }
            
        except Exception as e:
            logger.error(f"텍스트 추출 실패: {e}")
            logger.error(f"결과 구조: {result}")
            return {
                "transcript": "",
                "speaker_labels": None,
                "speaker_names": None
            }


# 싱글톤 인스턴스
stt_service = None


def get_stt_service() -> ReturnZeroSTTService:
    """STT 서비스 인스턴스 반환"""
    global stt_service
    if stt_service is None:
        stt_service = ReturnZeroSTTService()
    return stt_service 