from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "QSU Faculty Training Needs Recommender"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    
    # MySQL Database Settings (XAMPP / Remote)
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = ""
    db_name: str = "qsu_recommender"
    database_url: str = "mysql+pymysql://root:@localhost:3306/qsu_recommender"

    # Security & Auth Settings
    admin_api_key: str = "change-this-in-production"
    secret_key: str = "qsu-recommender-super-secret-key-2026-change-in-prod"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # App Paths
    model_dir: str = "./models"
    raw_data_path: str = "./data/raw/faculty_training.csv"
    training_catalog_path: str = "./data/raw/training_catalog.csv"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]

    @property
    def effective_database_url(self) -> str:
        if self.database_url and not self.database_url.startswith("sqlite"):
            return self.database_url
        if self.db_host:
            pwd_part = f":{self.db_password}" if self.db_password else ""
            return f"mysql+pymysql://{self.db_user}{pwd_part}@{self.db_host}:{self.db_port}/{self.db_name}"
        return self.database_url

@lru_cache
def get_settings() -> Settings:
    return Settings()

