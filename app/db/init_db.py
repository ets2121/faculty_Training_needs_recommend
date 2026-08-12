from sqlalchemy import inspect
from app.db.session import engine, SessionLocal
from app.db.models import Base, Role
from app.db.seed import seed_database


def init_db():
    """Create MySQL tables if missing and run seed database logic."""
    Base.metadata.create_all(bind=engine)

    # Automatically run seed script if database is fresh
    try:
        db = SessionLocal()
        try:
            role_count = db.query(Role).count()
            if role_count == 0:
                print("Fresh database detected. Running seed logic...")
                seed_database(db)
        finally:
            db.close()
    except Exception as e:
        print(f"Database init notice: {e}")
