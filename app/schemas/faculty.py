from typing import Any
from pydantic import BaseModel, Field


class FacultyRecord(BaseModel):
    faculty_id: str | None = None
    department: str
    age: int = Field(default=35, ge=18, le=100)
    sex: str | None = None
    employment_status: str | None = "Permanent"
    academic_rank: str | None = "Instructor"
    highest_educational_attainment: str | None = "Master's Degree"
    field_of_specialization: str | None = "General"
    years_teaching: str | None = "1-5 years"
    administrative_designation: str | None = None

    trainings_last_3_years: str | None = "0"
    training_areas: list[str] = Field(default_factory=list)

    competency: dict[str, dict[str, int]] = Field(default_factory=dict)
    emerging_training_needs: dict[str, int] = Field(default_factory=dict)

    preferred_learning_modality: list[str] = Field(default_factory=list)
    preferred_schedule: list[str] = Field(default_factory=list)
    preferred_duration: list[str] = Field(default_factory=list)

    barriers: dict[str, int] = Field(default_factory=dict)

    top_five_training_priorities: list[str] = Field(default_factory=list)


class PredictionRequest(BaseModel):
    faculty: FacultyRecord


class DepartmentRequest(BaseModel):
    department: str
    faculty: list[FacultyRecord] = Field(min_length=1)


class ModelMetadata(BaseModel):
    status: str = "ready"
    version: str


class CategoryPrediction(BaseModel):
    training_category: str
    probability: float
    rank: int


class CategoryPredictionSimple(BaseModel):
    training_category: str
    probability: float


class PredictionSection(BaseModel):
    top_predictions: list[CategoryPrediction]
    all_predictions: list[CategoryPredictionSimple]


class CatalogRecommendationItem(BaseModel):
    training_id: str
    title: str
    category: str
    match_score: float
    reason: str
    description: str | None = None


class TransparentPredictionResponse(BaseModel):
    status: str = "success"
    model: ModelMetadata
    prediction: PredictionSection
    recommendations: list[CatalogRecommendationItem]
    generated_at: str | None = None
    last_recommendation_at: str | None = None


class DepartmentCategoryPrediction(BaseModel):
    training_category: str
    department_score: float
    faculty_coverage: float
    rank: int


class DepartmentPredictionSection(BaseModel):
    top_categories: list[DepartmentCategoryPrediction]


class TransparentDepartmentResponse(BaseModel):
    status: str = "success"
    model: ModelMetadata
    department: str
    faculty_count: int
    prediction: DepartmentPredictionSection
    recommendations: list[CatalogRecommendationItem]
    generated_at: str | None = None
    last_recommendation_at: str | None = None


class CatalogItemSchema(BaseModel):
    training_id: str | None = None
    title: str
    description: str = ""
    categories: list[str] = Field(default_factory=list)
    target_competencies: list[str] = Field(default_factory=list)
    modalities: list[str] = Field(default_factory=list)
    durations: list[str] = Field(default_factory=list)
    schedules: list[str] = Field(default_factory=list)
    status: str = "active"


class TrainResponse(BaseModel):
    status: str
    model_version: str
    metrics: dict[str, Any]
