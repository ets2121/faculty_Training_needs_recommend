"""
Questionnaire API — Multi-part faculty questionnaire with per-section persistence.

Parts:
  1 - Personal Profile          (required for recommendation)
  2 - Educational Background    (required for recommendation)
  3 - Professional Background   (required for recommendation)
  4 - Training History          (optional)
  5 - Competency Assessment     (required for recommendation)
  6 - Emerging Training Needs   (required for recommendation)
  7 - Learning Preferences      (optional)
  8 - Barriers to Training      (optional)

Minimum requirement for recommendation: Parts 1, 2, 3, 5, 6 must all be complete.
Faculty cannot proceed to part N+1 without completing part N.
"""
import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.core.security import get_current_user, get_user_role_name, log_audit
from app.db.models import Faculty, QuestionnairePart, User
from app.db.session import get_db

router = APIRouter(prefix="/questionnaire", tags=["Questionnaire"])

# Parts required for the ML recommendation model
REQUIRED_PARTS = {1, 2, 3, 5, 6}
TOTAL_PARTS = 8

PART_LABELS = {
    1: "Personal Profile",
    2: "Educational Background",
    3: "Professional Background",
    4: "Training History",
    5: "Competency Assessment",
    6: "Emerging Training Needs",
    7: "Learning Preferences",
    8: "Barriers to Training",
}


# ─── Pydantic Schemas per Part ────────────────────────────────────────────────

class Part1Schema(BaseModel):
    """Personal Profile"""
    department: str = Field(..., min_length=2, max_length=50)
    age: int = Field(..., ge=18, le=80)
    sex: str = Field(..., pattern="^(Male|Female|Prefer not to say)$")
    employment_status: str = Field(..., min_length=2)


class Part2Schema(BaseModel):
    """Educational Background"""
    highest_educational_attainment: str = Field(..., min_length=2)
    field_of_specialization: str = Field(..., min_length=2)


class Part3Schema(BaseModel):
    """Professional Background"""
    academic_rank: str = Field(..., min_length=2)
    years_teaching: str = Field(..., min_length=1)
    administrative_designation: str | None = None
    trainings_last_3_years: str = Field(default="0")


class Part4Schema(BaseModel):
    """Training History"""
    training_areas: list[str] = Field(default_factory=list)
    training_modalities_attended: list[str] = Field(default_factory=list)


class Part5Schema(BaseModel):
    """Competency Assessment — each competency has proficiency (1-5) and importance (1-5)"""
    competency: dict[str, dict[str, int]] = Field(
        ...,
        description="Keys are competency names; values are {proficiency: 1-5, importance: 1-5}",
    )

    @field_validator("competency")
    @classmethod
    def validate_competency(cls, v: dict) -> dict:
        if not v:
            raise ValueError("At least one competency assessment is required.")
        for key, scores in v.items():
            if "proficiency" not in scores or "importance" not in scores:
                raise ValueError(f"Competency '{key}' must have 'proficiency' and 'importance' keys.")
            if not (1 <= scores["proficiency"] <= 5) or not (1 <= scores["importance"] <= 5):
                raise ValueError(f"Competency '{key}' scores must be between 1 and 5.")
        return v


class Part6Schema(BaseModel):
    """Emerging Training Needs — scale 1 (Not Important) to 5 (Most Important)"""
    emerging_training_needs: dict[str, int] = Field(
        ...,
        description="Keys are training area names; values are urgency (1-5)",
    )

    @field_validator("emerging_training_needs")
    @classmethod
    def validate_needs(cls, v: dict) -> dict:
        if not v:
            raise ValueError("At least one emerging training need is required.")
        for key, val in v.items():
            if not (1 <= val <= 5):
                raise ValueError(f"Training need '{key}' must be rated 1-5.")
        return v


class Part7Schema(BaseModel):
    """Learning Preferences"""
    preferred_learning_modality: list[str] = Field(default_factory=list)
    preferred_schedule: list[str] = Field(default_factory=list)
    preferred_duration: list[str] = Field(default_factory=list)


class Part8Schema(BaseModel):
    """Barriers to Training"""
    barriers: dict[str, int] = Field(default_factory=dict)

    @field_validator("barriers")
    @classmethod
    def validate_barriers(cls, v: dict) -> dict:
        for key, val in v.items():
            if not (1 <= val <= 5):
                raise ValueError(f"Barrier '{key}' must be rated 1-5.")
        return v


PART_SCHEMAS = {
    1: Part1Schema,
    2: Part2Schema,
    3: Part3Schema,
    4: Part4Schema,
    5: Part5Schema,
    6: Part6Schema,
    7: Part7Schema,
    8: Part8Schema,
}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _get_faculty_or_403(current_user: User, db: Session) -> Faculty:
    """Ensure user is a faculty member and return their Faculty profile."""
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty members can access the questionnaire.",
        )
    return faculty


def _get_completed_parts(faculty_id: int, db: Session) -> dict[int, bool]:
    """Returns a dict: {part_number: is_complete} for all stored parts."""
    parts = db.query(QuestionnairePart).filter(QuestionnairePart.faculty_id == faculty_id).all()
    return {p.part_number: p.is_complete for p in parts}


def _get_part_data(faculty_id: int, part_number: int, db: Session) -> dict | None:
    """Returns the parsed data_json for a specific part, or None."""
    part = db.query(QuestionnairePart).filter(
        QuestionnairePart.faculty_id == faculty_id,
        QuestionnairePart.part_number == part_number,
    ).first()
    if part and part.data_json:
        return json.loads(part.data_json)
    return None


def is_eligible_for_recommendation(faculty_id: int, db: Session) -> bool:
    """Returns True if all required parts (1, 2, 3, 5, 6) are complete."""
    completed = _get_completed_parts(faculty_id, db)
    return all(completed.get(p, False) for p in REQUIRED_PARTS)


