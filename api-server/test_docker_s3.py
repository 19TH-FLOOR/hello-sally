import boto3
import os
import requests

# 환경변수 확인
print('AWS_ACCESS_KEY_ID:', os.getenv('AWS_ACCESS_KEY_ID'))
print('AWS_REGION:', os.getenv('AWS_REGION'))
print('AWS_S3_BUCKET_NAME:', os.getenv('AWS_S3_BUCKET_NAME'))

# S3 클라이언트 생성
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION')
)

# Pre-signed URL 생성
try:
    presigned_url = s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': 'hellosally-dev', 'Key': '16-37-59_[cut_610sec].mp3'},
        ExpiresIn=3600
    )
    print('Pre-signed URL 생성 성공!')
    print('URL:', presigned_url[:100] + '...')
    
    # 파일 다운로드 테스트
    response = requests.head(presigned_url)
    print('HTTP Status:', response.status_code)
    print('Content-Type:', response.headers.get('Content-Type'))
    print('Content-Length:', response.headers.get('Content-Length'))
    
    if response.status_code == 200:
        print('✅ S3 파일 접근 성공!')
    else:
        print('❌ S3 파일 접근 실패')
        print('Response headers:', dict(response.headers))
    
except Exception as e:
    print('오류:', str(e)) 