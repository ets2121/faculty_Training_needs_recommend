"""
Campuses API — Multi-campus management endpoints for Diffun, Maddela, and Cabarroguis.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import (
    get_current_user,
    get_user_campus_id,
    get_user_role_name,
    enforce_campus_scope,
    log_audit,
)
from app.db.models import Campus, Department, Faculty, DepartmentAdmin, User
from app.db.session import get_db

router = APIRouter(prefix="/campuses", tags=["Campuses"])


class CreateDepartmentRequest(BaseModel):
    code: str
    name: str
    description: str | None = None


@router.get("")
def list_campuses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all campuses and their associated department overview.
    - system_admin: returns all campuses
    - campus_admin / dept_admin / faculty: returns all campuses or current user campus highlighted
    """
    role_name = get_user_role_name(current_user, db)
    my_campus_id = get_user_campus_id(current_user, db)

    campuses = db.query(Campus).filter(Campus.status == "active").all()
    result = []

    for c in campuses:
        depts = db.query(Department).filter(
            Department.campus_id == c.id,
            Department.status == "active",
        ).all()

        dept_list = []
        total_faculty_in_campus = 0
        for d in depts:
            fac_count = len([f for f in d.faculty_members if f.status == "active"])
            total_faculty_in_campus += fac_count
            dept_admin = db.query(DepartmentAdmin).filter(
                DepartmentAdmin.department_id == d.id,
                DepartmentAdmin.status == "active",
            ).first()

            dept_list.append({
                "id": d.id,
                "code": d.code,
                "name": d.name,
                "description": d.description,
                "faculty_count": fac_count,
                "dept_admin_name": dept_admin.user.full_name if dept_admin and dept_admin.user else None,
                "dept_admin_username": dept_admin.user.username if dept_admin and dept_admin.user else None,
            })

        result.append({
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "description": c.description,
            "status": c.status,
            "is_my_campus": c.id == my_campus_id if my_campus_id else False,
            "department_count": len(dept_list),
            "faculty_count": total_faculty_in_campus,
            "departments": dept_list,
        })

    return {"campuses": result}


