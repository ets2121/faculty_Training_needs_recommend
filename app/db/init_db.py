from sqlalchemy import inspect, text
from app.db.session import engine, SessionLocal
from app.db.models import Base, Role
from app.db.seed import seed_database


def init_db():
    """Create MySQL tables if missing, alter schema for new columns if needed, and run seed database logic."""
    Base.metadata.create_all(bind=engine)

    # Check and add missing columns to 'faculty' table dynamically
    try:
        inspector = inspect(engine)
        existing_cols = {c["name"] for c in inspector.get_columns("faculty")}
        with engine.connect() as conn:
            if "questionnaire_status" not in existing_cols:
                conn.execute(text(
                    "ALTER TABLE faculty ADD COLUMN questionnaire_status VARCHAR(30) NOT NULL DEFAULT 'not_started'"
                ))
            if "last_recommendation_json" not in existing_cols:
                conn.execute(text(
                    "ALTER TABLE faculty ADD COLUMN last_recommendation_json TEXT NULL"
                ))
            if "last_recommendation_at" not in existing_cols:
                conn.execute(text(
                    "ALTER TABLE faculty ADD COLUMN last_recommendation_at DATETIME NULL"
                ))
            conn.commit()
    except Exception as e:
        print(f"Schema update notice for faculty table: {e}")

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
