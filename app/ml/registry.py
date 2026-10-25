from __future__ import annotations

import json
import re
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.db.models import ModelRegistry


def _normalize_path(p: str | Path) -> str:
    """Normalize path with forward slashes for cross-platform compatibility."""
    return str(p).replace("\\", "/")


def resolve_file(target_str: str | Path | None, base_dir: Path) -> Path | None:
    """
    Robust file resolver:
    1. Checks if target_str exists as absolute or relative to current working directory.
    2. Checks if base_dir / target_str exists.
    3. Checks if base_dir / filename exists.
    4. Handles both forward and backward slashes.
    """
    if not target_str:
        return None

    cleaned_str = str(target_str).strip().replace("\\", "/")
    p = Path(cleaned_str)

    # 1. As is
    if p.is_file():
        return p

    # 2. Relative to base_dir
    p_rel = base_dir / p
    if p_rel.is_file():
        return p_rel

    # 3. Just the file name inside base_dir or any direct subfolder of base_dir
    p_name = base_dir / p.name
    if p_name.is_file():
        return p_name

    for sub in base_dir.iterdir():
        if sub.is_dir():
            sub_file = sub / p.name
            if sub_file.is_file():
                return sub_file

    return None


def detect_model_folders(models_dir: str | Path) -> list[dict[str, Any]]:
    """
    Scan models_dir for all model versions:
    - User-defined subfolders containing model artifacts.
    - Legacy flat files directly in models_dir.
    Returns a list of model summaries with metrics, files, and validity status.
    """
    base = Path(models_dir)
    if not base.exists():
        base.mkdir(parents=True, exist_ok=True)

    active_info = get_active_pointer(base)
    active_version = active_info.get("version") if active_info else None
    active_folder = active_info.get("folder") if active_info else None

    models: list[dict[str, Any]] = []

    # 1. Scan subdirectories (the preferred, organized format)
    for sub in base.iterdir():
        if not sub.is_dir():
            continue

        folder_name = sub.name
        # Look for pipeline artifact
        artifacts = list(sub.glob("training_recommender*.joblib"))
        if not artifacts:
            # Fallback to any joblib in the folder that is not labels
            artifacts = [f for f in sub.glob("*.joblib") if "label" not in f.name.lower()]

        # Look for labels artifact
        labels_files = list(sub.glob("labels*.joblib"))
        if not labels_files:
            labels_files = [f for f in sub.glob("*.joblib") if "label" in f.name.lower()]

        # Look for metadata json
        meta_files = list(sub.glob("metadata*.json"))

        # Skip folders that have neither model artifact nor labels
        if not artifacts and not labels_files:
            continue

        artifact_file = artifacts[0] if artifacts else None
        labels_file = labels_files[0] if labels_files else None
        meta_file = meta_files[0] if meta_files else None

        metrics = {}
        version = folder_name
        topics = []
        trained_at = None

        if meta_file and meta_file.is_file():
            try:
                meta_data = json.loads(meta_file.read_text(encoding="utf-8"))
                version = meta_data.get("version", version)
                metrics = meta_data.get("metrics", {})
                topics = metrics.get("topics", meta_data.get("topics", []))
                trained_at = meta_data.get("trained_at", None)
            except Exception:
                pass

        if not trained_at and artifact_file:
            trained_at = datetime.fromtimestamp(artifact_file.stat().st_mtime, tz=timezone.utc).isoformat()

        is_valid = bool(artifact_file and labels_file)
        is_active = False
        if active_info:
            if active_folder and active_folder == folder_name:
                is_active = True
            elif active_version and (active_version == version or active_version == folder_name):
                is_active = True

        models.append({
            "folder_name": folder_name,
            "version": version,
            "display_name": folder_name,
            "is_folder": True,
            "artifact_path": _normalize_path(artifact_file) if artifact_file else None,
            "labels_path": _normalize_path(labels_file) if labels_file else None,
            "metadata_path": _normalize_path(meta_file) if meta_file else None,
            "artifact_size_bytes": artifact_file.stat().st_size if artifact_file else 0,
            "metrics": metrics,
            "topics_count": len(topics),
            "topics": topics,
            "trained_at": trained_at,
            "status": "ready" if is_valid else "incomplete",
            "is_active": is_active,
        })

    # 2. Check for legacy flat models directly in models_dir root
    flat_artifacts = [f for f in base.glob("training_recommender_*.joblib") if f.is_file()]
    for art in flat_artifacts:
        stem = art.stem
        version_part = stem.split("_v", 1)[1] if "_v" in stem else stem
        labels_candidate = base / f"labels_v{version_part}.joblib"
        meta_candidate = base / f"metadata_v{version_part}.json"

        # Check if already covered by folder
        if any(m.get("version") == version_part or m.get("version") == f"v{version_part}" for m in models):
            continue

        metrics = {}
        topics = []
        trained_at = datetime.fromtimestamp(art.stat().st_mtime, tz=timezone.utc).isoformat()
        if meta_candidate.is_file():
            try:
                meta_data = json.loads(meta_candidate.read_text(encoding="utf-8"))
                metrics = meta_data.get("metrics", {})
                topics = metrics.get("topics", meta_data.get("topics", []))
                trained_at = meta_data.get("trained_at", trained_at)
            except Exception:
                pass

        is_valid = art.is_file() and labels_candidate.is_file()
        is_active = False
        if active_info:
            if active_version in (version_part, f"v{version_part}"):
                is_active = True

        models.append({
            "folder_name": None,
            "version": f"v{version_part}",
            "display_name": f"Flat (v{version_part})",
            "is_folder": False,
            "artifact_path": _normalize_path(art),
            "labels_path": _normalize_path(labels_candidate) if labels_candidate.is_file() else None,
            "metadata_path": _normalize_path(meta_candidate) if meta_candidate.is_file() else None,
            "artifact_size_bytes": art.stat().st_size,
            "metrics": metrics,
            "topics_count": len(topics),
            "topics": topics,
            "trained_at": trained_at,
            "status": "ready" if is_valid else "incomplete",
            "is_active": is_active,
        })

    # Sort: active first, then newest trained_at
    models.sort(key=lambda m: (1 if m["is_active"] else 0, m.get("trained_at") or ""), reverse=True)
    return models


