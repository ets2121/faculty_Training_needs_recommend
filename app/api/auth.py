"""
Auth API — Login, user profile, registration, and password change endpoints.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    get_current_user,
    get_user_department_id,
    get_user_campus_id,
    get_user_role_name,
    hash_password,
    log_audit,
    verify_password,
)
from app.db.models import Campus, CampusAdmin, Department, DepartmentAdmin, Faculty, Role, User
from app.db.session import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])


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
    campus: dict | None
    department: dict | None
    status: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str | None = None
    email: str | None = None
    role: str  # "faculty", "department_admin", "campus_admin", "system_admin"
    campus_id: int | None = None
    campus_code: str | None = None
    department_id: int | None = None
    department_code: str | None = None
    faculty_code: str | None = None
    academic_rank: str | None = None
    highest_degree: str | None = None
    specialization: str | None = None


def _get_user_campus_dept_info(user: User, db: Session):
    """Helper to extract campus and department dictionaries for response payload."""
    role_name = get_user_role_name(user, db)
    campus_info = None
    dept_info = None

    if role_name == "campus_admin":
        ca = user.campus_admin_profile
        if ca and ca.campus:
            campus_info = {"id": ca.campus.id, "code": ca.campus.code, "name": ca.campus.name}
    elif role_name == "department_admin":
        da = user.department_admin_profile
        if da and da.department:
            dept_info = {"id": da.department.id, "code": da.department.code, "name": da.department.name}
            if da.department.campus:
                campus_info = {"id": da.department.campus.id, "code": da.department.campus.code, "name": da.department.campus.name}
    elif role_name == "faculty":
        fac = user.faculty_profile
        if fac and fac.department:
            dept_info = {"id": fac.department.id, "code": fac.department.code, "name": fac.department.name}
            if fac.department.campus:
                campus_info = {"id": fac.department.campus.id, "code": fac.department.campus.code, "name": fac.department.campus.name}

    return campus_info, dept_info


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
    campus_info, dept_info = _get_user_campus_dept_info(user, db)

    log_audit(db, user, "login", entity_type="user", entity_id=str(user.id),
              ip_address=request.client.host if request.client else None)

    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": role_name,
            "campus": campus_info,
            "department": dept_info,
        },
    )


@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the currently authenticated user's profile."""
    role_name = get_user_role_name(current_user, db)
    campus_info, dept_info = _get_user_campus_dept_info(current_user, db)

    return UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=role_name,
        campus=campus_info,
        department=dept_info,
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
    Create a new user account following the hierarchical permissions:

    - system_admin can create: campus_admin, department_admin, system_admin, faculty
    - campus_admin can create: department_admin (in their campus), faculty (in their campus)
    - department_admin can create: faculty (in their own department and campus only)
    - faculty FORBIDDEN
    """
    admin_role = get_user_role_name(current_user, db)

    if admin_role == "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty members cannot create accounts. Contact your Department or Campus Administrator.",
        )

    if admin_role == "department_admin" and body.role != "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Department Administrators can only create Faculty accounts.",
        )

    if admin_role == "campus_admin" and body.role not in ("department_admin", "faculty"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Campus Administrators can only create Department Administrator and Faculty accounts.",
        )

    # Validate role exists in DB
    role = db.query(Role).filter(Role.name == body.role).first()
    if not role:
        raise HTTPException(status_code=400, detail=f"Role '{body.role}' not found in the system.")

    # Check username/email uniqueness
    clean_username = body.username.strip()
    if db.query(User).filter(User.username == clean_username).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Username '{clean_username}' already exists.")
    if body.email:
        clean_email = body.email.strip()
        if db.query(User).filter(User.email == clean_email).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Email '{clean_email}' already exists.")

    # Resolve target campus
    target_campus_id = None
    if admin_role == "campus_admin":
        target_campus_id = get_user_campus_id(current_user, db)
    elif admin_role == "department_admin":
        target_campus_id = get_user_campus_id(current_user, db)
    else:
        if body.campus_id:
            target_campus_id = body.campus_id
        elif body.campus_code:
            c = db.query(Campus).filter(Campus.code == body.campus_code.strip().upper()).first()
            if c:
                target_campus_id = c.id

    # Handle Role-Specific Validation & Creation
    if body.role == "campus_admin":
        if not target_campus_id:
            raise HTTPException(status_code=400, detail="campus_id or campus_code is required to create a Campus Admin.")
        campus = db.query(Campus).filter(Campus.id == target_campus_id).first()
        if not campus:
            raise HTTPException(status_code=404, detail="Selected campus not found.")

    department = None
    if body.role in ("department_admin", "faculty"):
        if admin_role == "department_admin":
            # Automatically lock to department admin's department
            my_dept_id = get_user_department_id(current_user, db)
            department = db.query(Department).filter(Department.id == my_dept_id).first()
        else:
            if body.department_id:
                department = db.query(Department).filter(Department.id == body.department_id).first()
            elif body.department_code:
                if not target_campus_id:
                    raise HTTPException(status_code=400, detail="Campus must be specified to resolve the department.")
                department = db.query(Department).filter(
                    Department.campus_id == target_campus_id,
                    Department.code == body.department_code.strip().upper(),
                ).first()

            if not department:
                raise HTTPException(status_code=400, detail="Valid department_id or department_code for the selected campus is required.")

            if admin_role == "campus_admin" and department.campus_id != target_campus_id:
                raise HTTPException(status_code=403, detail="You cannot assign departments outside your campus.")

    # Create user
    new_user = User(
        username=clean_username,
        email=body.email.strip() if body.email else None,
        hashed_password=hash_password(body.password),
        full_name=body.full_name.strip() if body.full_name else None,
        role_id=role.id,
        status="active",
    )
    db.add(new_user)
    db.flush()

    # Create role-specific profile
    if body.role == "campus_admin" and target_campus_id:
        db.add(CampusAdmin(
            user_id=new_user.id,
            campus_id=target_campus_id,
            status="active",
        ))
    elif body.role == "department_admin" and department:
        db.add(DepartmentAdmin(
            user_id=new_user.id,
            department_id=department.id,
            status="active",
        ))
    elif body.role == "faculty" and department:
        db.add(Faculty(
            user_id=new_user.id,
            department_id=department.id,
            faculty_code=body.faculty_code.strip() if body.faculty_code else None,
            academic_rank=body.academic_rank.strip() if body.academic_rank else "Instructor I",
            highest_degree=body.highest_degree.strip() if body.highest_degree else None,
            specialization=body.specialization.strip() if body.specialization else None,
            status="active",
        ))

    db.commit()

    log_audit(
        db, current_user, "create_user",
        entity_type="user", entity_id=str(new_user.id),
        new_values={
            "username": clean_username,
            "role": body.role,
            "campus_id": target_campus_id,
            "department_id": department.id if department else None,
        },
        ip_address=request.client.host if request.client else None,
    )

    return {
        "status": "success",
        "message": f"Account for '{clean_username}' ({body.role}) created successfully.",
        "user_id": new_user.id,
    }


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
def change_password(
    body: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Allow any authenticated user to change their own password."""
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )
    if len(body.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters.",
        )
    current_user.hashed_password = hash_password(body.new_password)
    db.commit()

    log_audit(
        db, current_user, "change_password",
        entity_type="user", entity_id=str(current_user.id),
        ip_address=request.client.host if request.client else None,
    )

    return {"status": "success", "message": "Password changed successfully."}