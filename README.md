# Hello Sally ❤️ 모노 레포
가보자구~🏃
## 파일 구조
```
hello-sally/
├── api-server/
│   ├── app/
│   │   ├── main.py                 # FastAPI 진입점
│   │   ├── core/                   # 환경설정, 보안 관련 유틸
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   ├── db/                     # DB 연결 및 모델
│   │   │   ├── base.py
│   │   │   ├── models.py
│   │   │   ├── session.py
│   │   ├── routers/                # API 라우터
│   │   │   ├── auth.py
│   │   │   ├── upload.py
│   │   ├── schemas/                # Pydantic 스키마
│   │   │   ├── user.py
│   │   │   ├── file.py
│   │   └── services/               # S3, STT API 연동
│   │       ├── s3.py
│   │       ├── stt.py
│   ├── Dockerfile                  # FastAPI 서버 빌드용
│   ├── requirements.txt
│   └── .env                        # 환경변수 파일
├── docker-compose.yml             # 로컬 도커 실행용
└── README.md
```

# TBU