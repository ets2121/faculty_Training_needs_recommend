"""
Faculty Profile API — Faculty can view/update their own profile and request recommendations.
All endpoints are FACULTY-ONLY.
"""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user, get_user_role_name, log_audit
from app.db.models import (
    Department, Faculty, TrainingRecommendationRequest, User
)
from app.db.session import get_db
from app.api.questionnaire import (
    _get_faculty_or_403,
    build_faculty_record,
    is_eligible_for_recommendation,
    _get_completed_parts,
    PART_LABELS,
    REQUIRED_PARTS,
    TOTAL_PARTS,
)

router = APIRouter(prefix="/profile", tags=["Faculty Profile"])


class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    email: str | None = None
    academic_rank: str | None = None
    specialization: str | None = None
    highest_degree: str | None = None


@router.get("")
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current faculty member's full profile including questionnaire progress summary."""
    faculty = _get_faculty_or_403(current_user, db)
    dept = db.query(Department).filter(Department.id == faculty.department_id).first()
    completed = _get_completed_parts(faculty.id, db)

    completed_required = sum(1 for p in REQUIRED_PARTS if completed.get(p, False))
    completed_total = sum(1 for p in range(1, TOTAL_PARTS + 1) if completed.get(p, False))

    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "status": current_user.status,
        },
        "faculty_profile": {
            "faculty_id": faculty.id,
            "faculty_code": faculty.faculty_code,
            "academic_rank": faculty.academic_rank,
            "highest_degree": faculty.highest_degree,
            "specialization": faculty.specialization,
            "department": {
                "code": dept.code if dept else None,
                "name": dept.name if dept else None,
            },
        },
        "questionnaire_progress": {
            "questionnaire_status": faculty.questionnaire_status,
            "eligible_for_recommendation": faculty.questionnaire_status in ("eligible", "has_recommendation"),
            "has_existing_recommendation": faculty.questionnaire_status == "has_recommendation",
            "last_recommendation_at": (
                faculty.last_recommendation_at.isoformat() + '+08:00'
                if faculty.last_recommendation_at else None
            ),
            "required_parts_completed": f"{completed_required}/{len(REQUIRED_PARTS)}",
            "total_parts_completed": f"{completed_total}/{TOTAL_PARTS}",
            "parts_status": {
                PART_LABELS[i]: (
                    "complete" if completed.get(i, False) else "not_completed"
                )
                for i in range(1, TOTAL_PARTS + 1)
            },
        },
    }


@router.patch("")
def update_my_profile(
    body: UpdateProfileRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update your own profile information (name, email, academic info)."""
    faculty = _get_faculty_or_403(current_user, db)
    old_values = {
        "full_name": current_user.full_name,
        "email": current_user.email,
        "academic_rank": faculty.academic_rank,
        "specialization": faculty.specialization,
        "highest_degree": faculty.highest_degree,
    }

    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.email is not None:
        current_user.email = body.email
    if body.academic_rank is not None:
        faculty.academic_rank = body.academic_rank
    if body.specialization is not None:
        faculty.specialization = body.specialization
    if body.highest_degree is not None:
        faculty.highest_degree = body.highest_degree

    db.commit()

    log_audit(
        db, current_user, "update_profile",
        entity_type="faculty",
        entity_id=str(faculty.id),
        old_values=old_values,
        new_values=body.model_dump(exclude_none=True),
        ip_address=request.client.host if request.client else None,
    )

    return {"status": "success", "message": "Profile updated successfully."}


@router.post("/request-recommendation")
def request_my_recommendation(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Request an individual training recommendation using saved questionnaire data.
    Requires Parts 1, 2, 3, 5, and 6 to be complete.

    On success:
    - Stores result in training_recommendation_requests table
    - Updates faculty.last_recommendation_json with the full result
    - Updates faculty.last_recommendation_at with the timestamp
    - Sets faculty.questionnaire_status = 'has_recommendation'
    """
    from app.ml.predictor import ModelService
    from app.core.config import get_settings
    from app.services.recommendation import individual

    faculty = _get_faculty_or_403(current_user, db)

    if not is_eligible_for_recommendation(faculty.id, db):
        completed = _get_completed_parts(faculty.id, db)
        missing = [PART_LABELS[p] for p in REQUIRED_PARTS if not completed.get(p, False)]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Please complete the following questionnaire parts first: {missing}",
        )

    settings = get_settings()
    model = ModelService(settings.model_dir)
    if not model.ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No trained model is currently active. Please contact your administrator.",
        )

    record = build_faculty_record(faculty.id, faculty, db)
    from datetime import datetime
    import zoneinfo
    generated_at = datetime.now(zoneinfo.ZoneInfo("Asia/Manila")).isoformat()
    result = individual(model, record, db=db, generated_at=generated_at)

    # Store result in recommendation requests log
    rec_request = TrainingRecommendationRequest(
        faculty_id=faculty.id,
        requested_by_user_id=current_user.id,
        recommendation_type="individual",
        model_version=result.get("model", {}).get("version"),
        recommendation_json=json.dumps(result),
    )
    db.add(rec_request)

    # Update faculty record with latest recommendation result and status
    faculty.last_recommendation_json = json.dumps(result)
    faculty.last_recommendation_at = datetime.fromisoformat(result["generated_at"]).replace(tzinfo=None) if result.get("generated_at") else None
    faculty.questionnaire_status = "has_recommendation"

    db.commit()

    log_audit(
        db, current_user, "request_recommendation",
        entity_type="faculty",
        entity_id=str(faculty.id),
        new_values={"recommendation_id": rec_request.id, "model_version": rec_request.model_version},
        ip_address=request.client.host if request.client else None,
    )

    return result


@router.get("/recommendation-history")
def get_recommendation_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """View your past training recommendation requests."""
    faculty = _get_faculty_or_403(current_user, db)
    history = (
        db.query(TrainingRecommendationRequest)
        .filter(TrainingRecommendationRequest.faculty_id == faculty.id)
        .order_by(TrainingRecommendationRequest.created_at.desc())
        .limit(20)
        .all()
    )

    return {
        "faculty_id": faculty.id,
        "questionnaire_status": faculty.questionnaire_status,
        "total": len(history),
        "history": [
            {
                "id": h.id,
                "recommendation_type": h.recommendation_type,
                "model_version": h.model_version,
                "created_at": h.created_at.isoformat(),
                "recommendation": json.loads(h.recommendation_json) if h.recommendation_json else None,
            }
            for h in history
        ],
    }


@router.get("/last-recommendation")
def get_last_recommendation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Quickly retrieve the most recent recommendation stored on the faculty record.
    Returns null if no recommendation has been generated yet.
    """
    faculty = _get_faculty_or_403(current_user, db)

    if not faculty.last_recommendation_json:
        return {
            "faculty_id": faculty.id,
            "questionnaire_status": faculty.questionnaire_status,
            "recommendation": None,
            "message": "No recommendation generated yet. Complete the questionnaire and request one.",
        }

    return {
        "faculty_id": faculty.id,
        "questionnaire_status": faculty.questionnaire_status,
        "last_recommendation_at": (
            faculty.last_recommendation_at.isoformat() + '+08:00'
            if faculty.last_recommendation_at else None
        ),
        "recommendation": json.loads(faculty.last_recommendation_json),
    }