@router.get("/{campus_id}")
def get_campus_details(
    campus_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get details of a specific campus."""
    role_name = get_user_role_name(current_user, db)
    if role_name in ("campus_admin", "department_admin"):
        enforce_campus_scope(current_user, campus_id, db)

    campus = db.query(Campus).filter(Campus.id == campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found.")

    depts = db.query(Department).filter(
        Department.campus_id == campus.id,
        Department.status == "active",
    ).all()

    departments_out = []
    total_faculty = 0
    total_eligible = 0
    total_has_rec = 0

    for d in depts:
        active_fac = [f for f in d.faculty_members if f.status == "active"]
        total_faculty += len(active_fac)
        total_eligible += len([f for f in active_fac if f.questionnaire_status in ("eligible", "has_recommendation")])
        total_has_rec += len([f for f in active_fac if f.questionnaire_status == "has_recommendation"])

        dept_admin = db.query(DepartmentAdmin).filter(
            DepartmentAdmin.department_id == d.id,
            DepartmentAdmin.status == "active",
        ).first()

        departments_out.append({
            "id": d.id,
            "code": d.code,
            "name": d.name,
            "description": d.description,
            "faculty_count": len(active_fac),
            "dept_admin": {
                "user_id": dept_admin.user_id if dept_admin else None,
                "full_name": dept_admin.user.full_name if dept_admin and dept_admin.user else None,
                "username": dept_admin.user.username if dept_admin and dept_admin.user else None,
            } if dept_admin else None,
        })

    return {
        "id": campus.id,
        "code": campus.code,
        "name": campus.name,
        "description": campus.description,
        "status": campus.status,
        "total_departments": len(departments_out),
        "total_faculty": total_faculty,
        "eligible_faculty": total_eligible,
        "has_recommendation_faculty": total_has_rec,
        "departments": departments_out,
    }


@router.get("/{campus_id}/departments")
def list_campus_departments(
    campus_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all departments in a campus for dropdowns and navigation."""
    campus = db.query(Campus).filter(Campus.id == campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found.")

    depts = db.query(Department).filter(
        Department.campus_id == campus.id,
        Department.status == "active",
    ).order_by(Department.name.asc()).all()

    return {
        "campus_id": campus.id,
        "campus_code": campus.code,
        "campus_name": campus.name,
        "departments": [
            {
                "id": d.id,
                "code": d.code,
                "name": d.name,
                "description": d.description,
                "faculty_count": len([f for f in d.faculty_members if f.status == "active"]),
            }
            for d in depts
        ],
    }


@router.post("/{campus_id}/departments")
def create_campus_department(
    campus_id: int,
    body: CreateDepartmentRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new department in a campus.
    - system_admin: can create in any campus
    - campus_admin: can create in their assigned campus
    - other roles: 403 FORBIDDEN
    """
    role_name = get_user_role_name(current_user, db)
    if role_name not in ("system_admin", "campus_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Campus or System Admins can add departments.")

    enforce_campus_scope(current_user, campus_id, db)

    campus = db.query(Campus).filter(Campus.id == campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found.")

    clean_code = body.code.strip().upper()
    existing = db.query(Department).filter(
        Department.campus_id == campus.id,
        Department.code == clean_code,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Department '{clean_code}' already exists in {campus.name}.",
        )

    dept = Department(
        campus_id=campus.id,
        code=clean_code,
        name=body.name.strip(),
        description=body.description.strip() if body.description else None,
        status="active",
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)

    log_audit(
        db, current_user, "create_department",
        entity_type="department", entity_id=str(dept.id),
        new_values={"campus": campus.code, "code": clean_code, "name": dept.name},
        ip_address=request.client.host if request.client else None,
    )

    return {
        "status": "success",
        "message": f"Department '{dept.code}' created in {campus.name}.",
        "department": {
            "id": dept.id,
            "campus_id": campus.id,
            "campus_code": campus.code,
            "code": dept.code,
            "name": dept.name,
            "description": dept.description,
        }
    }

class UpdateDepartmentRequest(BaseModel):
    code: str | None = None
    name: str | None = None
    description: str | None = None


@router.put("/{campus_id}/departments/{dept_id}")
def update_campus_department(
    campus_id: int,
    dept_id: int,
    body: UpdateDepartmentRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a department's code or name.
    - system_admin: any campus
    - campus_admin: their campus only
    """
    role_name = get_user_role_name(current_user, db)
    if role_name not in ("system_admin", "campus_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Campus or System Admins can update departments.")

    enforce_campus_scope(current_user, campus_id, db)

    campus = db.query(Campus).filter(Campus.id == campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found.")

    dept = db.query(Department).filter(
        Department.id == dept_id,
        Department.campus_id == campus_id,
    ).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found in this campus.")

    old_values = {"code": dept.code, "name": dept.name}

    if body.code:
        clean_code = body.code.strip().upper()
        # Check uniqueness within campus (ignore self)
        conflict = db.query(Department).filter(
            Department.campus_id == campus_id,
            Department.code == clean_code,
            Department.id != dept_id,
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Department code '{clean_code}' already exists in {campus.name}.",
            )
        dept.code = clean_code

    if body.name:
        dept.name = body.name.strip()

    if body.description is not None:
        dept.description = body.description.strip() if body.description else None

    db.commit()
    db.refresh(dept)

    log_audit(
        db, current_user, "update_department",
        entity_type="department", entity_id=str(dept.id),
        old_values=old_values,
        new_values={"code": dept.code, "name": dept.name},
        ip_address=request.client.host if request.client else None,
    )

    return {
        "status": "success",
        "message": f"Department '{dept.code}' updated successfully.",
        "department": {
            "id": dept.id,
            "campus_id": campus.id,
            "campus_code": campus.code,
            "code": dept.code,
            "name": dept.name,
            "description": dept.description,
        },
    }


@router.delete("/{campus_id}/departments/{dept_id}")
def delete_campus_department(
    campus_id: int,
    dept_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Soft-delete (deactivate) a department.
    - system_admin: any campus
    - campus_admin: their campus only
    Departments with active faculty cannot be deleted.
    """
    role_name = get_user_role_name(current_user, db)
    if role_name not in ("system_admin", "campus_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Campus or System Admins can delete departments.")

    enforce_campus_scope(current_user, campus_id, db)

    dept = db.query(Department).filter(
        Department.id == dept_id,
        Department.campus_id == campus_id,
    ).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found in this campus.")

    # Prevent deletion if department has active faculty
    active_faculty = [f for f in dept.faculty_members if f.status == "active"]
    if active_faculty:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete department '{dept.code}' — it has {len(active_faculty)} active faculty member(s). Transfer or deactivate them first.",
        )

    dept.status = "inactive"
    db.commit()

    log_audit(
        db, current_user, "delete_department",
        entity_type="department", entity_id=str(dept_id),
        old_values={"code": dept.code, "name": dept.name, "campus_id": campus_id},
        ip_address=request.client.host if request.client else None,
    )

    return {
        "status": "success",
        "message": f"Department '{dept.code}' has been deactivated.",
    }
