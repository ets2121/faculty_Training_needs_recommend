import json
from pathlib import Path
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import require_admin, log_audit
from app.db.models import ModelRegistry
from app.db.session import get_db
from app.ml.trainer import train_from_dataframe

router = APIRouter(prefix="/training", tags=["Training"])


@router.post("/train", dependencies=[Depends(require_admin)])
def train(request: Request, db: Session = Depends(get_db)):
    settings = get_settings()
    path = Path(settings.raw_data_path)
    if not path.exists():
        raise HTTPException(404, f"Training dataset not found: {path}")

    df = pd.read_csv(path)
    try:
        result = train_from_dataframe(df, settings.model_dir)
    except Exception as exc:
        raise HTTPException(400, str(exc))

    # Record model registry entry in MySQL
    db.add(ModelRegistry(
        version=result["version"],
        artifact_path=result["artifact"],
        metrics_json=json.dumps(result["metrics"]),
        is_active=True,
    ))
    db.commit()

    log_audit(db, None, "train_model", entity_type="model", entity_id=result["version"],
              new_values={"version": result["version"], "metrics": result["metrics"]},
              ip_address=request.client.host if request.client else None)

    return result


@router.post("/reload", dependencies=[Depends(require_admin)])
def reload_model():
    return {"status": "restart_or_reload_workers_after_training"}
