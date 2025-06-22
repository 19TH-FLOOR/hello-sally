# Hello Sally 👨‍👩‍👧‍👦 - 맞춤형 양육 보고서 생성 시스템

**19층 사이드 프로젝트 팀**에서 개발한 아이와 부모의 대화 패턴을 분석하여 맞춤형 양육 보고서를 생성하는 AI 기반 플랫폼입니다.

## 🎯 프로젝트 개요

Hello Sally는 부모와 아이의 대화 음성을 분석하여 양육 패턴을 파악하고, AI 기반 맞춤형 보고서를 제공하는 혁신적인 서비스입니다.

### 🌟 주요 기능

#### 📊 **보고서 관리 시스템**
- ✅ 보고서 생성, 수정, 삭제, 발행 관리
- ✅ 부모/아이 정보 관리
- ✅ 보고서 상태별 관리 (작성중, 분석중, 완료, 발행됨)
- ✅ 한국 시간(KST) 기반 일시 표시

#### 🎵 **음성 파일 처리**
- ✅ 다중 음성 파일 업로드 및 관리
- ✅ 파일명 사용자 정의 (display_name)
- ✅ STT(Speech-to-Text) 자동 처리
- ✅ 실시간 STT 진행 상태 모니터링
- ✅ STT 결과 수동 편집 기능

#### 🗣️ **화자 분리 및 라벨링**
- ✅ AI 기반 화자 분리 (Speaker Diarization)
- ✅ 화자별 라벨 커스터마이징 (예: "엄마", "아이")
- ✅ 실시간 라벨링 미리보기
- ✅ 화자명 표시/숨김 토글 기능

#### 🔧 **STT 설정 관리**
- ✅ 모델 타입 선택 (sommers 등)
- ✅ 언어 설정 (한국어, 영어 등)
- ✅ 화자 분리 옵션
- ✅ 비속어 필터링
- ✅ 문단 분할 설정
- ✅ 도메인별 최적화 (일반, 의료, 법률 등)

#### 🤖 **AI 프롬프트 관리**
- ✅ 분석용 AI 프롬프트 템플릿 관리
- ✅ 프롬프트 생성, 수정, 삭제
- ✅ 다양한 분석 유형별 프롬프트 설정

#### 🎨 **사용자 경험 (UX)**
- ✅ 직관적인 Material-UI 기반 인터페이스
- ✅ 실시간 토스트 알림 시스템
- ✅ 반응형 디자인
- ✅ 로딩 상태 및 진행률 표시

## 🚀 기술 스택

### 백엔드 (API Server)
- **FastAPI** - 고성능 Python 웹 프레임워크
- **SQLAlchemy** - Python ORM
- **Alembic** - 데이터베이스 마이그레이션 도구
- **MySQL 8.0** - 관계형 데이터베이스
- **AWS S3** - 파일 저장소
- **STT API** - 음성 텍스트 변환 (Clova Speech, OpenAI Whisper)
- **Pydantic** - 데이터 검증 및 직렬화

### 프론트엔드 (Admin Dashboard)  
- **Next.js 13** - React 기반 풀스택 프레임워크
- **Material-UI (MUI)** - React UI 컴포넌트 라이브러리
- **React Hot Toast** - 토스트 알림 시스템
- **Axios** - HTTP 클라이언트
- **React Hooks** - 상태 관리

### 인프라 & DevOps
- **Docker & Docker Compose** - 컨테이너화
- **MySQL 8.0** - 데이터베이스
- **AWS RDS** - 운영환경 데이터베이스
- **환경별 설정 관리** - 개발/스테이징/운영

## 📁 프로젝트 구조

