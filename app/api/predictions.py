"""
Recommendations API — Authenticated endpoints for admin-driven recommendations.

RBAC:
  - faculty: FORBIDDEN (use /profile/request-recommendation)
  - department_admin: individual for their dept faculty; department for own dept
  - campus_admin: individual and department for campus faculty/depts; campus aggregated recommendation
  - system_admin: unrestricted individual, department, and campus recommendations

Department recommendation filters by questionnaire_status IN ('eligible', 'has_recommendation')
to ensure only faculty with validated, complete data are included.

Result is stored back on the faculty record on every successful generation.
"""
import json
from datetime import datetime, timezone
import zoneinfo

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import (
    get_current_user,
    get_user_campus_id,
    get_user_department_id,
    get_user_role_name,
    log_audit,
)
from app.db.models import Campus, Department, Faculty, RecommendationHistory, TrainingRecommendationRequest, User
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
    now = datetime.now(zoneinfo.ZoneInfo("Asia/Manila")).replace(tzinfo=None)
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

    if role_name == "campus_admin":
        my_campus_id = get_user_campus_id(current_user, db)
        fac_campus_id = target_faculty.department.campus_id if target_faculty.department else None
        if fac_campus_id != my_campus_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only generate recommendations for faculty in your own campus.",
            )

    elif role_name == "department_admin":
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
    generated_at = datetime.now(zoneinfo.ZoneInfo("Asia/Manila")).isoformat()
    result = individual(model, record, db=db, generated_at=generated_at)

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
    department_id: int | None = None,
    department_code: str | None = None,
    campus_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate department-level recommendations.
    """
    role_name = get_user_role_name(current_user, db)

    if role_name == "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty members cannot generate department recommendations.",
        )

    dept = None

    if role_name == "department_admin":
        dept_id = get_user_department_id(current_user, db)
        dept = db.query(Department).filter(Department.id == dept_id).first()
        if not dept:
            raise HTTPException(status_code=404, detail="Your department was not found.")

    elif role_name == "campus_admin":
        my_campus_id = get_user_campus_id(current_user, db)
        if department_id:
            dept = db.query(Department).filter(Department.id == department_id, Department.campus_id == my_campus_id).first()
        elif department_code:
            dept = db.query(Department).filter(Department.code == department_code.strip().upper(), Department.campus_id == my_campus_id).first()
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found in your campus.")

    elif role_name == "system_admin":
        if department_id:
            dept = db.query(Department).filter(Department.id == department_id).first()
        elif department_code:
            q = db.query(Department).filter(Department.code == department_code.strip().upper())
            if campus_id:
                q = q.filter(Department.campus_id == campus_id)
            dept = q.first()
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found.")

    # Get all active faculty in the department
    all_faculty = db.query(Faculty).filter(
        Faculty.department_id == dept.id,
        Faculty.status == "active",
    ).all()

    if not all_faculty:
        raise HTTPException(
            status_code=404,
            detail=f"No active faculty found in department '{dept.code}' ({dept.campus.name if dept.campus else ''}).",
        )

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
                f"{len(all_faculty)} faculty found but none have completed the required questionnaire parts."
            ),
        )

    records = [build_faculty_record(f.id, f, db) for f in eligible_faculty]
    model = _get_model_or_503(request)
    generated_at = datetime.now(zoneinfo.ZoneInfo("Asia/Manila")).isoformat()
    result = dept_recommendation(model, records, dept_name=dept.code, db=db, generated_at=generated_at)

    # Store individual results for each eligible faculty
    individual_results_stored = 0
    for faculty_obj in eligible_faculty:
        try:
            ind_result = individual(model, build_faculty_record(faculty_obj.id, faculty_obj, db), db=None, generated_at=generated_at)
            _store_individual_result(faculty_obj, ind_result, current_user.id, db)
            individual_results_stored += 1
        except Exception:
            pass

    db.commit()

    # Attach metadata to response
    result["department_id"] = dept.id
    result["department_name"] = dept.name
    result["campus_id"] = dept.campus_id
    result["campus_code"] = dept.campus.code if dept.campus else None
    result["campus_name"] = dept.campus.name if dept.campus else None
    result["total_faculty_in_dept"] = len(all_faculty)
    result["eligible_faculty_count"] = len(eligible_faculty)
    result["skipped_faculty"] = skipped
    result["individual_results_stored"] = individual_results_stored
    result["generated_at"] = generated_at

    # Persist department recommendation to history
    db.add(RecommendationHistory(
        campus_id=dept.campus_id,
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
            "campus": dept.campus.code if dept.campus else None,
            "department": dept.code,
            "eligible": len(eligible_faculty),
            "skipped": len(skipped),
        },
        ip_address=request.client.host if request.client else None,
    )

    return result


@router.get("/department/last")
def get_department_last_recommendation(
    department_id: int | None = None,
    department_code: str | None = None,
    campus_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve the most recent stored department-level recommendation.
    """
    role_name = get_user_role_name(current_user, db)
    if role_name == "faculty":
        raise HTTPException(status_code=403, detail="Faculty cannot view department recommendations.")

    dept = None

    if role_name == "department_admin":
        my_dept_id = get_user_department_id(current_user, db)
        dept = db.query(Department).filter(Department.id == my_dept_id).first()

    elif role_name == "campus_admin":
        my_campus_id = get_user_campus_id(current_user, db)
        if department_id:
            dept = db.query(Department).filter(Department.id == department_id, Department.campus_id == my_campus_id).first()
        elif department_code:
            dept = db.query(Department).filter(Department.code == department_code.strip().upper(), Department.campus_id == my_campus_id).first()
        else:
            # First department in campus if none specified
            dept = db.query(Department).filter(Department.campus_id == my_campus_id).first()

    elif role_name == "system_admin":
        if department_id:
            dept = db.query(Department).filter(Department.id == department_id).first()
        elif department_code:
            q = db.query(Department).filter(Department.code == department_code.strip().upper())
            if campus_id:
                q = q.filter(Department.campus_id == campus_id)
            dept = q.first()

    if not dept:
        return {"has_recommendation": False, "message": "No department found."}

    last_hist = (
        db.query(RecommendationHistory)
        .filter(
            RecommendationHistory.department_id == dept.id,
            RecommendationHistory.recommendation_type == "department",
        )
        .order_by(RecommendationHistory.created_at.desc())
        .first()
    )

    if not last_hist or not last_hist.response_json:
        return {
            "has_recommendation": False,
            "department_id": dept.id,
            "department": dept.code,
            "department_name": dept.name,
            "campus_code": dept.campus.code if dept.campus else None,
            "campus_name": dept.campus.name if dept.campus else None,
            "message": "No department recommendation has been generated yet.",
        }

    try:
        data = json.loads(last_hist.response_json)
        if isinstance(data, dict):
            data["has_recommendation"] = True
            if "generated_at" not in data and last_hist.created_at:
                data["generated_at"] = last_hist.created_at.isoformat() + "+08:00"
            data["department_name"] = dept.name
            data["campus_name"] = dept.campus.name if dept.campus else None
            data["campus_code"] = dept.campus.code if dept.campus else None
            return data
    except Exception:
        pass

    return {
        "has_recommendation": False,
        "department_id": dept.id,
        "department": dept.code,
        "department_name": dept.name,
    }


