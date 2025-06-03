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
- **Next.js API Routes** - 서버리스 백엔드 API
- **Material-UI (MUI)** - React UI 컴포넌트 라이브러리
- **React Query** - 서버 상태 관리
- **Axios** - HTTP 클라이언트 (재시도 로직 포함)
- **Formidable** - 파일 업로드 처리

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
│   ├── mysql/                      # MySQL 관련 파일
│   │   └── init/                   # 초기화 스크립트
│   ├── Dockerfile                  # Dockerfile
│   ├── requirements.txt            # Python 의존성
│   ├── .env.template               # 환경변수 템플릿
│   └── .env.dev                    # 개발환경 환경변수 (.env.template 이용 로컬에서 생성 필요.)
├── admin-dashboard/                # Next.js 프론트엔드
│   ├── src/                        # 소스 코드
│   ├── public/                     # 정적 파일
│   ├── Dockerfile                  # Dockerfile
│   ├── package.json                # Node.js 의존성
│   ├── next.config.js              # Next.js 설정
│   ├── .env.template               # 환경변수 템플릿
│   └── .env.dev                    # 개발환경 환경변수 (.env.template 이용 로컬에서 생성 필요.)
├── ai-research/                    # AI 연구 및 프롬프트 관련 파일
│   ├── automization_prompt.ipynb   # 자동화 프롬프트 연구 노트북
│   └── prompt_20250603_205600.txt  # 프롬프트 백업 파일
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
  - **WSL2 환경**: http://127.0.0.1:3000 (localhost 대신 127.0.0.1 사용 필요)
- **데이터베이스**: localhost:3306

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

### Docker 관련 문제
```bash
# Docker 캐시 정리
docker system prune -a

# 컨테이너 재시작
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

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