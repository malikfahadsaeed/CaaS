"""Application configuration loaded from the environment via pydantic-settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.constants import API_V1_PREFIX


class Settings(BaseSettings):
    """Runtime settings. Values are read from environment variables / `.env`."""

    app_name: str = "CaaS Backend"
    environment: str = "development"
    log_level: str = "INFO"
    api_v1_prefix: str = API_V1_PREFIX

    # Comma-separated list of allowed CORS origins.
    cors_origins: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse the comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
