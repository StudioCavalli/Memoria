from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    environment: str = "development"
    debug: bool = True
    app_name: str = "MEMORIA"

    # Database
    database_url: str = "postgresql://memoria:memoria_dev_password@localhost:5432/memoria"

    # JWT
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    # AI
    anthropic_api_key: str = ""
    openai_api_key: str = ""

    # Speech
    elevenlabs_api_key: str = ""
    azure_speech_key: str = ""
    azure_speech_region: str = ""

    # Email
    sendgrid_api_key: str = ""
    gazette_sender_email: str = "gazette@memoria.fr"

    # Storage
    s3_endpoint: str = "http://minio:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket: str = "memoria-audio"

    # Encryption
    aes_encryption_key: str = "change-me-32-bytes-key-here!!!!"

    # Redis
    redis_url: str = "redis://redis:6379/0"

    model_config = {"env_file": ".env", "extra": "ignore"}

    @property
    def sqlalchemy_database_url(self) -> str:
        """Convert postgres:// to postgresql:// for SQLAlchemy compatibility."""
        url = self.database_url.strip()
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url


settings = Settings()
