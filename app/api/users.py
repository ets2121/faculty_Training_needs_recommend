"""
Users Management API:
- system_admin: full access to all users
- department_admin: access only to faculty within their department
- faculty: FORBIDDEN (use /profile instead)
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import (
    get_current_user,
    get_user_department_id,
    get_user_role_name,
    log_audit,
)
from app.db.models import Department, DepartmentAdmin, Faculty, QuestionnairePart, Role, User
from app.db.session import get_db
from app.api.questionnaire import (
    PART_LABELS,
    REQUIRED_PARTS,
    TOTAL_PARTS,
    is_eligible_for_recommendation,
)

router = APIRouter(prefix="/users", tags=["Users Management"])


def _user_to_out(user: User, db: Session) -> dict:
    from app.core.security import get_user_department_id, get_user_role_name
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
        "department_name": dept.name if dept else None,
        "status": user.status,
    }


@router.get("")
def list_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List users scoped by role:
    - system_admin: all users
    - department_admin: only faculty users in their department
    - faculty: FORBIDDEN — use /api/v1/profile instead
    """
    role_name = get_user_role_name(current_user, db)

    if role_name == "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty members cannot list users. Use /api/v1/profile for your own info.",
        )

    if role_name == "system_admin":
        users = db.query(User).all()
    else:
        # department_admin: only faculty in their dept
        dept_id = get_user_department_id(current_user, db)
        faculty_user_ids = [
            f.user_id for f in db.query(Faculty)
            .filter(Faculty.department_id == dept_id).all()
        ]
        users = db.query(User).filter(User.id.in_(faculty_user_ids)).all() if faculty_user_ids else []

    return {"users": [_user_to_out(u, db) for u in users]}


@router.get("/{user_id}")
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a user by ID.
    - system_admin: any user
    - department_admin: only faculty in their department
    - faculty: FORBIDDEN
    """
    role_name = get_user_role_name(current_user, db)

    if role_name == "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Use /api/v1/profile for your own profile.",
        )

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    if role_name == "department_admin":
        my_dept_id = get_user_department_id(current_user, db)
        target_dept_id = get_user_department_id(target, db)
        if my_dept_id != target_dept_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return _user_to_out(target, db)


@router.get("/{user_id}/questionnaire-status")
def get_user_questionnaire_status(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a faculty user's questionnaire completion status.
    Only accessible by department_admin (own dept) and system_admin.
    """
    role_name = get_user_role_name(current_user, db)
    if role_name == "faculty":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Use /api/v1/questionnaire/progress instead.")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    faculty = db.query(Faculty).filter(Faculty.user_id == user_id).first()
    if not faculty:
        raise HTTPException(status_code=400, detail="User is not a faculty member.")

    if role_name == "department_admin":
        my_dept_id = get_user_department_id(current_user, db)
        if faculty.department_id != my_dept_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    parts = db.query(QuestionnairePart).filter(QuestionnairePart.faculty_id == faculty.id).all()
    part_map = {p.part_number: p for p in parts}
    completed_required = sum(1 for p in REQUIRED_PARTS if part_map.get(p) and part_map[p].is_complete)
    completed_total = sum(1 for p in range(1, TOTAL_PARTS + 1) if part_map.get(p) and part_map[p].is_complete)

    return {
        "user_id": user_id,
        "faculty_id": faculty.id,
        "username": target_user.username,
        "full_name": target_user.full_name,
        "eligible_for_recommendation": is_eligible_for_recommendation(faculty.id, db),
        "required_parts_completed": f"{completed_required}/{len(REQUIRED_PARTS)}",
        "total_parts_completed": f"{completed_total}/{TOTAL_PARTS}",
        "parts": [
            {
                "part_number": i,
                "label": PART_LABELS[i],
                "required": i in REQUIRED_PARTS,
                "status": "complete" if (part_map.get(i) and part_map[i].is_complete) else
                          "in_progress" if part_map.get(i) else "not_started",
            }
            for i in range(1, TOTAL_PARTS + 1)
        ],
    }


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
    """
    Update user details (admins only).
    - system_admin: can update any user including status
    - department_admin: can update faculty in their dept (cannot change status for now)
    - faculty: FORBIDDEN — use /api/v1/profile instead
    """
    role_name = get_user_role_name(current_user, db)

    if role_name == "faculty":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Use /api/v1/profile to update your own info.")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    if role_name == "department_admin":
        my_dept_id = get_user_department_id(current_user, db)
        target_dept_id = get_user_department_id(target, db)
        if my_dept_id != target_dept_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    old_values = {"full_name": target.full_name, "email": target.email, "status": target.status}

    if body.full_name is not None:
        target.full_name = body.full_name
    if body.email is not None:
        target.email = body.email
    if body.status is not None:
        if role_name != "system_admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only system admins can change account status.")
        target.status = body.status

    db.commit()

    log_audit(db, current_user, "update_user", entity_type="user", entity_id=str(user_id),
              old_values=old_values,
              new_values={"full_name": target.full_name, "email": target.email, "status": target.status},
              ip_address=request.client.host if request.client else None)

    return {"status": "success", "message": f"User {user_id} updated."}
