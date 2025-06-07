from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os
import sys
from dotenv import load_dotenv

# Alembic Config object에 접근
config = context.config

# Python 로깅 설정
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 현재 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# 환경변수 로드
load_dotenv()

# 모델의 MetaData 가져오기
from app.db.models import Base
target_metadata = Base.metadata

# 다른 값들도 config에서 가져올 수 있지만, 여기서는 환경변수 사용


def get_database_url():
    """환경변수를 사용하여 데이터베이스 URL 생성"""
    env = os.getenv("ENV", "development")
    
    if env == "production":
        # 운영 환경 - AWS RDS
        host = os.getenv("DB_HOST")
        port = os.getenv("DB_PORT", "3306")
        user = os.getenv("DB_USER")
        password = os.getenv("DB_PASSWORD")
        database = os.getenv("DB_NAME", "hello_sally_prod")
    else:
        # 개발/스테이징 환경
        host = os.getenv("DB_HOST", "db")
        port = os.getenv("DB_PORT", "3306")
        user = os.getenv("DB_USER", "sally_dev_user")
        password = os.getenv("DB_PASSWORD", "sally_dev_password")
        database = os.getenv("DB_NAME", "hello_sally_dev")
    
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4"


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # alembic.ini의 설정을 오버라이드
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_database_url()
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online() 