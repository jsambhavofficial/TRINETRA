"""
NEXUS API Configuration Settings
Loads environment variables with safe defaults for local development.
"""
from typing import List, Union, Optional
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[".env", "../../.env", "../.env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "NEXUS"
    APP_ENV: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_V1_STR: str = "/api/v1"
    API_CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./nexus_dev.db"
    USE_SQLITE_DEV: bool = True
    SQLITE_DB_PATH: str = "./nexus_dev.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # S3 / MinIO Storage
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "nexusadmin"
    S3_SECRET_KEY: str = "nexussecretkey123"
    S3_BUCKET_EVIDENCE: str = "nexus-evidence"
    S3_BUCKET_GENERATED: str = "nexus-generated"
    S3_BUCKET_DEMO: str = "nexus-demo"
    S3_REGION: str = "us-east-1"
    S3_USE_SSL: bool = False

    # Security
    AUTH_SECRET: str = "dev-secret-key-change-in-production-nexus-operational-key-998"
    AUTH_TOKEN_EXPIRE_MINUTES: int = 1440

    # Default World
    DEFAULT_WORLD_ID: str = "world-nexus-city-01"
    DEMO_MODE: bool = True

    # Voice & Speech-to-Text Providers
    STT_PROVIDER: str = "demo"  # "demo", "whisper", or "none"
    UPLOAD_MAX_BYTES: int = 26214400  # 25MB

    # Google Gemini AI Model Integration
    gemine_api: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    @field_validator("API_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            import json
            return json.loads(v)
        return v


settings = Settings()
