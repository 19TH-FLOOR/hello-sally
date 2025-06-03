# Hello Sally ❤️ 모노레포

**19층 사이드 프로젝트 팀**에서 개발한 FastAPI 백엔드와 Next.js 프론트엔드로 구성된 풀스택 웹 애플리케이션입니다.

## 🚀 기술 스택

### 백엔드 (API Server)
- **FastAPI** - 고성능 Python 웹 프레임워크
- **SQLAlchemy** - Python ORM
- **MySQL** - 관계형 데이터베이스
- **AWS S3** - 파일 저장소
- **STT API** - 음성 텍스트 변환

### 프론트엔드 (Admin Dashboard)  
- **Next.js 13** - React 기반 풀스택 프레임워크
- **Material-UI (MUI)** - React UI 컴포넌트 라이브러리
- **React Query** - 서버 상태 관리
- **Axios** - HTTP 클라이언트

### 인프라
- **Docker & Docker Compose** - 컨테이너화 및 오케스트레이션
- **MySQL 8.0** - 데이터베이스

## 📁 프로젝트 구조

```
hello-sally/
├── api-server/                     # FastAPI 백엔드 서버
│   ├── app/
│   │   ├── main.py                 # FastAPI 진입점
│   │   ├── core/                   # 환경설정, 보안 관련 유틸
│   │   ├── db/                     # DB 연결 및 모델
│   │   ├── routers/                # API 라우터
│   │   ├── schemas/                # Pydantic 스키마
│   │   └── services/               # S3, STT API 연동
│   ├── Dockerfile                  # Dockerfile
│   ├── requirements.txt            # Python 의존성
│   ├── .env.template               # 환경변수 템플릿
│   └── .env.dev                    # 개발환경 환경변수 (로컬에서 생성)
├── admin-dashboard/                # Next.js 프론트엔드
│   ├── src/                        # 소스 코드
│   ├── public/                     # 정적 파일
│   ├── Dockerfile                  # Dockerfile
│   ├── package.json                # Node.js 의존성
│   ├── next.config.js              # Next.js 설정
│   ├── .env.template               # 환경변수 템플릿
│   └── .env.dev                    # 개발환경 환경변수 (로컬에서 생성)
├── mysql/                          # MySQL 관련 파일
│   └── init/                       # 초기화 스크립트
├── docker-compose.dev.yml          # 개발환경 Docker Compose
├── .gitignore                      # Git 무시 파일 목록
└── README.md                       # 프로젝트 문서
```

## 🛠️ 빠른 시작 (개발환경)

### 1️⃣ 환경변수 설정
```bash
# API 서버 환경변수 복사 및 설정
cp api-server/.env.template api-server/.env.dev
# api-server/.env.dev 파일을 편집하여 실제 AWS 키 값으로 변경

# Admin 대시보드 환경변수 복사 및 설정  
cp admin-dashboard/.env.template admin-dashboard/.env.dev
# admin-dashboard/.env.dev 파일은 기본값으로 바로 사용 가능
```

### 2️⃣ 개발환경 실행
```bash
# 개발환경으로 전체 서비스 실행
docker-compose -f docker-compose.dev.yml up --build
```

### 3️⃣ 서비스 접근
- **API 서버**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs (Swagger UI)
- **Admin 대시보드**: http://localhost:3000
- **데이터베이스**: localhost:3306

## 📝 환경변수 설정

### API 서버 환경변수 (`api-server/.env.dev`)
```env
# 실행 환경
ENV=development

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USER=sally_user
DB_PASSWORD=sally_password
DB_NAME=hello_sally

# AWS 설정
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

### Admin 대시보드 환경변수 (`admin-dashboard/.env.dev`)
```env
# 실행 환경
NODE_ENV=development

# API 서버 URL (내부 프록시용)
API_URL=http://api-server:8000
```

## 🔧 개별 서비스 실행 (로컬 개발)

### API 서버만 실행
```bash
cd api-server
python -m venv venv

# Linux/macOS/WSL
source venv/bin/activate

# Windows CMD/PowerShell
# venv\Scripts\activate

pip install -r requirements.txt