def get_active_pointer(models_dir: str | Path) -> dict[str, Any] | None:
    """Read raw models/active.json file if it exists."""
    active_file = Path(models_dir) / "active.json"
    if not active_file.is_file():
        return None
    try:
        return json.loads(active_file.read_text(encoding="utf-8"))
    except Exception:
        return None


def extract_feature_importances(pipeline_or_path: Any, top_k: int = 6) -> list[dict[str, Any]]:
    """
    Extract and rank real feature importances from a fitted Random Forest Multi-Label Pipeline.
    Returns normalized percentage ratings and friendly cleaned labels.
    """
    try:
        import joblib
        import numpy as np

        if isinstance(pipeline_or_path, (str, Path)):
            pipeline = joblib.load(pipeline_or_path)
        else:
            pipeline = pipeline_or_path

        pre = getattr(pipeline, "named_steps", {}).get("preprocessor")
        clf = getattr(pipeline, "named_steps", {}).get("classifier")

        if not pre or not clf or not hasattr(clf, "estimators_"):
            return []

        feature_names = pre.get_feature_names_out()
        importances = np.mean([est.feature_importances_ for est in clf.estimators_], axis=0)
        top_idx = np.argsort(importances)[::-1][:top_k]

        max_val = float(importances[top_idx[0]]) if len(top_idx) > 0 and importances[top_idx[0]] > 0 else 1.0
        colors = ["#10b981", "#0284c7", "#f59e0b", "#e11d48", "#8b5cf6", "#64748b"]

        def _clean_label(name: str) -> str:
            name = name.replace("num__", "").replace("cat__", "")
            parts = name.split("_")
            label = " ".join(parts).title()
            label = (
                label.replace("Obe", "Outcomes-Based Education (OBE)")
                .replace("Ict", "ICT")
                .replace("Ai", "Artificial Intelligence")
                .replace("Lms", "LMS")
            )
            return label

        results = []
        for i, idx in enumerate(top_idx):
            val = float(importances[idx])
            norm_val = max(10, min(100, round((val / max_val) * 100)))
            results.append({
                "label": _clean_label(feature_names[idx]),
                "value": norm_val,
                "raw_importance": round(val, 4),
                "color": colors[i % len(colors)],
            })
        return results
    except Exception as exc:
        print(f"DEBUG: Could not extract feature importances: {exc}")
        return []


