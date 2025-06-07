# Hello Sally ❤️ 모노레포

**19층 사이드 프로젝트 팀**에서 개발한 FastAPI 백엔드와 Next.js 프론트엔드로 구성된 풀스택 웹 애플리케이션입니다.

## 🚀 기술 스택

### 백엔드 (API Server)
- **FastAPI** - 고성능 Python 웹 프레임워크
- **SQLAlchemy** - Python ORM
- **Alembic** - 데이터베이스 마이그레이션 도구
- **MySQL** - 관계형 데이터베이스 (개발: Docker, 운영: AWS RDS)
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
│   ├── alembic/                    # 데이터베이스 마이그레이션
│   │   ├── versions/               # 마이그레이션 버전 파일들
│   │   ├── env.py                  # 환경 설정 (환경변수 연동)
│   │   └── script.py.mako          # 마이그레이션 템플릿
│   ├── mysql/                      # MySQL 관련 파일
│   │   └── init/                   # 첫 설치용 초기화 스크립트
│   ├── alembic.ini                 # Alembic 설정 파일
│   ├── migrate.sh                  # DB 연결 대기 + 마이그레이션 실행 스크립트
│   ├── Dockerfile                  # Dockerfile
│   ├── requirements.txt            # Python 의존성 (Alembic 포함)
│   ├── .env.template               # 환경변수 템플릿
├── admin-dashboard/                # Next.js 프론트엔드
│   ├── src/                        # 소스 코드
│   ├── public/                     # 정적 파일
│   ├── Dockerfile                  # Dockerfile
│   ├── package.json                # Node.js 의존성
│   ├── next.config.js              # Next.js 설정
│   ├── .env.template               # 환경변수 템플릿
├── ai-research/                    # AI 연구 및 프롬프트 관련 파일
│   ├── automization_prompt.ipynb   # 자동화 프롬프트 연구 노트북
│   └── prompt_20250603_205600.txt  # 프롬프트 백업 파일
├── docker-compose.dev.yml          # 개발환경 Docker Compose (MySQL)
├── docker-compose.prod.yml         # 운영환경 Docker Compose (AWS RDS)
├── .gitignore                      # Git 무시 파일 목록
└── README.md                       # 프로젝트 문서 (이 파일)
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

## 🐳 Docker 명령어 모음 (개발환경 기준)

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

## 🗃️ 데이터베이스 마이그레이션 (Alembic)

### 📊 마이그레이션 시스템 개요
이 프로젝트는 **Alembic**을 사용하여 데이터베이스 스키마 변경을 관리합니다.
- ✅ **환경변수 기반** - 개발/스테이징/운영 환경별 자동 설정
- ✅ **버전 관리** - Git과 연동된 마이그레이션 이력 추적
- ✅ **자동 실행** - 컨테이너 시작 시 자동 마이그레이션
- ✅ **롤백 지원** - 문제 발생 시 이전 버전으로 복구 가능

### 🏗️ 마이그레이션 구조
```
api-server/
├── alembic/                        # Alembic 마이그레이션 디렉토리
│   ├── versions/                   # 마이그레이션 버전 파일들
│   │   └── 001_initial_migration.py
│   ├── env.py                      # 환경 설정 (환경변수 연동)
│   └── script.py.mako              # 마이그레이션 템플릿
├── alembic.ini                     # Alembic 설정 파일
├── migrate.sh                      # DB 연결 대기 + 마이그레이션 실행 스크립트
└── mysql/init/                     # 첫 설치용 초기화 스크립트 (백업용)
```

### 🔄 마이그레이션 워크플로우

#### **1️⃣ 새로운 마이그레이션 생성**
```bash
# 모델 변경 후 자동으로 마이그레이션 생성
docker-compose exec api-server alembic revision --autogenerate -m "Add user table"

# 수동 마이그레이션 생성 (복잡한 데이터 변경 시)
docker-compose exec api-server alembic revision -m "Custom data migration"
```

