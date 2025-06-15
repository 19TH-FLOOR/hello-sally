# Hello Sally 개발 가이드 📚

## 🎯 프로젝트 개요
- **팀**: 19층 사이드 프로젝트 팀
- **목적**: FastAPI + Next.js 풀스택 웹 애플리케이션
- **주요 기능**: 음성 텍스트 변환(STT), 파일 업로드, 관리자 대시보드

## 🔧 개발환경 설정

### 필수 도구
- Docker & Docker Compose
- Node.js 18+
- Python 3.9+

### 환경변수 설정
```bash
# API 서버
cp api-server/.env.template api-server/.env.dev
# AWS 키 값 설정 필요

# Admin 대시보드  
cp admin-dashboard/.env.template admin-dashboard/.env.dev
# 기본값으로 사용 가능
```

## 🐛 자주 발생하는 문제들

### Docker 빌드 에러
1. **public 디렉토리 없음**: `Dockerfile.prod`에서 `mkdir -p public` 추가됨
2. **포트 충돌**: 3000, 8000, 3306 포트 확인
3. **환경변수 누락**: `.env` 파일 설정 확인

### GitHub Actions 에러
1. **GHCR 로그인 실패**: `GITHUB_TOKEN` 권한 확인
2. **EC2 배포 실패**: SSH 키 및 환경변수 확인
3. **헬스체크 실패**: 서비스 시작 시간 고려

## 📝 개발 워크플로우

### 로컬 개발
```bash
# 전체 서비스 시작
docker-compose -f docker-compose.dev.yml up --build

# 개별 서비스 로그 확인
docker-compose -f docker-compose.dev.yml logs -f api-server
docker-compose -f docker-compose.dev.yml logs -f admin-dashboard
```

### 배포
1. `main` 브랜치에 푸시
2. GitHub Actions 자동 실행
3. EC2에서 서비스 재시작
4. 헬스체크 통과 확인

## 🗄️ 데이터베이스

### 마이그레이션
```bash
# 새 마이그레이션 생성
docker-compose exec api-server alembic revision --autogenerate -m "설명"

# 마이그레이션 적용
docker-compose exec api-server alembic upgrade head

# 상태 확인
docker-compose exec api-server alembic current
```

## 🔍 디버깅 팁

### 컨테이너 접근
```bash
# API 서버 컨테이너 접근
docker-compose exec api-server bash

# Admin 대시보드 컨테이너 접근
docker-compose exec admin-dashboard bash

# MySQL 접근
docker-compose exec db mysql -u sally_dev_user -p hello_sally_dev
```

### 로그 확인
```bash
# 실시간 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs api-server
```

## 📞 문제 해결 체크리스트

### 서비스가 시작되지 않을 때
- [ ] 포트 충돌 확인 (3000, 8000, 3306)
- [ ] 환경변수 파일 존재 확인
- [ ] Docker 데몬 실행 상태 확인
- [ ] 디스크 용량 확인

### 빌드가 실패할 때
- [ ] Dockerfile 문법 확인
- [ ] 의존성 파일 존재 확인 (package.json, requirements.txt)
- [ ] 빌드 컨텍스트 경로 확인

### 배포가 실패할 때
- [ ] GitHub Secrets 설정 확인
- [ ] EC2 인스턴스 상태 확인
- [ ] AWS 권한 설정 확인
- [ ] 네트워크 연결 상태 확인 