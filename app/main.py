from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.init_db import init_db
from app.ml.predictor import ModelService
from app.api import auth, catalog, health, predictions, training, users, audit

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    app.state.model = ModelService(settings.model_dir)
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Production-oriented faculty training needs recommendation API with MySQL & RBAC.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.api_v1_prefix)
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(users.router, prefix=settings.api_v1_prefix)
app.include_router(predictions.router, prefix=settings.api_v1_prefix)
app.include_router(training.router, prefix=settings.api_v1_prefix)
app.include_router(catalog.router, prefix=settings.api_v1_prefix)
app.include_router(audit.router, prefix=settings.api_v1_prefix)
