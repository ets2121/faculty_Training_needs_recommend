from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.faculty import (
    PredictionRequest,
    TransparentPredictionResponse,
    DepartmentRequest,
    TransparentDepartmentResponse,
)
from app.services.recommendation import individual, department

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("/individual", response_model=TransparentPredictionResponse)
def individual_recommendation(payload: PredictionRequest, request: Request, db: Session = Depends(get_db)):
    model = request.app.state.model
    if not model.ready():
        raise HTTPException(503, "No trained model is active.")
    return individual(model, payload.faculty.model_dump(), db=db)


@router.post("/department", response_model=TransparentDepartmentResponse)
def department_recommendation(payload: DepartmentRequest, request: Request, db: Session = Depends(get_db)):
    model = request.app.state.model
    if not model.ready():
        raise HTTPException(503, "No trained model is active.")
    records = [x.model_dump() for x in payload.faculty]
    return department(model, records, dept_name=payload.department, db=db)
