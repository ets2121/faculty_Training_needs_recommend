"""
Database Migration Script to add Campuses, Campus Admins, and multi-campus support.
"""
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.db.session import engine, SessionLocal
from app.db.models import Base
from app.db.seed import seed_database

def run_migration():
    print("Running multi-campus database migration...")
    with engine.connect() as conn:
        # 1. Create campuses table if not exists
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS campuses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(30) NOT NULL UNIQUE,
            name VARCHAR(200) NOT NULL,
            description VARCHAR(500) NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_campus_code (code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """))
        conn.commit()

        # Seed initial campuses if empty
        conn.execute(text("""
        INSERT IGNORE INTO campuses (id, code, name, description, status) VALUES
        (1, 'DIFFUN', 'Diffun Campus (Main)', 'Main University Campus located in Diffun, Quirino', 'active'),
        (2, 'MADDELA', 'Maddela Campus', 'Satellite Campus located in Maddela, Quirino', 'active'),
        (3, 'CABARROGUIS', 'Cabarroguis Campus', 'Satellite Campus located in Cabarroguis, Quirino', 'active');
        """))
        conn.commit()

        # 2. Add campus_id to departments if not present
        result = conn.execute(text("""
        SELECT COUNT(*) FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'departments' 
        AND COLUMN_NAME = 'campus_id';
        """))
        has_campus_id = result.scalar() > 0

        if not has_campus_id:
            print("Adding campus_id column to departments table...")
            # Drop old unique index on code if present
            try:
                conn.execute(text("ALTER TABLE departments DROP INDEX code;"))
                conn.commit()
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE departments DROP INDEX uq_department_code;"))
                conn.commit()
            except Exception:
                pass

            conn.execute(text("""
            ALTER TABLE departments 
            ADD COLUMN campus_id INT NOT NULL DEFAULT 1 AFTER id,
            ADD CONSTRAINT fk_departments_campus FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE CASCADE,
            ADD CONSTRAINT uq_campus_dept_code UNIQUE (campus_id, code);
            """))
            conn.commit()

        # 3. Create campus_admins table if not exists
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS campus_admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            campus_id INT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_campus_admins_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_campus_admins_campus FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE CASCADE,
            INDEX idx_campus_admin_campus (campus_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """))
        conn.commit()

        # 4. Add campus_id to recommendation_history if not present
        result = conn.execute(text("""
        SELECT COUNT(*) FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'recommendation_history' 
        AND COLUMN_NAME = 'campus_id';
        """))
        has_rec_campus_id = result.scalar() > 0
        if not has_rec_campus_id:
            print("Adding campus_id to recommendation_history...")
            try:
                conn.execute(text("""
                ALTER TABLE recommendation_history 
                ADD COLUMN campus_id INT NULL AFTER id,
                ADD CONSTRAINT fk_rec_hist_campus FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE SET NULL;
                """))
                conn.commit()
            except Exception as e:
                print(f"Notice adding campus_id to recommendation_history: {e}")

    print("Schema migration completed. Now running seed logic...")
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    print("Multi-campus migration and seed successfully completed!")

if __name__ == "__main__":
    run_migration()