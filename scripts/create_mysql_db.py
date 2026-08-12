import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pymysql
from app.core.config import get_settings

settings = get_settings()

try:
    print(f"Connecting to MySQL at {settings.db_host}:{settings.db_port} as user '{settings.db_user}'...")
    conn = pymysql.connect(
        host=settings.db_host,
        port=settings.db_port,
        user=settings.db_user,
        password=settings.db_password
    )
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{settings.db_name}` DEFAULT CHARACTER SET utf8mb4;")
    print(f"SUCCESS: MySQL database '{settings.db_name}' created/verified successfully!")
    conn.close()
except Exception as e:
    print(f"ERROR: Connecting to MySQL: {e}")
