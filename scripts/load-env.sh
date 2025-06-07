#!/bin/bash

# AWS Parameter Store에서 환경변수 로드
echo "🔄 Loading environment variables from AWS Parameter Store..."

REGION="ap-northeast-2"
PARAM_PATH="/hello-sally/prod"

# Parameter Store에서 모든 환경변수 가져오기
aws ssm get-parameters-by-path \
    --region $REGION \
    --path "$PARAM_PATH" \
    --recursive \
    --with-decryption \
    --query "Parameters[*].[Name,Value]" \
    --output text | while read name value; do
    
    # 파라미터 이름에서 경로 제거하고 환경변수 이름만 추출
    env_name=$(basename "$name")
    echo "export $env_name='$value'"
done > /tmp/prod-env

echo "✅ Environment variables loaded to /tmp/prod-env"
echo "💡 To use: source /tmp/prod-env"

# 환경변수 미리보기 (값은 숨김)
echo "📋 Available environment variables:"
aws ssm get-parameters-by-path \
    --region $REGION \
    --path "$PARAM_PATH" \
    --query "Parameters[*].Name" \
    --output text | sed "s|$PARAM_PATH/||g" | tr '\t' '\n' 