"""
Users Management API: List, View, Update users with RBAC scope.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import (
    get_current_user,
    get_user_department_id,
    get_user_role_name,
    log_audit,
    require_roles,
)
from app.db.models import Department, DepartmentAdmin, Faculty, Role, User
from app.db.session import get_db

router = APIRouter(prefix="/users", tags=["Users"])


class UserOut(BaseModel):
    id: int
    username: str
    email: str | None
    full_name: str | None
    role: str
    department_code: str | None
    status: str


def _user_to_out(user: User, db: Session) -> dict:
    role_name = get_user_role_name(user, db)
    dept_id = get_user_department_id(user, db)
    dept = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": role_name,
        "department_code": dept.code if dept else None,
        "status": user.status,
    }


@router.get("")
def list_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List users. System admin sees all. Dept admin sees own department. Faculty sees only self."""
    role_name = get_user_role_name(current_user, db)

    if role_name == "system_admin":
        users = db.query(User).all()
    elif role_name == "department_admin":
        dept_id = get_user_department_id(current_user, db)
        faculty_user_ids = [f.user_id for f in db.query(Faculty).filter(Faculty.department_id == dept_id).all()]
        admin_user_ids = [a.user_id for a in db.query(DepartmentAdmin).filter(DepartmentAdmin.department_id == dept_id).all()]
        all_ids = set(faculty_user_ids + admin_user_ids)
        users = db.query(User).filter(User.id.in_(all_ids)).all() if all_ids else []
    else:
        users = [current_user]

    return {"users": [_user_to_out(u, db) for u in users]}


@router.get("/{user_id}")
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user by ID with scope enforcement."""
    role_name = get_user_role_name(current_user, db)
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if role_name == "faculty" and target_user.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    elif role_name == "department_admin":
        admin_dept_id = get_user_department_id(current_user, db)
        target_dept_id = get_user_department_id(target_user, db)
        if admin_dept_id != target_dept_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this user.")

    return _user_to_out(target_user, db)


class UpdateUserRequest(BaseModel):
    full_name: str | None = None
    email: str | None = None
    status: str | None = None


@router.patch("/{user_id}")
def update_user(
    user_id: int,
    body: UpdateUserRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user. System admin can update anyone. Dept admin can update faculty in their dept."""
    role_name = get_user_role_name(current_user, db)
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if role_name == "faculty" and target_user.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    elif role_name == "department_admin":
        admin_dept_id = get_user_department_id(current_user, db)
        target_dept_id = get_user_department_id(target_user, db)
        if admin_dept_id != target_dept_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    old_values = {"full_name": target_user.full_name, "email": target_user.email, "status": target_user.status}

    if body.full_name is not None:
        target_user.full_name = body.full_name
    if body.email is not None:
        target_user.email = body.email
    if body.status is not None:
        if role_name not in ("system_admin", "department_admin"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can change user status.")
        target_user.status = body.status

    db.commit()

    log_audit(db, current_user, "update_user", entity_type="user", entity_id=str(user_id),
              old_values=old_values,
              new_values={"full_name": target_user.full_name, "email": target_user.email, "status": target_user.status},
              ip_address=request.client.host if request.client else None)

    return {"status": "success", "message": f"User {user_id} updated."}
