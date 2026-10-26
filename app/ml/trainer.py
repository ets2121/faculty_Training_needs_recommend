from __future__ import annotations

import io
from pathlib import Path
from datetime import datetime, timezone
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    hamming_loss,
    jaccard_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer, OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline

from app.ml.features import to_frame

TARGETS = [f"priority_{i}" for i in range(1, 6)]


# ---------------------------------------------------------------------------
# Survey Data Cleaning — identical logic used in Colab notebook Cell 2.5
# Normalizes free-text categorical fields before training
# ---------------------------------------------------------------------------

def clean_survey_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """
    Standardize raw survey categorical fields to consistent canonical values.
    Mirrors the Colab notebook Cell 2.5 cleaning logic exactly.

    Fields cleaned:
    - academic_rank          → 5 SUC rank categories
    - highest_educational_attainment → 3 degree tiers
    - field_of_specialization → 9 academic cluster labels
    """
    df = df.copy()

    # ── Strip whitespace + normalise 'nan'/'None' strings ────────────────────
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace({"nan": "", "None": ""})

    # ── Academic Rank ─────────────────────────────────────────────────────────
    def _map_rank(r: str) -> str:
        r_low = r.lower()
        if "cos" in r_low or "contract" in r_low:
            return "COS / Contractual Instructor"
        if "assoc" in r_low:
            return "Associate Professor"
        if "assist" in r_low or "assit" in r_low or "ptofessor" in r_low:
            return "Assistant Professor"
        if "prof" in r_low:
            return "Professor"
        return "Instructor"  # default (covers 'inst', blanks, etc.)

    if "academic_rank" in df.columns:
        df["academic_rank"] = df["academic_rank"].apply(_map_rank)

    # ── Highest Educational Attainment ────────────────────────────────────────
    def _map_degree(d: str) -> str:
        d_low = d.lower()
        if any(k in d_low for k in ["doc", "phd", "edd"]):
            return "Doctorate Degree"
        if any(k in d_low for k in ["mast", "mater", "masrer", "maed", "ms ", "mba"]):
            return "Master's Degree"
        return "Bachelor's Degree"  # default

    if "highest_educational_attainment" in df.columns:
        df["highest_educational_attainment"] = df["highest_educational_attainment"].apply(_map_degree)

    # ── Field of Specialization → 9 Academic Clusters ─────────────────────────
    def _map_spec(s: str) -> str:
        s_low = s.lower()
        if any(w in s_low for w in ["it", "comput", "data", "web", "software",
                                     "ai", "program", "network", "cyber", "tech"]):
            if "livelihood" not in s_low and "home" not in s_low:
                return "Information Technology & Computing"
        if any(w in s_low for w in ["hotel", "hospitality", "tourism", "culinary",
                                     "pastry", "hrm", "bstm", "bshm"]):
            return "Hospitality & Tourism Management"
        if any(w in s_low for w in ["crim", "forensic", "law", "justice",
                                     "investigation", "cdi"]):
            return "Criminology & Criminal Justice"
        if any(w in s_low for w in ["educ", "teach", "maed", "pedagogy",
                                     "btled", "beed", "bsed"]):
            return "Education & Pedagogy"
        if any(w in s_low for w in ["busin", "market", "account", "office",
                                     "admin", "manage", "bsoa", "bsba"]):
            return "Business & Management"
        if any(w in s_low for w in ["agri", "crop", "soil", "animal",
                                     "forest", "fisher", "vet"]):
            return "Agriculture & Forestry"
        if any(w in s_low for w in ["nutri", "diet", "midwi", "nurse",
                                     "nurs", "health", "maternal", "clinic"]):
            return "Health & Nutrition"
        if any(w in s_low for w in ["engin", "civil", "electr"]):
            return "Engineering"
        return "General Education & Sciences"  # catch-all

    if "field_of_specialization" in df.columns:
        df["field_of_specialization"] = df["field_of_specialization"].apply(_map_spec)

    return df

# ---------------------------------------------------------------------------
# Dataset loader — accepts CSV or Excel bytes, returns validated DataFrame
# ---------------------------------------------------------------------------

