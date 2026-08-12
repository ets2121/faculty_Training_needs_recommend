from fastapi import APIRouter, HTTPException, Request
from app.schemas.faculty import (
    PredictionRequest,
    TransparentPredictionResponse,
    DepartmentRequest,
    TransparentDepartmentResponse,
)
from app.services.recommendation import individual, department

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("/individual", response_model=TransparentPredictionResponse)
def individual_recommendation(payload: PredictionRequest, request: Request):
    model = request.app.state.model
    if not model.ready():
        raise HTTPException(503, "No trained model is active.")
    return individual(model, payload.faculty.model_dump())


@router.post("/department", response_model=TransparentDepartmentResponse)
def department_recommendation(payload: DepartmentRequest, request: Request):
    model = request.app.state.model
    if not model.ready():
        raise HTTPException(503, "No trained model is active.")
    records = [x.model_dump() for x in payload.faculty]
    res = department(model, records)
    res["department"] = payload.department
    return res