```
hello-sally/
├── 🗂️ api-server/                  # FastAPI 백엔드 서버
│   ├── app/
│   │   ├── main.py                 # FastAPI 진입점
│   │   ├── db/
│   │   │   ├── models.py           # SQLAlchemy 모델 (Report, AudioFile, AIPrompt 등)
│   │   │   └── session.py          # DB 연결 관리
│   │   ├── routers/                # API 라우터
│   │   │   ├── audio_files.py      # 음성 파일 관리 API
│   │   │   ├── reports.py          # 보고서 관리 API
│   │   │   ├── templates.py        # AI 프롬프트 관리 API
│   │   │   └── auth.py             # 인증 API
│   │   ├── schemas/                # Pydantic 스키마
│   │   │   ├── audio_files.py      # 음성 파일 스키마
│   │   │   ├── reports.py          # 보고서 스키마
│   │   │   └── templates.py        # AI 프롬프트 스키마
│   │   └── services/               # 외부 서비스 연동
│   │       ├── s3.py               # AWS S3 파일 업로드
│   │       ├── stt.py              # STT API 연동
│   │       └── ai_analysis.py      # AI 분석 서비스
│   ├── alembic/                    # 데이터베이스 마이그레이션
│   │   └── versions/               # 마이그레이션 버전 파일들
│   │       ├── 001_initial_migration.py
│   │       ├── 002_add_stt_fields.py
│   │       ├── ...                 # 총 10개의 마이그레이션
│   │       └── e52d01358bce_rename_report_template_to_ai_prompt_for_*.py
│   ├── requirements.txt            # Python 의존성
│   └── Dockerfile                  # Docker 이미지 설정
├── 🖥️ admin-dashboard/             # Next.js 프론트엔드
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.js            # 홈페이지 (대시보드)
│   │   │   ├── reports/            # 보고서 관리
│   │   │   │   ├── index.js        # 보고서 목록
│   │   │   │   └── [id].js         # 보고서 상세/편집
│   │   │   ├── ai-prompts/         # AI 프롬프트 관리
│   │   │   │   └── index.js        # 프롬프트 목록/편집
│   │   │   ├── transcripts/        # STT 결과 관리
│   │   │   │   └── [id].js         # STT 결과 상세
│   │   │   └── _app.js             # Next.js 앱 설정 (토스트 시스템 포함)
│   │   ├── components/
│   │   │   └── Layout.js           # 공통 레이아웃 (사이드바, 네비게이션)
│   │   ├── utils/
│   │   │   ├── api.js              # API 호출 유틸리티
│   │   │   └── dateUtils.js        # 한국 시간 변환 유틸리티
│   │   └── styles/
│   │       └── globals.css         # 글로벌 스타일
│   ├── package.json                # Node.js 의존성
│   └── Dockerfile                  # Docker 이미지 설정
├── 🧠 ai-research/                 # AI 연구 자료
│   ├── automization_prompt.ipynb   # 자동화 프롬프트 연구
│   └── prompt_*.txt                # 프롬프트 백업 파일들
├── 🐳 docker-compose.dev.yml       # 개발환경 설정 (로컬 MySQL)
├── 🐳 docker-compose.prod.yml      # 운영환경 설정 (AWS RDS)
├── 📋 DEVELOPMENT.md               # 개발 가이드
└── 📖 README.md                    # 프로젝트 문서 (이 파일)
```

## 🛠️ 빠른 시작 (개발환경)

### 1️⃣ 저장소 클론
```bash
git clone <repository-url>
cd hello-sally
```

### 2️⃣ 환경변수 설정
```bash
# API 서버 환경변수 설정
cp api-server/.env.template api-server/.env.dev
# api-server/.env.dev 파일을 편집하여 실제 값으로 변경:
# - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
# - STT API 키
# - 기타 필요한 설정들

# Admin 대시보드 환경변수 설정  
cp admin-dashboard/.env.template admin-dashboard/.env.dev
# 기본값으로 바로 사용 가능 (필요시 API URL 변경)
```

### 3️⃣ 개발환경 실행
```bash
# 전체 서비스 빌드 및 실행
docker-compose -f docker-compose.dev.yml up --build

# 백그라운드 실행
docker-compose -f docker-compose.dev.yml up -d
```

### 4️⃣ 서비스 접근
- **🌐 Admin 대시보드**: http://localhost:3000
- **🔧 API 서버**: http://localhost:8000
- **📚 API 문서**: http://localhost:8000/docs (Swagger UI)
- **🗄️ 데이터베이스**: localhost:3306

> **💡 WSL2 사용자**: localhost 대신 127.0.0.1 사용 권장

## 🎮 사용 방법

### 📝 보고서 생성 워크플로우

1. **보고서 생성**
   - 대시보드에서 "새 보고서" 클릭
   - 제목, 부모 이름, 아이 이름 입력

2. **음성 파일 업로드**
   - 보고서 상세 페이지에서 "파일 업로드"
   - 파일명 커스터마이징 가능
   - 여러 파일 업로드 지원

3. **STT 설정 및 처리**
   - 각 파일별 STT 설정 (모델, 언어, 화자 분리 등)
   - STT 처리 시작
   - 실시간 진행 상태 모니터링

4. **화자 라벨링**
   - STT 완료 후 화자 라벨링 진행
   - "Speaker 1" → "엄마", "Speaker 2" → "아이" 등으로 변경
   - 실시간 미리보기 제공

5. **STT 결과 편집**
   - 필요시 STT 결과 수동 편집
   - 화자명 표시/숨김 토글 기능
   - 편집 내용 저장

6. **AI 분석** (개발 예정)
   - AI 프롬프트를 사용한 대화 패턴 분석
   - 맞춤형 양육 보고서 생성

7. **보고서 발행**  (개발 예정)
   - 최종 검토 후 보고서 발행
   - PDF 생성 및 다운로드

## 🐳 Docker 명령어 모음

### 개발환경 관리
```bash
# 전체 서비스 시작
docker-compose -f docker-compose.dev.yml up -d

# 빌드와 함께 시작
docker-compose -f docker-compose.dev.yml up --build

# 특정 서비스만 재시작
docker-compose -f docker-compose.dev.yml restart api-server

# 서비스 중지
docker-compose -f docker-compose.dev.yml down

# 볼륨 포함 완전 삭제 (데이터베이스 초기화)
docker-compose -f docker-compose.dev.yml down -v
```

