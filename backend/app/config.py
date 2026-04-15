from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./data/avishag.db"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    openai_timeout: int = 30
    openai_max_retries: int = 2
    telegram_bot_token: str = ""
    telegram_allowed_user_id: int = -1
    pin_code: str  # required — must be set in .env
    rate_limit: str = "60/minute"
    token_ttl_seconds: int = 60 * 60 * 24 * 30  # 30 days
    max_active_tokens: int = 20
    agent_max_iterations: int = 6
    bot_max_history_chars: int = 12000  # ~3000 tokens at 4 chars/token

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
