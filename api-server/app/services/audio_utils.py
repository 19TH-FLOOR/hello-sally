import tempfile
import os
import subprocess
import json
from typing import Optional


def get_audio_duration(file_obj, content_type: str) -> Optional[int]:
    """
    ffprobe를 사용하여 오디오 파일의 재생 시간을 초 단위로 반환합니다.
    
    Args:
        file_obj: 파일 객체
        content_type: MIME 타입
        
    Returns:
        재생 시간 (초), 실패 시 None
    """
    print(f"🎵 ffprobe로 오디오 길이 추출 시작 - Content-Type: {content_type}")
    
    try:
        # 파일의 현재 위치 저장
        current_pos = file_obj.tell()
        file_obj.seek(0)
        
        # 파일 크기 확인
        file_obj.seek(0, 2)
        file_size = file_obj.tell()
        file_obj.seek(0)
        print(f"📁 파일 크기: {file_size} bytes")
        
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            file_obj.seek(0)
            data = file_obj.read()
            temp_file.write(data)
            temp_file_path = temp_file.name
            print(f"📂 임시 파일 생성: {temp_file_path}")
        
        try:
            # ffprobe로 오디오 길이 추출
            duration = _get_duration_with_ffprobe(temp_file_path)
            return duration
        finally:
            # 임시 파일 삭제
            try:
                os.unlink(temp_file_path)
                print("🗑️ 임시 파일 삭제됨")
            except OSError as e:
                print(f"⚠️ 임시 파일 삭제 실패: {e}")
            
    except Exception as e:
        print(f"❌ 오디오 길이 추출 실패: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        # 파일 위치 복원
        file_obj.seek(current_pos)


def _get_duration_with_ffprobe(file_path: str) -> Optional[int]:
    """
    ffprobe를 사용하여 오디오 파일의 길이를 추출합니다.
    """
    try:
        print("🔍 ffprobe로 길이 추출 시도...")
        cmd = [
            'ffprobe', 
            '-v', 'quiet', 
            '-print_format', 'json', 
            '-show_format', 
            file_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            data = json.loads(result.stdout)
            if 'format' in data and 'duration' in data['format']:
                duration = float(data['format']['duration'])
                print(f"✅ ffprobe로 추출된 길이: {duration}초")
                return int(round(duration))
        
        print(f"❌ ffprobe 실패: {result.stderr}")
        return None
        
    except subprocess.TimeoutExpired:
        print("❌ ffprobe 타임아웃")
        return None
    except Exception as e:
        print(f"❌ ffprobe 에러: {e}")
        return None


def format_duration(seconds: int) -> str:
    """
    초를 시간/분/초 형식으로 포맷팅합니다. (0인 단위는 표시하지 않음)
    
    Args:
        seconds: 초 단위 시간
        
    Returns:
        포맷팅된 시간 문자열
    """
    if seconds is None or seconds < 0:
        return "0초"
    
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    
    parts = []
    
    if hours > 0:
        parts.append(f"{hours}시간")
    if minutes > 0:
        parts.append(f"{minutes}분")
    if secs > 0 or len(parts) == 0:  # 초가 0이어도 다른 단위가 없으면 "0초" 표시
        parts.append(f"{secs}초")
    
    return " ".join(parts) 