def build_faculty_record(faculty_id: int, faculty_obj: Faculty, db: Session) -> dict[str, Any]:
    """
    Assembles a complete faculty record dict from all saved questionnaire parts.
    Used to feed the recommendation model.
    """
    record: dict[str, Any] = {}

    for part_num in range(1, TOTAL_PARTS + 1):
        data = _get_part_data(faculty_id, part_num, db)
        if data:
            record.update(data)

    return record


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/progress")
def get_questionnaire_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the faculty's questionnaire completion progress for all 8 parts.
    Shows which parts are complete, saved, or not started.
    """
    faculty = _get_faculty_or_403(current_user, db)
    all_parts = db.query(QuestionnairePart).filter(
        QuestionnairePart.faculty_id == faculty.id
    ).all()

    part_map = {p.part_number: p for p in all_parts}
    parts_status = []

    for i in range(1, TOTAL_PARTS + 1):
        part = part_map.get(i)
        parts_status.append({
            "part_number": i,
            "label": PART_LABELS[i],
            "required_for_recommendation": i in REQUIRED_PARTS,
            "status": "complete" if (part and part.is_complete) else
                      "in_progress" if (part and part.data_json) else
                      "not_started",
            "updated_at": part.updated_at.isoformat() if part and part.updated_at else None,
        })

    completed_required = sum(
        1 for i in REQUIRED_PARTS
        if part_map.get(i) and part_map[i].is_complete
    )
    completed_total = sum(1 for p in part_map.values() if p.is_complete)

    return {
        "faculty_id": faculty.id,
        "eligible_for_recommendation": is_eligible_for_recommendation(faculty.id, db),
        "required_parts_completed": f"{completed_required}/{len(REQUIRED_PARTS)}",
        "total_parts_completed": f"{completed_total}/{TOTAL_PARTS}",
        "parts": parts_status,
    }


@router.get("/parts/{part_number}")
def get_part_data(
    part_number: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get saved data for a specific questionnaire part (1–8)."""
    if part_number < 1 or part_number > TOTAL_PARTS:
        raise HTTPException(status_code=400, detail=f"Part number must be between 1 and {TOTAL_PARTS}.")

    faculty = _get_faculty_or_403(current_user, db)
    part = db.query(QuestionnairePart).filter(
        QuestionnairePart.faculty_id == faculty.id,
        QuestionnairePart.part_number == part_number,
    ).first()

    if not part:
        return {
            "part_number": part_number,
            "label": PART_LABELS[part_number],
            "is_complete": False,
            "data": None,
        }

    return {
        "part_number": part_number,
        "label": PART_LABELS[part_number],
        "is_complete": part.is_complete,
        "data": json.loads(part.data_json) if part.data_json else None,
        "updated_at": part.updated_at.isoformat() if part.updated_at else None,
    }


@router.put("/parts/{part_number}")
def submit_part(
    part_number: int,
    body: dict,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Save or update data for a questionnaire part.
    - Part N cannot be saved until Part N-1 is marked complete (except Part 1).
    - Validates the submitted data against the part's schema.
    - Marks the part as complete upon successful validation.
    """
    if part_number < 1 or part_number > TOTAL_PARTS:
        raise HTTPException(status_code=400, detail=f"Part number must be between 1 and {TOTAL_PARTS}.")

    faculty = _get_faculty_or_403(current_user, db)
    completed_map = _get_completed_parts(faculty.id, db)

    # Enforce sequential progression: previous part must be complete (except Part 1)
    if part_number > 1:
        prev_complete = completed_map.get(part_number - 1, False)
        if not prev_complete:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Part {part_number - 1} ({PART_LABELS[part_number - 1]}) must be completed before submitting Part {part_number}.",
            )

    # Validate against the part schema
    schema_class = PART_SCHEMAS[part_number]
    try:
        validated = schema_class(**body)
        validated_data = validated.model_dump()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Validation error in Part {part_number}: {str(e)}",
        )

    # Save or update the part record
    part = db.query(QuestionnairePart).filter(
        QuestionnairePart.faculty_id == faculty.id,
        QuestionnairePart.part_number == part_number,
    ).first()

    if not part:
        part = QuestionnairePart(
            faculty_id=faculty.id,
            part_number=part_number,
            is_complete=True,
            data_json=json.dumps(validated_data),
        )
        db.add(part)
    else:
        part.data_json = json.dumps(validated_data)
        part.is_complete = True

    db.commit()

    log_audit(
        db, current_user, "submit_questionnaire_part",
        entity_type="questionnaire_part",
        entity_id=f"{faculty.id}:part{part_number}",
        new_values={"part": part_number, "label": PART_LABELS[part_number]},
        ip_address=request.client.host if request.client else None,
    )

    return {
        "status": "success",
        "message": f"Part {part_number} ({PART_LABELS[part_number]}) saved successfully.",
        "part_number": part_number,
        "is_complete": True,
        "eligible_for_recommendation": is_eligible_for_recommendation(faculty.id, db),
    }


@router.get("/can-recommend")
def check_recommendation_eligibility(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check whether this faculty member meets the minimum requirements for a recommendation."""
    faculty = _get_faculty_or_403(current_user, db)
    completed = _get_completed_parts(faculty.id, db)
    missing = [
        {"part_number": p, "label": PART_LABELS[p]}
        for p in REQUIRED_PARTS
        if not completed.get(p, False)
    ]

    return {
        "eligible": len(missing) == 0,
        "missing_required_parts": missing,
        "message": (
            "You are eligible to request a training recommendation."
            if not missing
            else f"Please complete the following required parts first: {[m['label'] for m in missing]}"
        ),
    }
