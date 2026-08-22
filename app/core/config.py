from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Configuration (Loaded strictly from .env)
    app_name: str
    app_env: str
    api_v1_prefix: str

    # MySQL Database Configuration (Loaded strictly from .env)
    db_host: str
    db_port: int
    db_user: str
    db_password: str = ""
    db_name: str
    database_url: str | None = None

    # Security & JWT Authentication (Loaded strictly from .env)
    secret_key: str
    admin_api_key: str
    algorithm: str
    access_token_expire_minutes: int

    # Paths & Runtime Settings (Loaded strictly from .env)
    model_dir: str
    raw_data_path: str
    training_catalog_path: str
    cors_origins: str
    log_level: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]

    @property
    def effective_database_url(self) -> str:
        """
        Returns the explicit DATABASE_URL from .env if provided.
        Otherwise dynamically builds the connection URL from DB_* environment variables.
        """
        if self.database_url:
            return self.database_url
        pwd_part = f":{self.db_password}" if self.db_password else ""
        return f"mysql+pymysql://{self.db_user}{pwd_part}@{self.db_host}:{self.db_port}/{self.db_name}"


@lru_cache
def get_settings() -> Settings:
    return Settings()
