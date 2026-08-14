"""
Recommendations API — Authenticated endpoints for admin-driven recommendations.

RBAC:
  - faculty: FORBIDDEN (use /profile/request-recommendation)
  - department_admin: individual for their dept faculty; department for own dept
  - system_admin: individual and department for any faculty/dept

Department recommendation filters by questionnaire_status IN ('eligible', 'has_recommendation')
to ensure only faculty with validated, complete data are included.

Result is stored back on the faculty record on every successful generation.
"""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import (
    get_current_user,
    get_user_department_id,
    get_user_role_name,
    log_audit,
)
from app.db.models import Department, Faculty, RecommendationHistory, TrainingRecommendationRequest, User
from app.db.session import get_db
from app.api.questionnaire import build_faculty_record, is_eligible_for_recommendation
from app.services.recommendation import individual, department as dept_recommendation

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

# Faculty must have one of these statuses to be included in recommendations
ELIGIBLE_STATUSES = {"eligible", "has_recommendation"}


def _get_model_or_503(request: Request):
    model = getattr(request.app.state, "model", None)
    if model is None or not model.ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No trained model is active. Contact your system administrator.",
        )
    return model


def _store_individual_result(faculty: Faculty, result: dict, requested_by_user_id: int, db: Session) -> None:
    """Persist recommendation result onto the faculty record and log it."""
    now = datetime.now(timezone.utc)
    faculty.last_recommendation_json = json.dumps(result)
    faculty.last_recommendation_at = now
    faculty.questionnaire_status = "has_recommendation"

    db.add(TrainingRecommendationRequest(
        faculty_id=faculty.id,
        requested_by_user_id=requested_by_user_id,
        recommendation_type="individual",
        model_version=result.get("model", {}).get("version"),
        recommendation_json=json.dumps(result),
    ))


@router.post("/individual")
def individual_recommendation(
    request: Request,
    faculty_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate and persist an individual recommendation for a specific faculty member.

    Required query parameter: ?faculty_id=<int>

    Access:
    - system_admin: any faculty
    - department_admin: only faculty within their own department
    - faculty: 403 — use /profile/request-recommendation
    """
    role_name = get_user_role_name(current_user, db)

    if role_name == "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty members must use /api/v1/profile/request-recommendation for their own recommendations.",
        )

    target_faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not target_faculty:
        raise HTTPException(status_code=404, detail=f"Faculty with ID {faculty_id} not found.")

    if role_name == "department_admin":
        admin_dept_id = get_user_department_id(current_user, db)
        if target_faculty.department_id != admin_dept_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only generate recommendations for faculty in your own department.",
            )

    if target_faculty.questionnaire_status not in ELIGIBLE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Faculty ID {faculty_id} has questionnaire_status='{target_faculty.questionnaire_status}'. "
                f"Required: one of {sorted(ELIGIBLE_STATUSES)}. "
                f"Faculty must complete Parts 1, 2, 3, 5, and 6 first."
            ),
        )

    model = _get_model_or_503(request)
    record = build_faculty_record(faculty_id, target_faculty, db)
    result = individual(model, record, db=db)

    _store_individual_result(target_faculty, result, current_user.id, db)
    db.commit()

    log_audit(
        db, current_user, "individual_recommendation",
        entity_type="faculty", entity_id=str(faculty_id),
        new_values={"model_version": result.get("model", {}).get("version")},
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
    Generate department-level recommendations.

    Faculty included: only those with questionnaire_status IN ('eligible', 'has_recommendation').
    Individual results are stored back on each faculty record.

    Access:
    - system_admin: must provide ?department_code=<code>
    - department_admin: auto-uses their own department
    - faculty: 403
    """
    role_name = get_user_role_name(current_user, db)

    if role_name == "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty members cannot generate department recommendations.",
        )

    # Resolve department
    if role_name == "department_admin":
        dept_id = get_user_department_id(current_user, db)
        dept = db.query(Department).filter(Department.id == dept_id).first()
        if not dept:
            raise HTTPException(status_code=404, detail="Your department was not found.")
    else:
        if not department_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="department_code query parameter is required for system admins.",
            )
        dept = db.query(Department).filter(Department.code == department_code).first()
        if not dept:
            raise HTTPException(status_code=404, detail=f"Department '{department_code}' not found.")

    # Get all active faculty in the department
    all_faculty = db.query(Faculty).filter(
        Faculty.department_id == dept.id,
        Faculty.status == "active",
    ).all()

    if not all_faculty:
        raise HTTPException(
            status_code=404,
            detail=f"No active faculty found in department '{dept.code}'.",
        )

    # Filter strictly by questionnaire_status — ONLY eligible or has_recommendation
    eligible_faculty = [f for f in all_faculty if f.questionnaire_status in ELIGIBLE_STATUSES]
    skipped = [
        {"faculty_id": f.id, "questionnaire_status": f.questionnaire_status}
        for f in all_faculty if f.questionnaire_status not in ELIGIBLE_STATUSES
    ]

    if not eligible_faculty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"No eligible faculty in '{dept.code}'. "
                f"{len(all_faculty)} faculty found but none have completed the required questionnaire parts. "
                f"Faculty must have questionnaire_status of 'eligible' or 'has_recommendation'."
            ),
        )

    # Build records and run recommendation
    records = [build_faculty_record(f.id, f, db) for f in eligible_faculty]
    model = _get_model_or_503(request)
    result = dept_recommendation(model, records, dept_name=dept.code, db=db)

    # Run and store individual results for each eligible faculty
    individual_results_stored = 0
    for faculty_obj in eligible_faculty:
        try:
            ind_result = individual(model, build_faculty_record(faculty_obj.id, faculty_obj, db), db=None)
            _store_individual_result(faculty_obj, ind_result, current_user.id, db)
            individual_results_stored += 1
        except Exception:
            pass  # Don't fail the whole request for one faculty's individual result

    db.commit()

    # Attach metadata to response (generated_at is already set by the service)
    result["department_name"] = dept.name
    result["total_faculty_in_dept"] = len(all_faculty)
    result["eligible_faculty_count"] = len(eligible_faculty)
    result["skipped_faculty"] = skipped
    result["individual_results_stored"] = individual_results_stored
    if "generated_at" not in result:
        result["generated_at"] = datetime.now(timezone.utc).isoformat()

    # Persist department recommendation to history
    db.add(RecommendationHistory(
        department_id=dept.id,
        recommendation_type="department",
        model_version=result.get("model", {}).get("version"),
        response_json=json.dumps(result),
    ))
    db.commit()

    log_audit(
        db, current_user, "department_recommendation",
        entity_type="department", entity_id=str(dept.id),
        new_values={
            "department": dept.code,
            "eligible": len(eligible_faculty),
            "skipped": len(skipped),
        },
        ip_address=request.client.host if request.client else None,
    )

    return result