# ─── Campus-Level Aggregated Recommendations (Campus Admin & System Admin) ────



@router.get("/department/history")
def get_department_recommendation_history(
    department_id: int | None = None,
    campus_id: int | None = None,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve historical stored department-level recommendations.
    """
    role_name = get_user_role_name(current_user, db)
    if role_name == "faculty":
        raise HTTPException(status_code=403, detail="Faculty cannot view department recommendation history.")

    query = db.query(RecommendationHistory).filter(RecommendationHistory.recommendation_type == "department")

    if role_name == "department_admin":
        my_dept_id = get_user_department_id(current_user, db)
        query = query.filter(RecommendationHistory.department_id == my_dept_id)
    elif role_name == "campus_admin":
        my_campus_id = get_user_campus_id(current_user, db)
        query = query.filter(RecommendationHistory.campus_id == my_campus_id)
        if department_id:
            query = query.filter(RecommendationHistory.department_id == department_id)
    elif role_name == "system_admin":
        if campus_id:
            query = query.filter(RecommendationHistory.campus_id == campus_id)
        if department_id:
            query = query.filter(RecommendationHistory.department_id == department_id)

    records = query.order_by(RecommendationHistory.created_at.desc()).limit(limit).all()
    results = []
    for r in records:
        if r.response_json:
            try:
                item = json.loads(r.response_json)
                if isinstance(item, dict):
                    if "generated_at" not in item and r.created_at:
                        item["generated_at"] = r.created_at.isoformat() + "+08:00"
                    results.append(item)
            except Exception:
                continue
    return results


@router.post("/campus")
def campus_recommendation(
    request: Request,
    campus_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate campus-level aggregated recommendations across all departments in the campus.
    """
    role_name = get_user_role_name(current_user, db)
    if role_name not in ("system_admin", "campus_admin"):
        raise HTTPException(status_code=403, detail="Only Campus and System Admins can generate campus-wide recommendations.")

    target_campus_id = campus_id
    if role_name == "campus_admin":
        target_campus_id = get_user_campus_id(current_user, db)

    if not target_campus_id:
        raise HTTPException(status_code=400, detail="campus_id is required.")

    campus = db.query(Campus).filter(Campus.id == target_campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found.")

    # Gather all eligible faculty across all departments of this campus
    departments = db.query(Department).filter(Department.campus_id == campus.id, Department.status == "active").all()
    dept_ids = [d.id for d in departments]

    all_faculty = db.query(Faculty).filter(Faculty.department_id.in_(dept_ids), Faculty.status == "active").all()
    eligible_faculty = [f for f in all_faculty if f.questionnaire_status in ELIGIBLE_STATUSES]

    if not eligible_faculty:
        raise HTTPException(
            status_code=400,
            detail=f"No eligible faculty found across {len(departments)} departments in {campus.name}."
        )

    records = [build_faculty_record(f.id, f, db) for f in eligible_faculty]
    model = _get_model_or_503(request)
    generated_at = datetime.now(zoneinfo.ZoneInfo("Asia/Manila")).isoformat()
    result = dept_recommendation(model, records, dept_name=campus.code, db=db, generated_at=generated_at)

    result["campus_id"] = campus.id
    result["campus_code"] = campus.code
    result["campus_name"] = campus.name
    result["total_departments"] = len(departments)
    result["total_faculty_in_campus"] = len(all_faculty)
    result["eligible_faculty_count"] = len(eligible_faculty)
    result["generated_at"] = generated_at

    db.add(RecommendationHistory(
        campus_id=campus.id,
        recommendation_type="campus",
        model_version=result.get("model", {}).get("version"),
        response_json=json.dumps(result),
    ))
    db.commit()

    log_audit(
        db, current_user, "campus_recommendation",
        entity_type="campus", entity_id=str(campus.id),
        new_values={"campus": campus.code, "eligible": len(eligible_faculty)},
        ip_address=request.client.host if request.client else None,
    )

    return result


@router.get("/faculty/{faculty_id}/last")
def get_faculty_last_recommendation(
    faculty_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve the most recent stored recommendation for a specific faculty member.
    """
    role_name = get_user_role_name(current_user, db)
    if role_name == "faculty":
        raise HTTPException(status_code=403, detail="Use /api/v1/profile/last-recommendation instead.")

    target = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Faculty not found.")

    if role_name == "campus_admin":
        my_campus_id = get_user_campus_id(current_user, db)
        fac_campus_id = target.department.campus_id if target.department else None
        if fac_campus_id != my_campus_id:
            raise HTTPException(status_code=403, detail="Access denied. Faculty belongs to another campus.")

    elif role_name == "department_admin":
        my_dept = get_user_department_id(current_user, db)
        if target.department_id != my_dept:
            raise HTTPException(status_code=403, detail="Access denied.")

    dept = db.query(Department).filter(Department.id == target.department_id).first()
    user = target.user

    return {
        "faculty_id": target.id,
        "faculty_name": user.full_name if user else None,
        "campus": dept.campus.name if dept and dept.campus else None,
        "department": dept.code if dept else None,
        "questionnaire_status": target.questionnaire_status,
        "last_recommendation_at": (
            target.last_recommendation_at.isoformat() + "+08:00"
            if target.last_recommendation_at else None
        ),
        "recommendation": (
            json.loads(target.last_recommendation_json)
            if target.last_recommendation_json else None
        ),
    }

@router.get("/campus/last")
def get_campus_last_recommendation(
    campus_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve the most recent stored campus-level recommendation.
    """
    role_name = get_user_role_name(current_user, db)
    if role_name not in ("system_admin", "campus_admin"):
        raise HTTPException(status_code=403, detail="Only Campus and System Admins can view campus recommendations.")

    target_campus_id = campus_id
    if role_name == "campus_admin":
        target_campus_id = get_user_campus_id(current_user, db)

    if not target_campus_id:
        target_campus_id = 1

    last_hist = (
        db.query(RecommendationHistory)
        .filter(
            RecommendationHistory.campus_id == target_campus_id,
            RecommendationHistory.recommendation_type == "campus",
        )
        .order_by(RecommendationHistory.created_at.desc())
        .first()
    )

    if not last_hist or not last_hist.response_json:
        return {"has_recommendation": False, "message": "No campus recommendation has been generated yet."}

    try:
        data = json.loads(last_hist.response_json)
        if isinstance(data, dict):
            data["has_recommendation"] = True
            if "generated_at" not in data and last_hist.created_at:
                data["generated_at"] = last_hist.created_at.isoformat() + "+08:00"
            return data
    except Exception:
        pass

    return {"has_recommendation": False, "message": "Failed to parse stored recommendation."}


@router.get("/campus/history")
def get_campus_recommendation_history(
    campus_id: int | None = None,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve historical stored campus-level recommendations.
    """
    role_name = get_user_role_name(current_user, db)
    if role_name not in ("system_admin", "campus_admin"):
        raise HTTPException(status_code=403, detail="Only Campus and System Admins can view campus recommendations.")

    target_campus_id = campus_id
    if role_name == "campus_admin":
        target_campus_id = get_user_campus_id(current_user, db)

    query = db.query(RecommendationHistory).filter(RecommendationHistory.recommendation_type == "campus")
    if target_campus_id:
        query = query.filter(RecommendationHistory.campus_id == target_campus_id)

    records = query.order_by(RecommendationHistory.created_at.desc()).limit(limit).all()
    results = []
    for r in records:
        if r.response_json:
            try:
                item = json.loads(r.response_json)
                if isinstance(item, dict):
                    if "generated_at" not in item and r.created_at:
                        item["generated_at"] = r.created_at.isoformat() + "+08:00"
                    results.append(item)
            except Exception:
                continue
    return results
