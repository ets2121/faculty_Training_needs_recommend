"""
Test Recommendations API — No authentication required.

These endpoints are for development and testing ONLY.
They accept a raw faculty data payload (same schema as production)
and return recommendation results without requiring a JWT token.

Disable these in production by setting ENABLE_TEST_ENDPOINTS=false in .env

Routes:
  POST /api/v1/test/recommendations/individual
  POST /api/v1/test/recommendations/department
"""
import os

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.schemas.faculty import DepartmentRequest, PredictionRequest
from app.services.recommendation import individual, department as dept_recommendation

router = APIRouter(prefix="/test", tags=["Test (No Auth)"])

settings = get_settings()


def _check_test_enabled():
    """Block test endpoints in production if ENABLE_TEST_ENDPOINTS is not set to 'true'."""
    enable = os.getenv("ENABLE_TEST_ENDPOINTS", "true").lower()
    if enable != "true":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test endpoints are disabled in this environment.",
        )


def _get_model_or_503(request: Request):
    model = getattr(request.app.state, "model", None)
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No trained model is initialized. Contact your system administrator.",
        )
    try:
        model.ensure_active()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Active model error: {exc}",
        )
    return model


@router.post("/recommendations/individual")
def test_individual_recommendation(
    body: PredictionRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    [NO AUTH REQUIRED — FOR TESTING ONLY]

    Generate an individual training recommendation from a raw faculty data payload.
    Does NOT require login. Does NOT store results to the database.
    Use the same schema as the real endpoint.

    Disable by setting ENABLE_TEST_ENDPOINTS=false in .env
    """
    _check_test_enabled()
    model = _get_model_or_503(request)

    faculty_dict = body.faculty.model_dump()
    result = individual(model, faculty_dict, db=None)

    # Attach test marker
    result["_test_mode"] = True
    result["_note"] = "This result was NOT saved to the database. Use POST /api/v1/profile/request-recommendation for persistent results."

    return result


@router.post("/recommendations/department")
def test_department_recommendation(
    body: DepartmentRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    [NO AUTH REQUIRED — FOR TESTING ONLY]

    Generate a department-level recommendation from a list of raw faculty data payloads.
    Does NOT require login. Does NOT store results to the database.
    All submitted faculty records are included (no questionnaire_status filtering).

    Disable by setting ENABLE_TEST_ENDPOINTS=false in .env
    """
    _check_test_enabled()
    model = _get_model_or_503(request)

    records = [f.model_dump() for f in body.faculty]
    result = dept_recommendation(model, records, dept_name=body.department, db=None)

    result["_test_mode"] = True
    result["_note"] = (
        "This result was NOT saved to the database. "
        "Use POST /api/v1/recommendations/department (authenticated) for persistent, filtered results."
    )

    return result