def resolve_active_model(models_dir: str | Path) -> dict[str, Any]:
    """
    Strict resolution of the active model specified in active.json.
    FAIL-FAST: If active.json is missing, unparseable, or specifies missing files,
    returns ready=False with a clear, descriptive error message.
    """
    base = Path(models_dir)
    active_file = base / "active.json"

    if not active_file.is_file():
        return {
            "ready": False,
            "error": "Active model descriptor ('active.json') not found in models directory.",
            "version": None,
            "folder_name": None,
            "artifact_path": None,
            "labels_path": None,
            "metrics": {},
            "feature_importances": [],
        }

    try:
        content = active_file.read_text(encoding="utf-8")
        data = json.loads(content)
    except Exception as exc:
        return {
            "ready": False,
            "error": f"Failed to parse active.json: {exc}",
            "version": None,
            "folder_name": None,
            "artifact_path": None,
            "labels_path": None,
            "metrics": {},
            "feature_importances": [],
        }

    target_folder = data.get("folder")
    target_artifact = data.get("artifact")
    target_labels = data.get("labels")
    target_metadata = data.get("metadata")
    version = data.get("version", "unknown")

    # If folder is specified, resolve within folder
    artifact_file: Path | None = None
    labels_file: Path | None = None
    metadata_file: Path | None = None

    if target_folder:
        folder_path = base / target_folder
        if not folder_path.is_dir():
            return {
                "ready": False,
                "error": f"Active model folder '{target_folder}' specified in active.json was not found.",
                "version": version,
                "folder_name": target_folder,
                "artifact_path": None,
                "labels_path": None,
                "metrics": {},
                "feature_importances": [],
            }
        # Look for artifacts within target_folder
        if target_artifact:
            artifact_file = resolve_file(target_artifact, base)
        if not artifact_file:
            # Auto-find in folder
            cands = list(folder_path.glob("training_recommender*.joblib")) or [f for f in folder_path.glob("*.joblib") if "label" not in f.name.lower()]
            artifact_file = cands[0] if cands else None

        if target_labels:
            labels_file = resolve_file(target_labels, base)
        if not labels_file:
            lcands = list(folder_path.glob("labels*.joblib")) or [f for f in folder_path.glob("*.joblib") if "label" in f.name.lower()]
            labels_file = lcands[0] if lcands else None

        if target_metadata:
            metadata_file = resolve_file(target_metadata, base)
        if not metadata_file:
            mcands = list(folder_path.glob("metadata*.json"))
            metadata_file = mcands[0] if mcands else None
    else:
        # Resolve files directly from target_artifact and target_labels
        artifact_file = resolve_file(target_artifact, base)
        labels_file = resolve_file(target_labels, base)
        metadata_file = resolve_file(target_metadata, base)

    # STRICT CHECK: Both artifact and labels must exist
    if not artifact_file or not artifact_file.is_file():
        missing_spec = target_artifact or f"{target_folder} model pipeline"
        return {
            "ready": False,
            "error": f"Active model artifact specified in active.json ('{missing_spec}') does not exist on disk.",
            "version": version,
            "folder_name": target_folder,
            "artifact_path": None,
            "labels_path": _normalize_path(labels_file) if labels_file else None,
            "metrics": {},
            "feature_importances": [],
        }

    if not labels_file or not labels_file.is_file():
        missing_spec = target_labels or f"{target_folder} labels"
        return {
            "ready": False,
            "error": f"Active model labels file specified in active.json ('{missing_spec}') does not exist on disk.",
            "version": version,
            "folder_name": target_folder,
            "artifact_path": _normalize_path(artifact_file),
            "labels_path": None,
            "metrics": {},
            "feature_importances": [],
        }

    # Load metrics from metadata if available
    metrics = {}
    topics = []
    if metadata_file and metadata_file.is_file():
        try:
            mdata = json.loads(metadata_file.read_text(encoding="utf-8"))
            metrics = mdata.get("metrics", {})
            topics = metrics.get("topics", mdata.get("topics", []))
            if version == "unknown" and mdata.get("version"):
                version = mdata["version"]
        except Exception:
            pass

    # Extract real feature importances from metadata or directly from model artifact
    feature_importances = metrics.get("feature_importances")
    if not feature_importances and artifact_file:
        feature_importances = extract_feature_importances(artifact_file, top_k=6)

    return {
        "ready": True,
        "error": None,
        "version": version,
        "folder_name": target_folder or (artifact_file.parent.name if artifact_file.parent != base else None),
        "artifact_path": _normalize_path(artifact_file),
        "labels_path": _normalize_path(labels_file),
        "metadata_path": _normalize_path(metadata_file) if metadata_file else None,
        "metrics": metrics,
        "topics": topics,
        "feature_importances": feature_importances or [],
    }


def set_active_model_pointer(models_dir: str | Path, target_identifier: str) -> dict[str, Any]:
    """
    Set active model pointer in active.json to target_identifier.
    target_identifier can be a folder name or version.
    Validates that the target model actually exists and is complete before updating active.json.
    """
    base = Path(models_dir)
    detected = detect_model_folders(base)

    matched = None
    target_clean = target_identifier.strip().lower()

    for m in detected:
        f_name = (m.get("folder_name") or "").lower()
        v_name = (m.get("version") or "").lower()
        if target_clean in (f_name, v_name, f"v{v_name}", v_name.lstrip("v")):
            matched = m
            break

    if not matched:
        raise ValueError(f"Model '{target_identifier}' was not found in {models_dir}.")

    if matched["status"] != "ready":
        raise ValueError(
            f"Cannot activate model '{target_identifier}': missing artifact or labels file on disk."
        )

    # Prepare active pointer dict
    active_data = {
        "version": matched["version"],
        "folder": matched["folder_name"],
        "artifact": matched["artifact_path"],
        "labels": matched["labels_path"],
        "metadata": matched["metadata_path"],
        "activated_at": datetime.now(timezone.utc).isoformat(),
    }

    active_file = base / "active.json"
    active_file.write_text(json.dumps(active_data, indent=2), encoding="utf-8")
    return active_data


