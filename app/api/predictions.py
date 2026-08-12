"""
Recommendations API — All endpoints require JWT authentication.

RBAC:
  - faculty: cannot call this API directly (use /profile/request-recommendation)
  - department_admin: can only call /recommendations/department for their own department
  - system_admin: can call both /recommendations/individual and /recommendations/department
"""
import json
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import (
    get_current_user,
    get_user_department_id,
    get_user_role_name,
    log_audit,
)
from app.db.models import Department, Faculty, User
from app.db.session import get_db
from app.api.questionnaire import (
    build_faculty_record,
    is_eligible_for_recommendation,
)
from app.services.recommendation import individual, department as dept_recommendation

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


def _get_model_or_503(request: Request):
    """Get the active model from app state or raise 503."""
    model = getattr(request.app.state, "model", None)
    if model is None or not model.ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No trained model is active. Contact your system administrator.",
        )
    return model


@router.post("/individual")
def individual_recommendation(
    request: Request,
    faculty_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate individual recommendation for a faculty member using their saved questionnaire.

    - system_admin: can specify any faculty_id
    - department_admin: can specify a faculty_id within their own department
    - faculty: FORBIDDEN — use /profile/request-recommendation instead

    faculty_id is passed as a query parameter.
    """
    role_name = get_user_role_name(current_user, db)

    if role_name == "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty members must use /api/v1/profile/request-recommendation for their own recommendations.",
        )

    if faculty_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="faculty_id query parameter is required.",
        )

    target_faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not target_faculty:
        raise HTTPException(status_code=404, detail="Faculty not found.")

    # Department admin scope check
    if role_name == "department_admin":
        admin_dept_id = get_user_department_id(current_user, db)
        if target_faculty.department_id != admin_dept_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only generate recommendations for faculty in your own department.",
            )

    if not is_eligible_for_recommendation(faculty_id, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Faculty ID {faculty_id} has not completed the minimum questionnaire requirements (Parts 1, 2, 3, 5, 6).",
        )

    model = _get_model_or_503(request)
    record = build_faculty_record(faculty_id, target_faculty, db)
    result = individual(model, record, db=db)

    log_audit(
        db, current_user, "individual_recommendation",
        entity_type="faculty",
        entity_id=str(faculty_id),
        ip_address=request.client.host if request.client else None,
    )

    return result


@router.post("/department")
def department_recommendation(
    request: Request,
    department_code: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate department-level recommendations from ALL eligible faculty in the department.

    - system_admin: can specify any department_code
    - department_admin: auto-uses their own department (department_code ignored)
    - faculty: FORBIDDEN

    Eligibility: Only faculty who have completed Parts 1, 2, 3, 5, 6 are included.
    """
    role_name = get_user_role_name(current_user, db)

    if role_name == "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty members cannot generate department recommendations.",
        )

    # Determine target department
    if role_name == "department_admin":
        dept_id = get_user_department_id(current_user, db)
        dept = db.query(Department).filter(Department.id == dept_id).first()
        if not dept:
            raise HTTPException(status_code=404, detail="Your department was not found.")
    else:
        # system_admin must specify department_code
        if not department_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="department_code query parameter is required for system admins.",
            )
        dept = db.query(Department).filter(Department.code == department_code).first()
        if not dept:
            raise HTTPException(status_code=404, detail=f"Department '{department_code}' not found.")

    # Collect all faculty in the department
    all_faculty = db.query(Faculty).filter(
        Faculty.department_id == dept.id,
        Faculty.status == "active",
    ).all()

    if not all_faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active faculty found in department '{dept.code}'.",
        )

    # Filter to only eligible faculty (completed minimum questionnaire requirements)
    eligible_faculty = [f for f in all_faculty if is_eligible_for_recommendation(f.id, db)]
    skipped_count = len(all_faculty) - len(eligible_faculty)

    if not eligible_faculty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"No faculty in '{dept.code}' have completed the minimum questionnaire requirements "
                f"(Parts 1, 2, 3, 5, 6). {len(all_faculty)} faculty member(s) found but none are eligible yet."
            ),
        )

    # Build records from DB
    records = [build_faculty_record(f.id, f, db) for f in eligible_faculty]

    model = _get_model_or_503(request)
    result = dept_recommendation(model, records, dept_name=dept.code, db=db)

    # Add eligibility metadata to response
    result["department_name"] = dept.name
    result["total_faculty_in_dept"] = len(all_faculty)
    result["eligible_faculty_count"] = len(eligible_faculty)
    result["skipped_incomplete_count"] = skipped_count

    log_audit(
        db, current_user, "department_recommendation",
        entity_type="department",
        entity_id=str(dept.id),
        new_values={
            "department": dept.code,
            "eligible": len(eligible_faculty),
            "skipped": skipped_count,
        },
        ip_address=request.client.host if request.client else None,
    )

    return result