@router.get("/department/last")
def get_department_last_recommendation(
    department_code: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve the most recent stored department-level recommendation.
    """
    role_name = get_user_role_name(current_user, db)
    if role_name == "faculty":
        raise HTTPException(status_code=403, detail="Faculty cannot view department recommendations.")

    if role_name == "department_admin":
        dept_id = get_user_department_id(current_user, db)
        dept = db.query(Department).filter(Department.id == dept_id).first()
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found.")
    else:
        if not department_code:
            raise HTTPException(status_code=400, detail="department_code is required for system admins.")
        dept = db.query(Department).filter(Department.code == department_code).first()
        if not dept:
            raise HTTPException(status_code=404, detail=f"Department '{department_code}' not found.")

    # Primary: match by department_id (new records)
    last_hist = (
        db.query(RecommendationHistory)
        .filter(
            RecommendationHistory.department_id == dept.id,
            RecommendationHistory.recommendation_type == "department",
        )
        .order_by(RecommendationHistory.created_at.desc())
        .first()
    )

    # Fallback: old records stored before department_id tracking — match by code in response_json
    if not last_hist:
        candidates = (
            db.query(RecommendationHistory)
            .filter(
                RecommendationHistory.recommendation_type == "department",
                RecommendationHistory.department_id.is_(None),
            )
            .order_by(RecommendationHistory.created_at.desc())
            .all()
        )
        for candidate in candidates:
            if candidate.response_json:
                try:
                    payload = json.loads(candidate.response_json)
                    if payload.get("department") == dept.code:
                        last_hist = candidate
                        # Backfill department_id so future queries use the fast path
                        candidate.department_id = dept.id
                        db.commit()
                        break
                except Exception:
                    continue

    if not last_hist or not last_hist.response_json:
        return {
            "has_recommendation": False,
            "department": dept.code,
            "department_name": dept.name,
            "message": "No department recommendation has been generated yet.",
        }

    try:
        data = json.loads(last_hist.response_json)
        if isinstance(data, dict):
            data["has_recommendation"] = True
            if "generated_at" not in data and last_hist.created_at:
                data["generated_at"] = last_hist.created_at.isoformat()
            # Ensure department_name is always present
            if "department_name" not in data:
                data["department_name"] = dept.name
            return data
    except Exception:
        pass

    return {
        "has_recommendation": False,
        "department": dept.code,
        "department_name": dept.name,
    }


# ─── Faculty: Get last stored recommendation for a specific faculty (admin use) ──

@router.get("/faculty/{faculty_id}/last")
def get_faculty_last_recommendation(
    faculty_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve the most recent stored recommendation for a specific faculty member.
    Useful for dept admin dashboards showing per-faculty recommendation status.

    Access:
    - system_admin: any faculty
    - department_admin: only their own dept faculty
    - faculty: 403
    """
    role_name = get_user_role_name(current_user, db)
    if role_name == "faculty":
        raise HTTPException(status_code=403, detail="Use /api/v1/profile/last-recommendation instead.")

    target = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Faculty not found.")

    if role_name == "department_admin":
        my_dept = get_user_department_id(current_user, db)
        if target.department_id != my_dept:
            raise HTTPException(status_code=403, detail="Access denied.")

    dept = db.query(Department).filter(Department.id == target.department_id).first()
    user = target.user

    return {
        "faculty_id": target.id,
        "faculty_name": user.full_name if user else None,
        "department": dept.code if dept else None,
        "questionnaire_status": target.questionnaire_status,
        "last_recommendation_at": (
            target.last_recommendation_at.isoformat()
            if target.last_recommendation_at else None
        ),
        "recommendation": (
            json.loads(target.last_recommendation_json)
            if target.last_recommendation_json else None
        ),
    }
