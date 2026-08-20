from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.init_db import init_db
from app.ml.predictor import ModelService
from app.api import auth, catalog, health, predictions, training, users, audit, questionnaire, profile, test_recommendations, campuses

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    app.state.model = ModelService(settings.model_dir)
    yield


app = FastAPI(
    title=settings.app_name,
    version="2.0.0",
    description=(
        "QSU Faculty Training Needs Recommender System - "
        "Production API with MySQL, Multi-Campus (Diffun, Maddela, Cabarroguis), RBAC, multi-part questionnaire, "
        "and Next.js-ready REST interface."
    ),
    lifespan=lifespan,
    # Enable JSON response schema generation for Next.js type generation
    generate_unique_id_function=lambda route: f"{route.tags[0]}-{route.name}" if route.tags else route.name,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Admin-API-Key", "Accept"],
    expose_headers=["X-Total-Count", "X-Page", "X-Per-Page"],
)

# ─── Routes ──────────────────────────────────────────────────────────────────
pfx = settings.api_v1_prefix

app.include_router(health.router, prefix=pfx)
app.include_router(auth.router, prefix=pfx)
app.include_router(profile.router, prefix=pfx)
app.include_router(campuses.router, prefix=pfx)
app.include_router(questionnaire.router, prefix=pfx)
app.include_router(users.router, prefix=pfx)
app.include_router(predictions.router, prefix=pfx)
app.include_router(test_recommendations.router, prefix=pfx)
app.include_router(training.router, prefix=pfx)
app.include_router(catalog.router, prefix=pfx)
app.include_router(audit.router, prefix=pfx)