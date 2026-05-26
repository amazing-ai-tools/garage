from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./garage-dev.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    app_origin: str = "http://localhost:5173"
    api_public_origin: str = "http://localhost:8000"
    google_client_id: str | None = None
    google_client_secret: str | None = None
    session_secret: str = "change-me-in-production"
    session_cookie_name: str = "garage_session"
    session_cookie_secure: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
