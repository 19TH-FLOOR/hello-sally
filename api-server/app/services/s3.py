import boto3
import os
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException
import urllib.parse
from botocore.config import Config

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-northeast-2")
AWS_S3_BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")

# S3 클라이언트 설정 개선 (리전별 엔드포인트 사용)
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION,
    config=Config(
        signature_version='s3v4',
        region_name=AWS_REGION,
        s3={'addressing_style': 'virtual'},
        retries={'max_attempts': 3}
    )
)

def extract_s3_key_from_url(s3_url: str) -> str:
    """
    S3 URL에서 파일 키(파일명)를 추출합니다.
    예: https://bucket.s3.region.amazonaws.com/filename.mp3 -> filename.mp3
    """
    try:
        # URL에서 경로 부분 추출
        parsed_url = urllib.parse.urlparse(s3_url)
        # 맨 앞의 '/' 제거
        key = parsed_url.path.lstrip('/')
        # URL 디코딩 (특수문자 처리)
        key = urllib.parse.unquote(key)
        return key
    except Exception as e:
        raise ValueError(f"S3 URL 파싱 실패: {e}")

def generate_presigned_url_for_download(s3_url: str, expires_in: int = 3600) -> str:
    """
    기존 S3 URL을 기반으로 다운로드용 Pre-signed URL을 생성합니다.
    
    Args:
        s3_url: 기존 S3 URL
        expires_in: URL 유효 시간 (초, 기본값: 1시간)
    
    Returns:
        Pre-signed URL
    """
    try:
        # S3 URL에서 파일 키 추출
        key = extract_s3_key_from_url(s3_url)
        
        # 파일 존재 여부 확인
        try:
            s3_client.head_object(Bucket=AWS_S3_BUCKET_NAME, Key=key)
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                raise HTTPException(
                    status_code=404, 
                    detail=f"S3 파일을 찾을 수 없음: {key}"
                )
            else:
                raise HTTPException(
                    status_code=403, 
                    detail=f"S3 파일 접근 권한 없음: {error_code}"
                )
        
        # Pre-signed URL 생성
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': AWS_S3_BUCKET_NAME, 
                'Key': key
            },
            ExpiresIn=expires_in
        )
        
        return presigned_url
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Pre-signed URL 생성 실패: {str(e)}"
        )

def upload_file_to_s3(file_obj, filename, content_type):
    try:
        # 파일 업로드
        s3_client.upload_fileobj(
            file_obj,
            AWS_S3_BUCKET_NAME,
            filename,
            ExtraArgs={"ContentType": content_type}
        )
        
        # 올바른 S3 URL 조회 (HeadObject를 통해 실제 URL 확인)
        s3_client.head_object(Bucket=AWS_S3_BUCKET_NAME, Key=filename)
        
        # 실제 URL 생성
        direct_url = (
            f"https://{AWS_S3_BUCKET_NAME}.s3.{AWS_REGION}"
            f".amazonaws.com/{filename}"
        )
        
        # 사전 서명된 URL 생성 (1시간 유효)
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': AWS_S3_BUCKET_NAME, 'Key': filename},
            ExpiresIn=3600  # 1시간
        )
        
        return {
            "direct_url": direct_url,
            "presigned_url": presigned_url
        }
    except (BotoCoreError, ClientError) as e:
        raise HTTPException(
            status_code=500, 
            detail=f"S3 업로드 실패: {str(e)}"
        )

def delete_file_from_s3(filename):
    """
    S3에서 파일을 삭제합니다.
    """
    try:
        # S3에서 파일 삭제
        s3_client.delete_object(
            Bucket=AWS_S3_BUCKET_NAME,
            Key=filename
        )
        return True
    except (BotoCoreError, ClientError) as e:
        raise HTTPException(
            status_code=500, 
            detail=f"S3 파일 삭제 실패: {str(e)}"
        ) 