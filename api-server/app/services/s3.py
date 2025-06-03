import boto3
import os
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-2")
AWS_S3_BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")

s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION,
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
        response = s3_client.head_object(Bucket=AWS_S3_BUCKET_NAME, Key=filename)
        
        # 실제 URL 생성 - ap-southeast-2로 수정
        direct_url = f"https://{AWS_S3_BUCKET_NAME}.s3.ap-southeast-2.amazonaws.com/{filename}"
        
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
        raise HTTPException(status_code=500, detail=f"S3 업로드 실패: {str(e)}")

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
        raise HTTPException(status_code=500, detail=f"S3 파일 삭제 실패: {str(e)}") 