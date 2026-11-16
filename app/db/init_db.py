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
            if "position" not in existing_cols:
                conn.execute(text(
                    "ALTER TABLE faculty ADD COLUMN position VARCHAR(50) DEFAULT 'Permanent'"
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
            else:
                # Ensure Department Admins have linked Faculty profiles
                from app.db.models import DepartmentAdmin, Faculty
                das = db.query(DepartmentAdmin).all()
                created = False
                for da in das:
                    if da.department_id:
                        fac = db.query(Faculty).filter(Faculty.user_id == da.user_id).first()
                        if not fac:
                            db.add(Faculty(
                                user_id=da.user_id,
                                department_id=da.department_id,
                                faculty_code=f"CHAIR-{da.user_id:04d}",
                                academic_rank="Assistant Professor I",
                                position="Permanent",
                                status="active",
                                questionnaire_status="not_started",
                            ))
                            created = True
                if created:
                    db.commit()
        finally:
            db.close()
    except Exception as e:
        print(f"Database init notice: {e}")
