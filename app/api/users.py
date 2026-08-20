"""
User Management API — Admin-only endpoints for listing, viewing, updating, transferring, and deleting user accounts.
"""
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.security import (
    get_current_user,
    get_user_campus_id,
    get_user_department_id,
    get_user_role_name,
    hash_password,
    log_audit,
)
from app.db.models import AuditLog, Campus, CampusAdmin, Department, DepartmentAdmin, Faculty, QuestionnairePart, Role, User
from app.db.session import get_db
from app.api.questionnaire import (
    is_eligible_for_recommendation,
    REQUIRED_PARTS,
    TOTAL_PARTS,
    PART_LABELS,
)

router = APIRouter(prefix="/users", tags=["Users"])


def _user_to_out(u: User, db: Session) -> dict:
    role_name = get_user_role_name(u, db)
    faculty = u.faculty_profile
    dept_admin = u.department_admin_profile
    campus_admin = u.campus_admin_profile

    dept = None
    campus = None

    if faculty and faculty.department:
        dept = faculty.department
        campus = dept.campus
    elif dept_admin and dept_admin.department:
        dept = dept_admin.department
        campus = dept.campus
    elif campus_admin and campus_admin.campus:
        campus = campus_admin.campus

    q_status = faculty.questionnaire_status if faculty else None
    return {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "full_name": u.full_name,
        "role": role_name,
        "campus_id": campus.id if campus else None,
        "campus_code": campus.code if campus else None,
        "campus_name": campus.name if campus else None,
        "department_id": dept.id if dept else None,
        "department_code": dept.code if dept else None,
        "department_name": dept.name if dept else None,
        "faculty_id": faculty.id if faculty else None,
        "faculty_code": faculty.faculty_code if faculty else None,
        "academic_rank": faculty.academic_rank if faculty else None,
        "highest_degree": faculty.highest_degree if faculty else None,
        "specialization": faculty.specialization if faculty else None,
        "questionnaire_status": q_status,
        "status": q_status if q_status else u.status,
        "user_status": u.status,
        "account_status": u.status,
        "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


@router.get("")
def list_users(
    role: str | None = None,
    campus_id: int | None = None,
    department_code: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List user accounts with hierarchical access control:
    - system_admin: can view all users, with optional campus_id and department_code filters
    - campus_admin: can view all users in their assigned campus
    - department_admin: can view faculty in their department
    - faculty: FORBIDDEN
    """
    admin_role = get_user_role_name(current_user, db)

    if admin_role == "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty members cannot list user accounts.",
        )

    query = db.query(User)

    if role:
        target_role = db.query(Role).filter(Role.name == role).first()
        if target_role:
            query = query.filter(User.role_id == target_role.id)

    # Department Admin Isolation: only faculty in their own department
    if admin_role == "department_admin":
        my_dept_id = get_user_department_id(current_user, db)
        faculty_role = db.query(Role).filter(Role.name == "faculty").first()
        query = (
            query.join(Faculty, Faculty.user_id == User.id)
            .filter(Faculty.department_id == my_dept_id)
        )
        if faculty_role:
            query = query.filter(User.role_id == faculty_role.id)

    # Campus Admin Isolation: all users within their assigned campus
    elif admin_role == "campus_admin":
        my_campus_id = get_user_campus_id(current_user, db)
        all_users = query.all()
        filtered = []
        for u in all_users:
            u_campus_id = get_user_campus_id(u, db)
            if u_campus_id == my_campus_id:
                filtered.append(u)
        return {"total": len(filtered), "users": [_user_to_out(u, db) for u in filtered]}

    # System Admin Filtering
    elif admin_role == "system_admin":
        if campus_id:
            all_users = query.all()
            filtered = [u for u in all_users if get_user_campus_id(u, db) == campus_id]
            return {"total": len(filtered), "users": [_user_to_out(u, db) for u in filtered]}
        elif department_code:
            depts = db.query(Department).filter(Department.code == department_code.strip().upper()).all()
            dept_ids = [d.id for d in depts]
            all_users = query.all()
            filtered = [u for u in all_users if get_user_department_id(u, db) in dept_ids]
            return {"total": len(filtered), "users": [_user_to_out(u, db) for u in filtered]}

    users = query.all()
    return {"total": len(users), "users": [_user_to_out(u, db) for u in users]}


@router.get("/{user_id}")
def get_user_detail(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get full details of a specific user."""
    admin_role = get_user_role_name(current_user, db)
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    if admin_role == "campus_admin":
        my_campus_id = get_user_campus_id(current_user, db)
        target_campus_id = get_user_campus_id(target, db)
        if my_campus_id != target_campus_id:
            raise HTTPException(status_code=403, detail="Access denied. User belongs to another campus.")

    elif admin_role == "department_admin":
        my_dept_id = get_user_department_id(current_user, db)
        target_dept_id = get_user_department_id(target, db)
        if my_dept_id != target_dept_id:
            raise HTTPException(status_code=403, detail="Access denied to this user.")

    return _user_to_out(target, db)


class UpdateUserRequest(BaseModel):
    full_name: str | None = None
    email: str | None = None
    status: str | None = None
    academic_rank: str | None = None
    highest_degree: str | None = None
    specialization: str | None = None
    faculty_code: str | None = None


@router.patch("/{user_id}")
def update_user(
    user_id: int,
    body: UpdateUserRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update user details (admins only).
    - system_admin: can update any user
    - campus_admin: can update users in their campus
    - department_admin: can update faculty in their department
    """
    admin_role = get_user_role_name(current_user, db)

    if admin_role == "faculty":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Use /api/v1/profile to update your own info.")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    target_role = get_user_role_name(target, db)
    faculty = target.faculty_profile if target_role == "faculty" else None

    if admin_role == "campus_admin":
        my_campus_id = get_user_campus_id(current_user, db)
        target_campus_id = get_user_campus_id(target, db)
        if my_campus_id != target_campus_id:
            raise HTTPException(status_code=403, detail="Access denied. User belongs to another campus.")

    elif admin_role == "department_admin":
        my_dept_id = get_user_department_id(current_user, db)
        target_dept_id = get_user_department_id(target, db)
        if my_dept_id != target_dept_id or target_role != "faculty":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    old_values = {
        "full_name": target.full_name,
        "email": target.email,
        "status": target.status,
    }

    if body.full_name is not None:
        target.full_name = body.full_name.strip()
    if body.email is not None:
        clean_email = body.email.strip()
        if clean_email != target.email:
            existing = db.query(User).filter(User.email == clean_email, User.id != user_id).first()
            if existing:
                raise HTTPException(status_code=409, detail="Email already in use by another account.")
        target.email = clean_email
    if body.status is not None:
        if admin_role not in ("system_admin", "campus_admin"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Campus or System Admins can change account status.")
        target.status = body.status

    if faculty:
        if body.academic_rank is not None:
            faculty.academic_rank = body.academic_rank.strip()
        if body.highest_degree is not None:
            faculty.highest_degree = body.highest_degree.strip()
        if body.specialization is not None:
            faculty.specialization = body.specialization.strip()
        if body.faculty_code is not None:
            faculty.faculty_code = body.faculty_code.strip()

    db.commit()

    log_audit(
        db, current_user, "update_user",
        entity_type="user", entity_id=str(user_id),
        old_values=old_values,
        new_values=body.model_dump(exclude_none=True),
        ip_address=request.client.host if request.client else None,
    )

    return {"status": "success", "message": f"User {user_id} updated successfully.", "user": _user_to_out(target, db)}


class TransferFacultyRequest(BaseModel):
    target_department_id: int
    target_campus_id: int | None = None
    reason: str | None = None


@router.post("/{user_id}/transfer")
def transfer_faculty(
    user_id: int,
    body: TransferFacultyRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Transfer/reassign a faculty member to another department or campus.
    - system_admin: can transfer any faculty to any campus & department
    - campus_admin: can transfer faculty from their campus or into their campus
    - other roles: FORBIDDEN
    """
    admin_role = get_user_role_name(current_user, db)
    if admin_role not in ("system_admin", "campus_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Campus Administrators and System Administrators can transfer faculty members.",
        )

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    target_role = get_user_role_name(target_user, db)
    if target_role != "faculty" or not target_user.faculty_profile:
        raise HTTPException(status_code=400, detail="Only faculty members can be transferred between departments/campuses.")

    faculty = target_user.faculty_profile
    old_dept = faculty.department
    old_campus = old_dept.campus if old_dept else None

    # Check origin campus permissions for campus admin
    if admin_role == "campus_admin":
        my_campus_id = get_user_campus_id(current_user, db)
        if old_campus and old_campus.id != my_campus_id and body.target_campus_id != my_campus_id:
            raise HTTPException(status_code=403, detail="Campus Admins can only transfer faculty originating from or transferring into their own campus.")

    # Validate target department
    target_dept = db.query(Department).filter(Department.id == body.target_department_id).first()
    if not target_dept:
        raise HTTPException(status_code=404, detail="Target department not found.")

    if body.target_campus_id and target_dept.campus_id != body.target_campus_id:
        raise HTTPException(status_code=400, detail="Target department does not belong to the specified target campus.")

    new_campus = target_dept.campus

    old_info = {
        "campus_code": old_campus.code if old_campus else None,
        "campus_name": old_campus.name if old_campus else None,
        "department_code": old_dept.code if old_dept else None,
        "department_name": old_dept.name if old_dept else None,
    }

    new_info = {
        "campus_code": new_campus.code if new_campus else None,
        "campus_name": new_campus.name if new_campus else None,
        "department_code": target_dept.code,
        "department_name": target_dept.name,
        "reason": body.reason,
    }

    # Execute transfer
    faculty.department_id = target_dept.id

    # Update Questionnaire Part 1 department data if exists
    p1 = db.query(QuestionnairePart).filter(
        QuestionnairePart.faculty_id == faculty.id,
        QuestionnairePart.part_number == 1,
    ).first()
    if p1 and p1.data_json:
        try:
            p1_data = json.loads(p1.data_json)
            p1_data["department"] = target_dept.code
            p1.data_json = json.dumps(p1_data)
        except Exception:
            pass

    db.commit()

    log_audit(
        db, current_user, "transfer_faculty",
        entity_type="faculty", entity_id=str(faculty.id),
        old_values=old_info,
        new_values=new_info,
        ip_address=request.client.host if request.client else None,
    )

    return {
        "status": "success",
        "message": f"Faculty '{target_user.full_name or target_user.username}' successfully transferred to {new_campus.name} ({target_dept.name}).",
        "user": _user_to_out(target_user, db),
    }


class ResetPasswordRequest(BaseModel):
    new_password: str


@router.post("/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    body: ResetPasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Emergency password reset for users by administrators.
    - system_admin: can reset password for any account
    - campus_admin: can reset password for users in their campus
    - department_admin: can reset password for faculty in their department
    """
    admin_role = get_user_role_name(current_user, db)
    if admin_role == "faculty":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faculty cannot reset user passwords.")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    target_role = get_user_role_name(target, db)

    if admin_role == "campus_admin":
        my_campus_id = get_user_campus_id(current_user, db)
        target_campus_id = get_user_campus_id(target, db)
        if my_campus_id != target_campus_id:
            raise HTTPException(status_code=403, detail="Campus Admins can only reset passwords for accounts in their campus.")

    elif admin_role == "department_admin":
        my_dept_id = get_user_department_id(current_user, db)
        target_dept_id = get_user_department_id(target, db)
        if my_dept_id != target_dept_id or target_role != "faculty":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Department Admins can only reset passwords for faculty in their own department.",
            )

    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")

    target.hashed_password = hash_password(body.new_password)
    db.commit()

    log_audit(
        db, current_user, "admin_reset_password",
        entity_type="user", entity_id=str(user_id),
        new_values={"username": target.username},
        ip_address=request.client.host if request.client else None,
    )

    return {"status": "success", "message": f"Password for '{target.username}' reset successfully."}


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a user account.
    - system_admin: can delete any user except self
    - campus_admin: can delete users within their campus except self
    - department_admin: can delete faculty in their department
    """
    admin_role = get_user_role_name(current_user, db)
    if admin_role == "faculty":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faculty cannot delete accounts.")

    if current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account.")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    target_role = get_user_role_name(target, db)

    if admin_role == "campus_admin":
        my_campus_id = get_user_campus_id(current_user, db)
        target_campus_id = get_user_campus_id(target, db)
        if my_campus_id != target_campus_id:
            raise HTTPException(status_code=403, detail="Campus Admins can only delete users in their own campus.")

    elif admin_role == "department_admin":
        my_dept_id = get_user_department_id(current_user, db)
        target_dept_id = get_user_department_id(target, db)
        if my_dept_id != target_dept_id or target_role != "faculty":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Department Admins can only delete faculty accounts in their own department.",
            )

    target_username = target.username

    # Nullify audit log references so database history is preserved
    db.query(AuditLog).filter(AuditLog.user_id == user_id).update({"user_id": None})
    
    # Delete user (foreign key ondelete=CASCADE takes care of Faculty/CampusAdmin/DepartmentAdmin profiles)
    db.delete(target)
    db.commit()

    log_audit(
        db, current_user, "delete_user",
        entity_type="user", entity_id=str(user_id),
        old_values={"username": target_username, "role": target_role},
        ip_address=request.client.host if request.client else None,
    )

    return {"status": "success", "message": f"User '{target_username}' deleted successfully."}