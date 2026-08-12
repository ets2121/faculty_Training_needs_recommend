"""
Authentication API: Login, Token, Profile, Hierarchical Account Creation

Account Creation Hierarchy:
  system_admin  → can create: department_admin, system_admin
  department_admin → can create: faculty (only within their own department)
  faculty       → CANNOT create any accounts
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


# ─── Schemas ─────────────────────────────────────────────────────────────────

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
    role: str  # "faculty", "department_admin", "system_admin"
    department_code: str | None = None
    faculty_code: str | None = None
    academic_rank: str | None = None
    highest_degree: str | None = None
    specialization: str | None = None


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticate and return a JWT Bearer token."""
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password.")
    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive. Contact your administrator.")

    token = create_access_token(data={"sub": str(user.id), "username": user.username})
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
    """Return the currently authenticated user's profile."""
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
    Create a new user account following the strict hierarchy:

    - system_admin → can create: department_admin or system_admin (department_code required for dept_admin)
    - department_admin → can only create: faculty (within their own department only)
    - faculty → FORBIDDEN: cannot create any accounts
    """
    admin_role = get_user_role_name(current_user, db)

    # faculty cannot create accounts
    if admin_role == "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty members cannot create accounts. Contact your Department Administrator.",
        )

    # department_admin can only create faculty accounts
    if admin_role == "department_admin":
        if body.role != "faculty":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Department Administrators can only create Faculty accounts.",
            )

    # system_admin can create dept_admin or system_admin (not faculty directly, unless dept given)
    if admin_role == "system_admin":
        if body.role not in ("faculty", "department_admin", "system_admin"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role '{body.role}'. Valid roles: faculty, department_admin, system_admin",
            )

    # Validate role exists in DB
    role = db.query(Role).filter(Role.name == body.role).first()
    if not role:
        raise HTTPException(status_code=400, detail=f"Role '{body.role}' not found in the system.")

    # Check uniqueness
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists.")
    if body.email and db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists.")

    # Resolve department
    department = None
    if body.role in ("faculty", "department_admin"):
        if not body.department_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"department_code is required when creating a {body.role} account.",
            )
        department = db.query(Department).filter(Department.code == body.department_code).first()
        if not department:
            raise HTTPException(status_code=400, detail=f"Department '{body.department_code}' not found.")

        # Department admin can only create faculty in their own dept
        if admin_role == "department_admin":
            my_dept_id = get_user_department_id(current_user, db)
            if department.id != my_dept_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only create faculty accounts within your own department.",
                )

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

    # Create role-specific profile
    if body.role == "faculty" and department:
        db.add(Faculty(
            user_id=new_user.id,
            department_id=department.id,
            faculty_code=body.faculty_code,
            academic_rank=body.academic_rank,
            highest_degree=body.highest_degree,
            specialization=body.specialization,
            status="active",
        ))
    elif body.role == "department_admin" and department:
        db.add(DepartmentAdmin(
            user_id=new_user.id,
            department_id=department.id,
            status="active",
        ))

    db.commit()

    log_audit(
        db, current_user, "create_user",
        entity_type="user", entity_id=str(new_user.id),
        new_values={"username": body.username, "role": body.role, "department": body.department_code},
        ip_address=request.client.host if request.client else None,
    )

    return {
        "status": "success",
        "message": f"Account for '{body.username}' ({body.role}) created successfully.",
        "user_id": new_user.id,
    }
