from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import require_admin, log_audit
from app.db.models import ModelRegistry
from app.db.session import get_db
from app.ml.registry import (
    detect_model_folders,
    get_active_pointer,
    import_model_from_zip,
    resolve_active_model,
    set_active_model_pointer,
    sync_registry_with_db,
)
from app.ml.trainer import load_dataset_file, train_from_dataframe

router = APIRouter(prefix="/training", tags=["Training"])


class SetActiveRequest(BaseModel):
    target: str


@router.get("/status", dependencies=[Depends(require_admin)])
def get_training_status(request: Request):
    """
    Get the health, version, folder, and metrics of the currently active model.
    Checks models/active.json and verifies file integrity.
    """
    settings = get_settings()
    models_dir = Path(settings.model_dir)
    res = resolve_active_model(models_dir)

    model = getattr(request.app.state, "model", None)
    if model:
        try:
            model.ensure_active()
        except Exception:
            pass

    return {
        "status": "ready" if res.get("ready") else "error",
        "ready": res.get("ready", False),
        "version": res.get("version"),
        "folder_name": res.get("folder_name"),
        "artifact_path": res.get("artifact_path"),
        "labels_path": res.get("labels_path"),
        "metadata_path": res.get("metadata_path"),
        "metrics": res.get("metrics", {}),
        "topics": res.get("topics", []),
        "feature_importances": res.get("feature_importances", []),
        "error": res.get("error"),
    }


@router.get("/models", dependencies=[Depends(require_admin)])
def list_available_models(request: Request, db: Session = Depends(get_db)):
    """
    Scan models/ directory for all user-defined model folders and legacy models.
    Returns details on each folder including metrics and active status.
    """
    settings = get_settings()
    detected = detect_model_folders(settings.model_dir)
    return {"models": detected, "total": len(detected)}


@router.post("/set-active", dependencies=[Depends(require_admin)])
def set_active_model_endpoint(req: SetActiveRequest, request: Request, db: Session = Depends(get_db)):
    """
    Switch the active model to a specified folder name or version.
    Validates that the model exists on disk, updates active.json,
    updates MySQL model_registry (ensuring a single active model),
    and reloads the in-memory predictor.
    """
    settings = get_settings()
    try:
        active_data = set_active_model_pointer(settings.model_dir, req.target)
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    # Synchronize MySQL model_registry table
    sync_res = sync_registry_with_db(db, settings.model_dir)

    # Reload active model in FastAPI state
    model = getattr(request.app.state, "model", None)
    if model:
        model._load_active_model()

    log_audit(
        db, None, "set_active_model", entity_type="model", entity_id=active_data.get("version"),
        new_values=active_data, ip_address=request.client.host if request.client else None
    )

    return {
        "message": f"Active model switched to '{req.target}' successfully.",
        "active": active_data,
        "sync": sync_res,
    }


@router.post("/sync-registry", dependencies=[Depends(require_admin)])
def sync_registry_endpoint(request: Request, db: Session = Depends(get_db)):
    """
    Scan models/ directory for manually copied or imported model folders,
    insert/update database entries in model_registry, and align active status.
    """
    settings = get_settings()
    result = sync_registry_with_db(db, settings.model_dir)

    model = getattr(request.app.state, "model", None)
    if model:
        model._load_active_model()

    return {
        "message": "Model registry synchronized successfully.",
        **result,
    }


@router.post("/import-model", dependencies=[Depends(require_admin)])
async def import_model_archive_endpoint(
    request: Request,
    model_zip: UploadFile = File(...),
    folder_name: str | None = Form(None),
    db: Session = Depends(get_db),
):
    """
    Upload a qsu_model_v*.zip exported from Google Colab or Jupyter notebook.
    Extracts into models/<folder_name>/, verifies artifacts,
    sets it as active in active.json, and synchronizes model_registry.
    """
    settings = get_settings()
    if not model_zip.filename or not model_zip.filename.lower().endswith(".zip"):
        raise HTTPException(400, "Uploaded file must be a .zip model archive.")

    content = await model_zip.read()
    try:
        result = import_model_from_zip(content, settings.model_dir, folder_name)
    except Exception as exc:
        raise HTTPException(400, f"Failed to import model archive: {exc}")

    # Synchronize MySQL database
    sync_registry_with_db(db, settings.model_dir)

    # Reload in-memory model
    model = getattr(request.app.state, "model", None)
    if model:
        model._load_active_model()

    log_audit(
        db, None, "import_model", entity_type="model", entity_id=result.get("version"),
        new_values={"folder": result.get("folder_name"), "metrics": result.get("metrics")},
        ip_address=request.client.host if request.client else None
    )

    return {
        "message": f"Model imported and activated successfully in folder '{result['folder_name']}'.",
        "imported": result,
    }