def load_dataset_file(file_bytes: bytes, filename: str) -> pd.DataFrame:
    """
    Parse uploaded dataset bytes (CSV or Excel) into a validated DataFrame.

    Validation rules:
    - File must be .csv, .xlsx, or .xls
    - Must contain at least one of priority_1..priority_5 target columns
    - Must have at least 50 rows
    - Returns a clean pd.DataFrame ready for training
    """
    fname = filename.lower()

    try:
        if fname.endswith(".csv"):
            # Try UTF-8 first, then latin-1 fallback
            try:
                df = pd.read_csv(io.BytesIO(file_bytes), encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(file_bytes), encoding="latin-1")
        elif fname.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl")
        elif fname.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(file_bytes), engine="xlrd")
        else:
            raise ValueError(
                f"Unsupported file format '{filename}'. "
                "Please upload a .csv, .xlsx, or .xls file."
            )
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f"Failed to parse '{filename}': {exc}") from exc

    if df.empty:
        raise ValueError("The uploaded file is empty. Please provide a dataset with at least 50 rows.")

    # Check target columns exist
    missing = [t for t in TARGETS if t not in df.columns]
    if missing:
        raise ValueError(
            f"Required target column(s) missing from dataset: {missing}. "
            "The dataset must contain columns priority_1 through priority_5. "
            "Make sure you are uploading the formatted faculty_training.csv (not a raw survey export)."
        )

    # Check minimum records
    if len(df) < 50:
        raise ValueError(
            f"Dataset has only {len(df)} records — at least 50 are required for a reliable training run."
        )

    return df


# ---------------------------------------------------------------------------
# Core trainer — mirrors Colab notebook exactly
# ---------------------------------------------------------------------------

