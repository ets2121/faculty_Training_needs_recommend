from pathlib import Path
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from app.core.config import get_settings
from app.core.security import require_admin
from app.ml.trainer import train_from_dataframe
from app.db.session import SessionLocal
from app.db.models import ModelRegistry
import json

router = APIRouter(prefix="/training", tags=["Training"])

@router.post("/train", dependencies=[Depends(require_admin)])
def train():
    settings = get_settings()
    path = Path(settings.raw_data_path)
    if not path.exists():
        raise HTTPException(404, f"Training dataset not found: {path}")

    df = pd.read_csv(path)
    try:
        result = train_from_dataframe(df, settings.model_dir)
    except Exception as exc:
        raise HTTPException(400, str(exc))

    with SessionLocal() as db:
        db.add(ModelRegistry(
            version=result["version"],
            artifact_path=result["artifact"],
            metrics_json=json.dumps(result["metrics"])
        ))
        db.commit()

    return result

@router.post("/reload", dependencies=[Depends(require_admin)])
def reload_model():
    # Actual model object is reloaded by the main application process in production.
    # For multi-worker deployments, restart workers after training for deterministic rollout.
    return {"status": "restart_or_reload_workers_after_training"}
