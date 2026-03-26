from urllib.parse import quote_plus

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str | None = None
    jwt_secret_key: str | None = None
    postgres_db: str = "ai_command_center_db"
    postgres_user: str = "postgres"
    postgres_password: str = ""
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    ai_provider: str = "gemini"
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    default_model_name: str = "gemini-3-flash"
    max_tokens_limit: int = 800
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str | None = None
    celery_result_backend: str | None = None
    upload_storage_dir: str = "./storage/uploads"
    max_upload_size_mb: int = 10
    rate_limit_per_minute: int = 120
    rate_limit_window_seconds: int = 60
    cors_origins: str = (
        "http://localhost:8080,"
        "http://127.0.0.1:8080,"
        "http://localhost:8081,"
        "http://127.0.0.1:8081,"
        "http://localhost:5173,"
        "http://127.0.0.1:5173"
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def build_database_url(self) -> "Settings":
        if not self.database_url:
            encoded_password = quote_plus(self.postgres_password)
            self.database_url = (
                f"postgresql+asyncpg://{self.postgres_user}:{encoded_password}"
                f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
            )
        if not self.jwt_secret_key or not self.jwt_secret_key.strip():
            raise ValueError(
                "JWT_SECRET_KEY is required. Set it in backend/.env before running the app."
            )
        provider = self.ai_provider.lower()
        if provider == "openai":
            if not self.openai_api_key or not self.openai_api_key.strip():
                raise ValueError(
                    "OPENAI_API_KEY is required when AI_PROVIDER=openai."
                )
        elif provider == "gemini":
            if not self.gemini_api_key or not self.gemini_api_key.strip():
                raise ValueError(
                    "GEMINI_API_KEY is required when AI_PROVIDER=gemini."
                )
        else:
            raise ValueError("AI_PROVIDER must be either 'openai' or 'gemini'.")
        if not self.celery_broker_url:
            self.celery_broker_url = self.redis_url
        if not self.celery_result_backend:
            self.celery_result_backend = self.redis_url
        return self


settings = Settings()
