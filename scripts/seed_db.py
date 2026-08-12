"""
CLI Runner to Seed the Database
"""
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import engine, SessionLocal
from app.db.models import Base
from app.db.seed import seed_database

if __name__ == "__main__":
    print("Creating database tables if they do not exist...")
    Base.metadata.create_all(bind=engine)

    print("Seeding database...")
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
