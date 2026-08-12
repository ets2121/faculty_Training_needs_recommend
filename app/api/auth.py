"""
Authentication API: Login, Token, Profile
"""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    get_current_user,
    get_user_department_id,
    get_user_role_name,
    hash_password,
    log_audit,
    verify_password,
)
from app.db.models import Department, DepartmentAdmin, Faculty, Role, User
from app.db.session import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ─── Request / Response Schemas ───────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: str | None
    full_name: str | None
    role: str
    department: dict | None
    status: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    email: str | None = None
    full_name: str | None = None
    role: str = "faculty"
    department_code: str | None = None
    faculty_code: str | None = None
    academic_rank: str | None = None
    highest_degree: str | None = None
    specialization: str | None = None


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password.")
    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive.")

    token = create_access_token(data={"sub": str(user.id), "username": user.username})

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    role_name = get_user_role_name(user, db)
    dept_id = get_user_department_id(user, db)
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None

    log_audit(db, user, "login", entity_type="user", entity_id=str(user.id),
              ip_address=request.client.host if request.client else None)

    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": role_name,
            "department": {"id": dept.id, "code": dept.code, "name": dept.name} if dept else None,
        },
    )


@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the authenticated user's profile."""
    role_name = get_user_role_name(current_user, db)
    dept_id = get_user_department_id(current_user, db)
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None

    return UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=role_name,
        department={"id": dept.id, "code": dept.code, "name": dept.name} if dept else None,
        status=current_user.status,
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(
    body: RegisterRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Register a new user. Only system_admin or department_admin can register users.
    Department admins can only create faculty in their own department.
    """
    admin_role = get_user_role_name(current_user, db)
    if admin_role not in ("system_admin", "department_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can register users.")

    # Check username uniqueness
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists.")
    if body.email and db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists.")

    # Resolve role
    role = db.query(Role).filter(Role.name == body.role).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role: {body.role}")

    # Department admin restrictions
    if admin_role == "department_admin":
        if body.role != "faculty":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Department admins can only create faculty users.")

    # Resolve department
    department = None
    if body.department_code:
        department = db.query(Department).filter(Department.code == body.department_code).first()
        if not department:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Department not found: {body.department_code}")
        if admin_role == "department_admin":
            admin_dept_id = get_user_department_id(current_user, db)
            if department.id != admin_dept_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot create users in another department.")

    # Create user
    new_user = User(
        username=body.username,
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role_id=role.id,
        status="active",
    )
    db.add(new_user)
    db.flush()

    # Create profile based on role
    if body.role == "faculty" and department:
        faculty = Faculty(
            user_id=new_user.id,
            department_id=department.id,
            faculty_code=body.faculty_code,
            academic_rank=body.academic_rank,
            highest_degree=body.highest_degree,
            specialization=body.specialization,
            status="active",
        )
        db.add(faculty)
    elif body.role == "department_admin" and department:
        dept_admin = DepartmentAdmin(
            user_id=new_user.id,
            department_id=department.id,
            status="active",
        )
        db.add(dept_admin)

    db.commit()

    log_audit(db, current_user, "create_user", entity_type="user", entity_id=str(new_user.id),
              new_values={"username": body.username, "role": body.role, "department": body.department_code},
              ip_address=request.client.host if request.client else None)

    return {
        "status": "success",
        "message": f"User '{body.username}' created successfully.",
        "user_id": new_user.id,
    }