def import_model_from_zip(
    zip_bytes_or_path: bytes | str | Path,
    models_dir: str | Path,
    user_folder_name: str | None = None,
) -> dict[str, Any]:
    """
    Extract a model zip exported from Colab or Jupyter notebook into its own dedicated folder.
    Auto-detects artifacts, validates completeness, writes active.json, and returns result.
    """
    base = Path(models_dir)
    base.mkdir(parents=True, exist_ok=True)

    # Open zipfile
    if isinstance(zip_bytes_or_path, (str, Path)):
        zf = zipfile.ZipFile(zip_bytes_or_path)
    else:
        import io
        zf = zipfile.ZipFile(io.BytesIO(zip_bytes_or_path))

    file_list = zf.namelist()

    # Determine version from zip contents or metadata
    detected_version = datetime.now(timezone.utc).strftime("v%Y%m%d%H%M%S")
    for fname in file_list:
        m = re.search(r"v(\d{14})", fname)
        if m:
            detected_version = f"v{m.group(1)}"
            break

    # Determine destination folder name
    if user_folder_name and user_folder_name.strip():
        # Sanitize folder name
        folder_name = re.sub(r"[^\w\-.]", "_", user_folder_name.strip())
    else:
        folder_name = detected_version

    dest_folder = base / folder_name
    dest_folder.mkdir(parents=True, exist_ok=True)

    # Extract all files into dest_folder
    for member in zf.infolist():
        # Strip any parent directory prefixes inside the zip (e.g. exported_model/file.joblib -> file.joblib)
        filename = Path(member.filename).name
        if not filename:
            continue
        target_path = dest_folder / filename
        with zf.open(member) as src, open(target_path, "wb") as dst:
            shutil.copyfileobj(src, dst)

    zf.close()

    # Verify extracted contents
    detected = detect_model_folders(base)
    matched = next((m for m in detected if m.get("folder_name") == folder_name), None)

    if not matched or matched["status"] != "ready":
        raise ValueError(
            f"Extraction completed in '{folder_name}', but required model and labels files were not found."
        )

    # Set as active
    active_data = set_active_model_pointer(base, folder_name)

    return {
        "folder_name": folder_name,
        "version": matched["version"],
        "metrics": matched["metrics"],
        "topics": matched["topics"],
        "active_data": active_data,
    }


def sync_registry_with_db(db: Session, models_dir: str | Path) -> dict[str, Any]:
    """
    Synchronize the MySQL model_registry table with the file system:
    1. Discovers all model folders on disk.
    2. Identifies the currently active model from active.json.
    3. Updates or creates records in model_registry.
    4. Ensures ONLY the active version has is_active=True, all others is_active=False.
    """
    base = Path(models_dir)
    detected = detect_model_folders(base)
    active_res = resolve_active_model(base)

    active_version = active_res.get("version") if active_res.get("ready") else None
    active_folder = active_res.get("folder_name") if active_res.get("ready") else None

    # Deactivate all first
    db.query(ModelRegistry).update({"is_active": False})

    synced_count = 0
    activated_record = None

    for m in detected:
        version = m["version"]
        folder_name = m.get("folder_name")
        artifact_path = m["artifact_path"] or f"models/{folder_name}/model.joblib"
        metrics_json = json.dumps(m["metrics"]) if m["metrics"] else "{}"

        is_this_active = False
        if active_res.get("ready"):
            if active_folder and folder_name == active_folder:
                is_this_active = True
            elif active_version and (active_version == version or active_version == folder_name):
                is_this_active = True

        # Check if record exists
        record = db.query(ModelRegistry).filter(ModelRegistry.version == version).first()
        if record:
            record.artifact_path = artifact_path
            record.metrics_json = metrics_json
            record.is_active = is_this_active
        else:
            record = ModelRegistry(
                version=version,
                artifact_path=artifact_path,
                metrics_json=metrics_json,
                is_active=is_this_active,
            )
            db.add(record)

        if is_this_active:
            activated_record = record

        synced_count += 1

    db.commit()

    return {
        "synced_count": synced_count,
        "active_version": activated_record.version if activated_record else active_version,
        "active_is_ready": active_res.get("ready", False),
        "active_error": active_res.get("error"),
    }