def train_from_dataframe(
    df: pd.DataFrame,
    model_dir: str,
    custom_folder_name: str | None = None,
) -> dict:
    """
    Train a multi-label Random Forest recommender following the exact Colab process:
    - 80/20 train/test split (random_state=42)
    - OneVsRest RandomForest(n_estimators=400, min_samples_leaf=2,
                              class_weight='balanced_subsample', random_state=42)
    - Full metric suite: exact_match, hamming, jaccard, top-1/3/5 hit accuracy,
      micro/macro F1, precision, recall
    - Feature importances from RF estimators
    - Metadata JSON matching Colab export format
    - active.json pointer updated atomically
    """
    if len(df) < 50:
        raise ValueError("At least 50 records are required for a development training run.")

    # ── Data Cleaning (mirrors Colab Cell 2.5) ────────────────────────────────
    df = clean_survey_dataset(df)

    # ── Build multi-label targets ──────────────────────────────────────────────
    labels = [
        sorted(set(
            str(x).strip() for x in row
            if pd.notna(x) and str(x).strip() not in ("", "nan")
        ))
        for row in df[TARGETS].values.tolist()
    ]
    all_topics = sorted(set(x for row in labels for x in row))

    if not all_topics:
        raise ValueError(
            "No training categories found in priority_1..priority_5 columns. "
            "Ensure at least one non-empty value exists in those columns."
        )

    mlb = MultiLabelBinarizer(classes=all_topics)
    y = mlb.fit_transform(labels)

    # ── Feature matrix ─────────────────────────────────────────────────────────
    exclude_cols = TARGETS + ["faculty_id"]
    X_raw = df.drop(columns=exclude_cols, errors="ignore")

    cat_cols = X_raw.select_dtypes(include=["object"]).columns.tolist()
    num_cols = [c for c in X_raw.columns if c not in cat_cols]

    # ── Pipeline — identical to Colab Cell 6 ──────────────────────────────────
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

    # ── Strict 80% / 20% split — identical to Colab Cell 4 ───────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X_raw, y, test_size=0.20, train_size=0.80, random_state=42
    )

    pipeline.fit(X_train, y_train)

    # ── Predictions ─────────────────────────────────────────────────────────
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)

    total_test = len(y_test)

    # ── 1. Multi-Label Accuracy Metrics ────────────────────────────────────────
    exact_match_acc = float(accuracy_score(y_test, y_pred))
    hamming_acc     = float(1.0 - hamming_loss(y_test, y_pred))
    jaccard_acc     = float(jaccard_score(y_test, y_pred, average="samples", zero_division=0))

    # ── 2. Top-K Recommendation Hit Accuracy (Colab Cell 7) ──────────────────
    top1_hits = top3_hits = top5_hits = 0
    for i in range(total_test):
        true_indices = np.where(y_test[i] == 1)[0]
        pred_ranked  = np.argsort(y_prob[i])[::-1]
        if pred_ranked[0] in true_indices:
            top1_hits += 1
        if any(p in true_indices for p in pred_ranked[:3]):
            top3_hits += 1
        if any(p in true_indices for p in pred_ranked[:5]):
            top5_hits += 1

    top1_accuracy = top1_hits / total_test
    top3_accuracy = top3_hits / total_test
    top5_accuracy = top5_hits / total_test

    # ── 3. Micro / Macro F1, Precision, Recall ────────────────────────────────
    micro_f1        = float(f1_score(y_test, y_pred, average="micro", zero_division=0))
    macro_f1        = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
    micro_precision = float(precision_score(y_test, y_pred, average="micro", zero_division=0))
    micro_recall    = float(recall_score(y_test, y_pred, average="micro", zero_division=0))

    # ── 4. Feature Importances — identical to Colab Cell 7 ───────────────────
    pre_step = pipeline.named_steps["preprocessor"]
    clf_step = pipeline.named_steps["classifier"]
    f_names  = pre_step.get_feature_names_out()
    imp_mean = np.mean([est.feature_importances_ for est in clf_step.estimators_], axis=0)
    top_imp_idx = np.argsort(imp_mean)[::-1][:6]
    max_imp  = float(imp_mean[top_imp_idx[0]]) if len(top_imp_idx) > 0 and imp_mean[top_imp_idx[0]] > 0 else 1.0
    palette  = ["#10b981", "#0284c7", "#f59e0b", "#e11d48", "#8b5cf6", "#64748b"]

    def _clean_feature_name(n: str) -> str:
        n = n.replace("num__", "").replace("cat__", "")
        return (
            " ".join(n.split("_"))
            .title()
            .replace("Obe", "Outcomes-Based Education (OBE)")
            .replace("Ict", "ICT")
            .replace("Ai", "Artificial Intelligence")
            .replace("Lms", "LMS")
        )

    feature_importances = [
        {
            "label": _clean_feature_name(f_names[idx]),
            "value": max(10, min(100, round((float(imp_mean[idx]) / max_imp) * 100))),
            "raw_importance": round(float(imp_mean[idx]), 4),
            "color": palette[i % len(palette)],
        }
        for i, idx in enumerate(top_imp_idx)
    ]

    # ── Full metrics dict — matches Colab metadata exactly ────────────────────
    metrics = {
        "exact_match_accuracy": round(exact_match_acc, 4),
        "hamming_accuracy":     round(hamming_acc, 4),
        "jaccard_accuracy":     round(jaccard_acc, 4),
        "top1_hit_accuracy":    round(top1_accuracy, 4),
        "top3_hit_accuracy":    round(top3_accuracy, 4),
        "top5_hit_accuracy":    round(top5_accuracy, 4),
        "micro_f1":             round(micro_f1, 4),
        "macro_f1":             round(macro_f1, 4),
        "micro_precision":      round(micro_precision, 4),
        "micro_recall":         round(micro_recall, 4),
        "training_records":     int(len(X_train)),
        "test_records":         int(len(X_test)),
        "train_ratio":          0.80,
        "test_ratio":           0.20,
        "feature_importances":  feature_importances,
    }

    # ── Persist artifacts ─────────────────────────────────────────────────────
    version = datetime.now(timezone.utc).strftime("v%Y%m%d%H%M%S")

    # Determine folder name: user-supplied, or auto version
    if custom_folder_name and custom_folder_name.strip():
        folder_name = custom_folder_name.strip()
    else:
        folder_name = version

    model_path = Path(model_dir)
    dest_dir   = model_path / folder_name
    dest_dir.mkdir(parents=True, exist_ok=True)

    artifact   = dest_dir / f"training_recommender_{version}.joblib"
    labels_path = dest_dir / f"labels_{version}.joblib"
    meta_path  = dest_dir / f"metadata_{version}.json"

    joblib.dump(pipeline, artifact)
    joblib.dump(mlb, labels_path)

    # metadata.json — Colab-compatible format (no folder key, relative model paths)
    meta_dict = {
        "version":    version,
        "artifact":   f"models/{folder_name}/training_recommender_{version}.joblib",
        "labels":     f"models/{folder_name}/labels_{version}.joblib",
        "metrics":    metrics,
        "topics":     all_topics,
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }
    meta_path.write_text(json.dumps(meta_dict, indent=2), encoding="utf-8")

    # active.json — atomic pointer (includes folder for quick resolution)
    active_dict = {
        "version":      version,
        "folder":       folder_name,
        "artifact":     str(artifact).replace("\\", "/"),
        "labels":       str(labels_path).replace("\\", "/"),
        "metadata":     str(meta_path).replace("\\", "/"),
        "activated_at": datetime.now(timezone.utc).isoformat(),
    }
    (model_path / "active.json").write_text(
        json.dumps(active_dict, indent=2), encoding="utf-8"
    )

    return {
        "version":     version,
        "folder":      folder_name,
        "metrics":     metrics,
        "artifact":    str(artifact).replace("\\", "/"),
        "labels":      str(labels_path).replace("\\", "/"),
        "metadata":    str(meta_path).replace("\\", "/"),
        "topics":      all_topics,
        "total_records": int(len(df)),
    }