# 환경변수 로드하여 실행
export $(cat .env.dev | xargs)  # Linux/macOS/WSL
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Admin 대시보드만 실행
```bash
cd admin-dashboard
npm install

# 개발 모드로 실행
npm run dev
```

## 🐳 Docker 명령어 모음

```bash
# 전체 서비스 시작
docker-compose -f docker-compose.dev.yml up -d

# 빌드와 함께 시작
docker-compose -f docker-compose.dev.yml up --build

# 서비스 중지
docker-compose -f docker-compose.dev.yml down

# 볼륨 포함 완전 삭제
docker-compose -f docker-compose.dev.yml down -v

# 로그 확인
docker-compose -f docker-compose.dev.yml logs -f api-server
docker-compose -f docker-compose.dev.yml logs -f admin-dashboard

# 컨테이너 내부 접근
docker-compose -f docker-compose.dev.yml exec api-server bash
docker-compose -f docker-compose.dev.yml exec admin-dashboard bash
docker-compose -f docker-compose.dev.yml exec db mysql -u sally_dev_user -p hello_sally_dev
```

## 🚨 문제 해결

### 환경변수 관련 문제
```bash
# 환경변수 파일 확인
ls -la api-server/.env*
ls -la admin-dashboard/.env*

# 환경변수 내용 확인
cat api-server/.env.dev
cat admin-dashboard/.env.dev
```

### 포트 충돌
```bash
# Linux/macOS/WSL
lsof -i :8000
lsof -i :3000
lsof -i :3306

# Windows
netstat -ano | findstr :8000
netstat -ano | findstr :3000
netstat -ano | findstr :3306

# 프로세스 종료
kill -9 <PID>  # Linux/macOS/WSL
taskkill /PID <PID> /F  # Windows
```

### Docker 관련 문제
```bash
# Docker 캐시 정리
docker system prune -a

# 컨테이너 재시작
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

### WSL 관련 문제

1. **Docker Desktop WSL 통합 확인**
   - Docker Desktop → Settings → Resources → WSL Integration
   - Ubuntu 또는 사용 중인 WSL 배포판 활성화

2. **파일 시스템 성능 최적화**
   ```bash
   # WSL 파일 시스템에서 작업 (더 빠름)
   cd /home/username/projects/hello-sally
   
   # Windows 파일 시스템 피하기 (/mnt/c/는 느림)
   ```

3. **권한 문제 해결**
   ```bash
   sudo chown -R $USER:$USER .
   chmod +x api-server/app/main.py
   ```

4. **줄바꿈 문제 해결**
   ```bash
   # Windows에서 작성된 파일의 줄바꿈 변환
   find . -type f \( -name "*.py" -o -name "*.sh" -o -name "*.yml" \) -exec dos2unix {} \;
   ```

## 👥 19층 팀 개발 가이드

### 팀 내 개발 워크플로우
1. **브랜치 전략**
   ```bash
   # 새 기능 개발 시
   git checkout -b feature/기능명
   
   # 작업 완료 후
   git add .
   git commit -m "feat: 새로운 기능 추가"
   git push origin feature/기능명
   ```

2. **개발환경 설정**
   - 환경변수 파일은 각자 로컬에서 관리 (`.env.dev`)
   - 운영 배포는 별도 CI/CD 파이프라인에서 처리

3. **코드 리뷰 프로세스**
   - 팀 내 코드 리뷰 후 main 브랜치 병합
   - 중요한 변경사항은 팀원들과 사전 논의

4. **이슈 관리**
   - 버그나 개선사항은 팀 내부 이슈 트래킹 시스템 활용
   - 우선순위에 따른 작업 분배

## 📄 저작권 및 라이선스

**이 프로젝트는 19층 사이드 프로젝트 팀의 사유재산입니다.**

- 모든 소스코드와 관련 자료에 대한 저작권은 19층 팀에 있습니다.
- 팀 구성원이 아닌 외부인의 무단 사용, 복제, 배포를 금지합니다.
- 상업적 이용은 팀 내부 승인이 필요합니다.

## 📧 hellosally.contact@gmail.com

**19층 사이드 프로젝트 팀**

프로젝트에 대한 질문이나 제안사항이 있으시면 팀 내부 채널을 통해 연락해주세요!

---
*Made with ❤️ by 19층 Team*