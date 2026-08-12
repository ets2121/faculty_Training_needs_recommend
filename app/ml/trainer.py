from __future__ import annotations
from pathlib import Path
from datetime import datetime, timezone
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer, OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline

from app.ml.features import to_frame

TARGETS = [f"priority_{i}" for i in range(1, 6)]

def train_from_dataframe(df: pd.DataFrame, model_dir: str) -> dict:
    if len(df) < 50:
        raise ValueError("At least 50 records are required for a development training run.")

    labels = [sorted(set(x for x in row if pd.notna(x))) for row in df[TARGETS].values.tolist()]
    all_topics = sorted(set(x for row in labels for x in row))
    mlb = MultiLabelBinarizer(classes=all_topics)
    y = mlb.fit_transform(labels)

    X_raw = df.drop(columns=TARGETS, errors="ignore")
    cat_cols = X_raw.select_dtypes(include=["object"]).columns.tolist()
    num_cols = [c for c in X_raw.columns if c not in cat_cols]

    pre = ColumnTransformer([
        ("num", StandardScaler(), num_cols),
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
    ])

    classifier = OneVsRestClassifier(
        RandomForestClassifier(
            n_estimators=400,
            min_samples_leaf=2,
            class_weight="balanced_subsample",
            random_state=42,
            n_jobs=-1,
        )
    )

    pipeline = Pipeline([("preprocessor", pre), ("classifier", classifier)])
    X_train, X_test, y_train, y_test = train_test_split(
        X_raw, y, test_size=0.2, random_state=42
    )
    pipeline.fit(X_train, y_train)

    pred = pipeline.predict(X_test)
    metrics = {
        "micro_f1": float(f1_score(y_test, pred, average="micro", zero_division=0)),
        "macro_f1": float(f1_score(y_test, pred, average="macro", zero_division=0)),
        "micro_precision": float(precision_score(y_test, pred, average="micro", zero_division=0)),
        "micro_recall": float(recall_score(y_test, pred, average="micro", zero_division=0)),
        "test_records": int(len(X_test)),
        "training_records": int(len(X_train)),
        "topics": all_topics,
    }

    version = datetime.now(timezone.utc).strftime("v%Y%m%d%H%M%S")
    model_path = Path(model_dir)
    model_path.mkdir(parents=True, exist_ok=True)
    artifact = model_path / f"training_recommender_{version}.joblib"
    labels_path = model_path / f"labels_{version}.joblib"
    meta_path = model_path / f"metadata_{version}.json"

    joblib.dump(pipeline, artifact)
    joblib.dump(mlb, labels_path)
    meta_path.write_text(json.dumps({
        "version": version,
        "artifact": str(artifact),
        "labels": str(labels_path),
        "metrics": metrics,
    }, indent=2))

    # Atomic-ish pointer file used by the API to find the active model.
    (model_path / "active.json").write_text(json.dumps({
        "version": version,
        "artifact": str(artifact),
        "labels": str(labels_path),
        "metadata": str(meta_path),
    }, indent=2))

    return {"version": version, "metrics": metrics, "artifact": str(artifact)}