#### **2️⃣ 마이그레이션 적용**
```bash
# 최신 버전으로 업그레이드
docker-compose exec api-server alembic upgrade head

# 특정 버전으로 업그레이드
docker-compose exec api-server alembic upgrade 002
```

#### **3️⃣ 마이그레이션 상태 확인**
```bash
# 현재 마이그레이션 버전 확인
docker-compose exec api-server alembic current

# 마이그레이션 이력 확인
docker-compose exec api-server alembic history

# 마이그레이션 차이 확인
docker-compose exec api-server alembic show 001
```

#### **4️⃣ 롤백 (문제 발생 시)**
```bash
# 이전 버전으로 롤백
docker-compose exec api-server alembic downgrade -1

# 특정 버전으로 롤백
docker-compose exec api-server alembic downgrade 001

# 초기 상태로 롤백
docker-compose exec api-server alembic downgrade base
```

### 🌍 환경별 설정

#### **개발환경 (Docker MySQL)**
```bash
# .env.dev 설정 예시
ENV=development
DB_HOST=db
DB_NAME=hello_sally_dev
DB_USER=sally_dev_user
DB_PASSWORD=sally_dev_password
```

#### **운영환경 (AWS RDS)**
```bash
# .env.prod 설정 예시
ENV=production
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_NAME=hello_sally_prod
DB_USER=sally_prod_user
DB_PASSWORD=your-secure-password
```

### 🚀 운영환경 배포

#### **운영환경 Docker Compose 실행**
```bash
# 운영환경 설정으로 실행 (AWS RDS 사용)
docker-compose -f docker-compose.prod.yml up -d

# 마이그레이션 상태 확인
docker-compose -f docker-compose.prod.yml exec api-server alembic current
```

### ⚠️ 마이그레이션 주의사항

#### **개발 시 주의점**
1. **모델 변경 후 반드시 마이그레이션 생성**: `--autogenerate` 사용
2. **생성된 마이그레이션 검토**: 자동 생성이 항상 완벽하지 않음
3. **테스트**: 로컬에서 충분히 테스트 후 커밋
4. **백업**: 운영환경 적용 전 DB 백업 필수

#### **운영 배포 시 주의점**
```bash
# 1. 운영 DB 백업
mysqldump -h RDS_ENDPOINT -u USER -p DATABASE_NAME > backup.sql

# 2. 마이그레이션 검증 (Dry-run)
docker-compose exec api-server alembic upgrade head --sql

# 3. 점검 모드로 배포
# 4. 마이그레이션 실행 및 검증
# 5. 서비스 재개
```

### 🔧 마이그레이션 스크립트 예시

#### **테이블 추가**
```python
def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('users')
```

#### **컬럼 추가**
```python
def upgrade() -> None:
    op.add_column('audio_files', sa.Column('duration', sa.Integer(), nullable=True))

def downgrade() -> None:
    op.drop_column('audio_files', 'duration')
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

### 마이그레이션 관련 문제
```bash
# 마이그레이션 충돌 해결
docker-compose exec api-server alembic merge heads

# 마이그레이션 리셋 (개발환경만)
docker-compose down -v
docker-compose up --build

# Alembic 버전 테이블 수동 조작 (긴급시만)
docker-compose exec db mysql -u sally_dev_user -p hello_sally_dev
# DELETE FROM alembic_version; (주의: 데이터 손실 위험)
```

## 📄 저작권 및 라이선스

**이 프로젝트는 19층 사이드 프로젝트 팀의 사유재산입니다.**

- 모든 소스코드와 관련 자료에 대한 저작권은 19층 팀에 있습니다.
- 팀 구성원이 아닌 외부인의 무단 사용, 복제, 배포를 금지합니다.
- 상업적 이용은 팀 내부 승인이 필요합니다.

**19층 사이드 프로젝트 팀**
프로젝트에 대한 질문이나 제안사항이 있으시면 팀 내부 채널을 통해 연락해주세요!

📧 hellosally.contact@gmail.com

---
*Made with ❤️ by 19층 Team*