### 로그 및 디버깅
```bash
# 실시간 로그 확인
docker-compose -f docker-compose.dev.yml logs -f api-server
docker-compose -f docker-compose.dev.yml logs -f admin-dashboard

# 컨테이너 내부 접근
docker-compose -f docker-compose.dev.yml exec api-server bash
docker-compose -f docker-compose.dev.yml exec admin-dashboard bash

# 데이터베이스 접근
docker-compose -f docker-compose.dev.yml exec db mysql -u sally_dev_user -p hello_sally_dev
```

## 🗃️ 데이터베이스 마이그레이션 (Alembic)

### 📊 마이그레이션 시스템 특징
- ✅ **환경변수 기반** - 개발/운영 환경 자동 감지
- ✅ **자동 실행** - 컨테이너 시작 시 자동 마이그레이션
- ✅ **버전 관리** - Git과 연동된 체계적 관리
- ✅ **읽기 쉬운 ID** - `--rev-id` 옵션으로 의미있는 ID 사용

### 🔄 마이그레이션 명령어

#### **마이그레이션 상태 확인**
```bash
# 현재 적용된 마이그레이션 확인
docker-compose -f docker-compose.dev.yml exec api-server alembic current

# 마이그레이션 히스토리 (읽기 쉬운 형태)
docker-compose -f docker-compose.dev.yml exec api-server alembic history --indicate-current

# 자세한 히스토리
docker-compose -f docker-compose.dev.yml exec api-server alembic history --verbose
```

#### **새 마이그레이션 생성**
```bash
# 자동 생성 (모델 변경 감지)
docker-compose -f docker-compose.dev.yml exec api-server alembic revision --autogenerate -m "add new field"

# 읽기 쉬운 ID로 생성 (권장)
docker-compose -f docker-compose.dev.yml exec api-server alembic revision --rev-id "20250621_001" --autogenerate -m "add user profile fields"

# 수동 마이그레이션 (복잡한 데이터 변경)
docker-compose -f docker-compose.dev.yml exec api-server alembic revision --rev-id "data_migration_001" -m "migrate user data format"
```

#### **마이그레이션 적용**
```bash
# 최신 버전으로 업그레이드
docker-compose -f docker-compose.dev.yml exec api-server alembic upgrade head

# 특정 버전으로 업그레이드
docker-compose -f docker-compose.dev.yml exec api-server alembic upgrade 20250621_001
```


## 🚀 운영환경 배포
Github Action을 사용합니다.

## 🚨 문제 해결

### Docker 관련 문제
```bash
# Docker 캐시 및 이미지 정리
docker system prune -a

# 특정 서비스 재빌드
docker-compose -f docker-compose.dev.yml up --build api-server

# 네트워크 문제 해결
docker-compose -f docker-compose.dev.yml down
docker network prune
docker-compose -f docker-compose.dev.yml up
```

### 데이터베이스 관련 문제
```bash
# 데이터베이스 완전 초기화 (개발환경만)
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build

# 마이그레이션 충돌 해결
docker-compose -f docker-compose.dev.yml exec api-server alembic merge heads

# 데이터베이스 연결 확인
docker-compose -f docker-compose.dev.yml exec api-server python -c "from app.db.session import engine; print(engine.execute('SELECT 1').fetchone())"
```

### 프론트엔드 관련 문제
```bash
# Next.js 캐시 정리
docker-compose -f docker-compose.dev.yml exec admin-dashboard rm -rf .next

# 의존성 재설치
docker-compose -f docker-compose.dev.yml exec admin-dashboard npm install

# 빌드 문제 해결
docker-compose -f docker-compose.dev.yml up --build admin-dashboard
```


## 🤝 기여하기

### 개발 환경 설정
1. 이 저장소를 포크합니다
2. 개발 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

### 코딩 컨벤션
- **Python**: PEP 8 준수, Black 포매터 사용
- **JavaScript**: ESLint + Prettier 사용
- **커밋 메시지**: Conventional Commits 형식
- **브랜치명**: `feature/`, `bugfix/`, `hotfix/` 접두사 사용

## 📄 저작권 및 라이선스

**이 프로젝트는 19층 사이드 프로젝트 팀의 사유재산입니다.**

- 📝 모든 소스코드와 관련 자료에 대한 저작권은 19층 팀에 있습니다
- 🚫 팀 구성원이 아닌 외부인의 무단 사용, 복제, 배포를 금지합니다
- 💼 상업적 이용은 팀 내부 승인이 필요합니다

---

## 📞 연락처

**19층 사이드 프로젝트 팀**

프로젝트에 대한 질문이나 제안사항이 있으시면 팀 내부 채널을 통해 연락해주세요!

📧 **이메일**: hellosally.contact@gmail.com  
🏢 **팀**: 19층 사이드 프로젝트 팀  
🌐 **프로젝트**: Hello Sally - 맞춤형 양육 보고서 생성 시스템

---

<div align="center">

**Made with ❤️ by 19층 Team**

*아이와 부모의 소통을 더 깊이 이해하고, 더 나은 양육을 위한 인사이트를 제공합니다.*

</div>