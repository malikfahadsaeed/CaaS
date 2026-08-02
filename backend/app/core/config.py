"""Application configuration loaded from the environment via pydantic-settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.constants import API_V1_PREFIX, DEFAULT_SYSTEM_PROMPT


class Settings(BaseSettings):
    """Runtime settings. Values are read from environment variables / `.env`."""

    app_name: str = "CaaS Backend"
    environment: str = "development"
    log_level: str = "INFO"
    api_v1_prefix: str = API_V1_PREFIX

    # Comma-separated list of allowed CORS origins.
    cors_origins: str = "http://localhost:3000"

    # Amazon Bedrock configuration. `bedrock_model_id` should be a foundation
    # model id or a cross-region inference profile id (e.g. a `us.anthropic...`
    # profile) available in `bedrock_region`. Verify availability and enable
    # model access in the AWS console before use.
    bedrock_model_id: str = "us.anthropic.claude-sonnet-4-20250514-v1:0"
    bedrock_region: str = "us-east-2"
    bedrock_max_tokens: int = 512
    system_prompt: str = DEFAULT_SYSTEM_PROMPT

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse the comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
