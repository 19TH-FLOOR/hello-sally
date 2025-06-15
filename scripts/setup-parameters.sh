#!/bin/bash

# AWS Parameter Store에 Hello Sally 프로덕션 환경변수 설정

REGION="ap-northeast-2"
PARAM_PATH="/hello-sally/prod"

echo "🔧 Setting up AWS Parameter Store parameters for Hello Sally..."

# 환경변수 배열 정의
declare -A PARAMS=(
    # 환경 설정
    ["ENV"]="production"
    ["DEBUG"]="false"
    
    # 데이터베이스 설정 (RDS)
    ["DB_HOST"]="hellosally-mysql.cbgoi6k0kq82.ap-northeast-2.rds.amazonaws.com"
    ["DB_PORT"]="3306"
    ["DB_NAME"]="hello_sally_prod"
    ["DB_USER"]="admin"
    ["DB_PASSWORD"]="your_db_password_here"  # 실제 비밀번호로 변경 필요

    # STT 설정
    ["RTZR_CLIENT_ID"]="your_rtzr_client_id_here"
    ["RTZR_CLIENT_SECRET"]="your_rtzr_client_secret_here"
    
    # AWS 설정
    ["AWS_ACCESS_KEY_ID"]="your_access_key_here"        # 실제 키로 변경 필요
    ["AWS_SECRET_ACCESS_KEY"]="your_secret_key_here"    # 실제 키로 변경 필요
    ["AWS_REGION"]="ap-northeast-2"
    ["AWS_S3_BUCKET_NAME"]="hello-sally"
    
    # 서버 설정
    ["EC2_IP"]="your-ec2-ip"                # EC2 공용 IP (실제 IP로 변경 필요)
    ["API_SERVER_PORT"]="8000"              # API 서버 포트
    ["ADMIN_PORT"]="3000"                   # Admin Dashboard 포트
    
    # Admin Dashboard 설정
    ["NODE_ENV"]="production"
)

# Parameter Store에 각 환경변수 설정
for key in "${!PARAMS[@]}"; do
    value="${PARAMS[$key]}"
    param_name="$PARAM_PATH/$key"
    
    echo "📝 Setting parameter: $key"
    aws ssm put-parameter \
        --region $REGION \
        --name "$param_name" \
        --value "$value" \
        --type "SecureString" \
        --overwrite \
        --description "Hello Sally production environment variable: $key"
done

echo "✅ All parameters have been set in Parameter Store!"
echo "🔍 To verify, run: aws ssm get-parameters-by-path --path '$PARAM_PATH' --recursive --region $REGION"

echo "⚠️  Don't forget to update these placeholder values:"
echo "   - DB_PASSWORD: RDS 데이터베이스 비밀번호"
echo "   - AWS_ACCESS_KEY_ID: IAM 사용자 액세스 키"
echo "   - AWS_SECRET_ACCESS_KEY: IAM 사용자 시크릿 키"  
echo "   - EC2_IP: EC2 공용 IP 주소 (예: 13.125.123.45)"
echo "   - RTZR_CLIENT_ID: 리턴제로에서 발급받은 Client ID"
echo "   - RTZR_CLIENT_SECRET: 리턴제로에서 발급받은 Client Secret"

echo "리턴제로 STT API 키 발급 방법:"
echo "1. https://developers.rtzr.ai/ 접속"
echo "2. 회원가입 후 콘솔 입장"
echo "3. 애플리케이션 추가 후 SECRET 정보 발급" 