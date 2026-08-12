from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

settings = get_settings()
db_url = settings.effective_database_url

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
