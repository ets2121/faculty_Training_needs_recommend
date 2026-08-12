"""
Security module: Password hashing, JWT tokens, and FastAPI auth dependencies.
"""
import json
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any

import jwt
import bcrypt
from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.db.models import AuditLog, User, Role, Faculty, DepartmentAdmin

# ─── Password Hashing ────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


# ─── JWT Tokens ───────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")


# ─── FastAPI Dependencies ─────────────────────────────────────────────────────

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> User:
    """Extract and validate JWT from Authorization header, return User object."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Use: Bearer <token>",
        )
    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive.")

    return user


def require_roles(*allowed_roles: str):
    """Dependency factory: restricts endpoint to users with specific role names."""
    def checker(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        role = db.query(Role).filter(Role.id == current_user.role_id).first()
        if not role or role.name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}",
            )
        return current_user
    return checker


def get_user_role_name(user: User, db: Session) -> str:
    """Utility to get role name string from a User object."""
    role = db.query(Role).filter(Role.id == user.role_id).first()
    return role.name if role else "unknown"


def get_user_department_id(user: User, db: Session) -> int | None:
    """Get the department_id associated with a user (faculty or dept admin)."""
    faculty = db.query(Faculty).filter(Faculty.user_id == user.id).first()
    if faculty:
        return faculty.department_id
    dept_admin = db.query(DepartmentAdmin).filter(DepartmentAdmin.user_id == user.id).first()
    if dept_admin:
        return dept_admin.department_id
    return None


# ─── Data Isolation Helpers ───────────────────────────────────────────────────

def enforce_faculty_scope(current_user: User, target_faculty_id: int, db: Session) -> None:
    """Ensure a Faculty user can only access their own records."""
    role_name = get_user_role_name(current_user, db)
    if role_name == "system_admin":
        return  # System admin can access all
    if role_name == "department_admin":
        # Dept admin can access faculty in their department
        target_faculty = db.query(Faculty).filter(Faculty.id == target_faculty_id).first()
        admin_dept_id = get_user_department_id(current_user, db)
        if target_faculty and target_faculty.department_id == admin_dept_id:
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this faculty record.")
    if role_name == "faculty":
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if faculty and faculty.id == target_faculty_id:
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. You can only view your own records.")
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


def enforce_department_scope(current_user: User, target_department_id: int, db: Session) -> None:
    """Ensure a Department Admin can only access their own department."""
    role_name = get_user_role_name(current_user, db)
    if role_name == "system_admin":
        return
    user_dept_id = get_user_department_id(current_user, db)
    if user_dept_id == target_department_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this department.")


# ─── Legacy Admin API Key (backwards compatible) ─────────────────────────────

def require_admin(x_admin_api_key: str | None = Header(default=None)):
    """Legacy admin key check — kept for backwards compatibility with training endpoint."""
    settings = get_settings()
    if not x_admin_api_key or x_admin_api_key != settings.admin_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid X-Admin-API-Key header required."
        )


# ─── Audit Logger ─────────────────────────────────────────────────────────────

def log_audit(
    db: Session,
    user: User | None,
    action: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
    old_values: dict | None = None,
    new_values: dict | None = None,
    ip_address: str | None = None,
) -> None:
    """Record an audit log entry."""
    role_name = None
    if user:
        role = db.query(Role).filter(Role.id == user.role_id).first()
        role_name = role.name if role else None

    entry = AuditLog(
        user_id=user.id if user else None,
        username=user.username if user else None,
        role_name=role_name,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        old_values_json=json.dumps(old_values) if old_values else None,
        new_values_json=json.dumps(new_values) if new_values else None,
        ip_address=ip_address,
    )
    db.add(entry)
    db.commit()