@router.post("/train", dependencies=[Depends(require_admin)])
async def train(
    request: Request,
    db: Session = Depends(get_db),
    dataset_file: UploadFile | None = File(None),
    folder_name: str | None = Form(None),
):
    """
    Trigger full ML retraining pipeline.

    Optional multipart fields:
    - dataset_file: .csv, .xlsx, or .xls dataset file. If omitted, the default
      system dataset (raw_data_path from settings) is used.
    - folder_name: custom folder name inside models/. Defaults to a timestamp
      version string (e.g. v20261025123709).

    Returns full metrics matching the Colab notebook output format.
    """
    settings = get_settings()

    # ── Load dataset ──────────────────────────────────────────────────────────
    if dataset_file and dataset_file.filename:
        # Validate file extension before reading
        fname = dataset_file.filename.lower()
        if not (fname.endswith(".csv") or fname.endswith(".xlsx") or fname.endswith(".xls")):
            raise HTTPException(
                400,
                detail=(
                    f"Unsupported file format '{dataset_file.filename}'. "
                    "Please upload a .csv, .xlsx, or .xls dataset file."
                ),
            )

        file_bytes = await dataset_file.read()
        if len(file_bytes) == 0:
            raise HTTPException(400, detail="Uploaded dataset file is empty.")

        try:
            df = load_dataset_file(file_bytes, dataset_file.filename)
        except ValueError as exc:
            raise HTTPException(400, detail=str(exc))
        except Exception as exc:
            raise HTTPException(
                400,
                detail=f"Failed to parse uploaded dataset '{dataset_file.filename}': {exc}",
            )

        dataset_source = f"uploaded file '{dataset_file.filename}' ({len(df)} records)"
    else:
        # Fallback to default system dataset
        path = Path(settings.raw_data_path)
        if not path.exists():
            raise HTTPException(
                404,
                detail=(
                    f"Default training dataset not found: {settings.raw_data_path}. "
                    "Please upload a dataset file or ensure the default CSV is in place."
                ),
            )
        try:
            df = pd.read_csv(path)
        except Exception as exc:
            raise HTTPException(
                400,
                detail=f"Failed to read default dataset '{path}': {exc}",
            )

        if len(df) < 50:
            raise HTTPException(
                400,
                detail=(
                    f"Default dataset has only {len(df)} records — "
                    "at least 50 are required for training."
                ),
            )

        dataset_source = f"default system dataset '{path.name}' ({len(df)} records)"

    # ── Train model ───────────────────────────────────────────────────────────
    try:
        result = train_from_dataframe(df, settings.model_dir, custom_folder_name=folder_name)
    except ValueError as exc:
        raise HTTPException(400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(500, detail=f"Training failed unexpectedly: {exc}")

    # ── Sync MySQL model_registry ─────────────────────────────────────────────
    # Deactivate all previous models, then insert/activate the new one
    db.query(ModelRegistry).update({"is_active": False})
    db.add(ModelRegistry(
        version=result["version"],
        artifact_path=result["artifact"],
        metrics_json=json.dumps(result["metrics"]),
        is_active=True,
    ))
    db.commit()

    # ── Reload in-memory model ────────────────────────────────────────────────
    model = getattr(request.app.state, "model", None)
    if model:
        model._load_active_model()

    log_audit(
        db, None, "train_model", entity_type="model", entity_id=result["version"],
        new_values={
            "version": result["version"],
            "folder": result["folder"],
            "dataset_source": dataset_source,
            "metrics": result["metrics"],
        },
        ip_address=request.client.host if request.client else None,
    )

    return {
        **result,
        "dataset_source": dataset_source,
        "message": (
            f"Model '{result['version']}' trained successfully from {dataset_source}. "
            f"Deployed to models/{result['folder']}/."
        ),
    }


@router.post("/reload", dependencies=[Depends(require_admin)])
def reload_model(request: Request):
    """Explicitly reload model from active.json."""
    model = getattr(request.app.state, "model", None)
    if model:
        model._load_active_model()
        return {"status": "reloaded", "ready": model.ready(), "version": model.version, "error": model.load_error}
    return {"status": "no_model_instance"}
