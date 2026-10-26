from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from app.ml.features import flatten_record


class ModelService:
    """
    Production model service.

    Supports both model directory layouts:

    1. Flat:
        models/
            training_recommender_v20260807154126.joblib
            labels_v20260807154126.joblib

    2. Structured:
        models/
            training/
                training_recommender_v20260807154126.joblib
            labels/
                labels_v20260807154126.joblib
    """

    CATEGORICAL_COLUMNS = [
        "faculty_id",
        "department",
        "sex",
        "employment_status",
        "academic_rank",
        "highest_educational_attainment",
        "field_of_specialization",
        "years_teaching",
        "administrative_designation",
        "trainings_last_3_years",
    ]

    def __init__(
        self,
        model_dir: str | Path = "models",
        labels_path: str | Path | None = None,
    ):
        self.model_dir = Path(model_dir)

        self.pipeline = None
        self.labels = []
        self.version: str | None = None
        self.folder_name: str | None = None
        self.model_path: Path | None = None
        self.labels_path: Path | None = None
        self.metadata_path: Path | None = None
        self.metrics: dict[str, Any] = {}
        self.topics: list[str] = []
        self.load_error: str | None = None
        self.active_mtime: float = 0.0

        self._load_active_model()

    # ============================================================
    # MODEL LOADING (STRICT ACTIVE.JSON PRIORITY)
    # ============================================================

    def _load_active_model(self) -> None:
        """
        Loads the model specified in models/active.json.
        Fails fast if active.json is missing or points to nonexistent files.
        Does NOT silently fall back to random files.
        """
        from app.ml.registry import resolve_active_model

        active_file = self.model_dir / "active.json"
        if active_file.is_file():
            try:
                self.active_mtime = active_file.stat().st_mtime
            except Exception:
                self.active_mtime = 0.0
        else:
            self.active_mtime = 0.0

        info = resolve_active_model(self.model_dir)
        if not info.get("ready"):
            self.pipeline = None
            self.labels = []
            self.version = info.get("version")
            self.folder_name = info.get("folder_name")
            self.model_path = None
            self.labels_path = None
            self.load_error = info.get("error") or "Active model descriptor is invalid or missing."
            print(f"WARNING: {self.load_error}")
            return

        try:
            self.pipeline = joblib.load(info["artifact_path"])
            self.labels = joblib.load(info["labels_path"])
            self.version = info.get("version")
            self.folder_name = info.get("folder_name")
            self.model_path = Path(info["artifact_path"])
            self.labels_path = Path(info["labels_path"])
            self.metadata_path = Path(info["metadata_path"]) if info.get("metadata_path") else None
            self.metrics = info.get("metrics", {})
            self.topics = info.get("topics", [])
            self.load_error = None

            print(
                f"Active model successfully loaded: version={self.version}, "
                f"folder={self.folder_name}, artifact={self.model_path}"
            )
        except Exception as exc:
            self.pipeline = None
            self.labels = []
            self.load_error = f"Failed to deserialize active model artifacts: {exc}"
            print(f"ERROR: {self.load_error}")

    def ensure_active(self) -> None:
        """
        Verifies if active.json has been updated on disk.
        If changed or if model is not loaded, reloads on-the-fly.
        Raises RuntimeError if model is missing or invalid.
        """
        active_file = self.model_dir / "active.json"
        current_mtime = active_file.stat().st_mtime if active_file.is_file() else 0.0

        if current_mtime != self.active_mtime or self.pipeline is None:
            self._load_active_model()

        if not self.ready():
            raise RuntimeError(self.load_error or "Active model is not ready.")

    # ============================================================
    # VERSION
    # ============================================================

    @staticmethod
    def _extract_version(
        filename: str,
    ) -> str:

        stem = Path(filename).stem

        if "_v" in stem:
            return stem.split(
                "_v",
                1,
            )[1]

        return stem

    # ============================================================
    # FIND LABELS
    # ============================================================

    def _find_matching_labels(
        self,
    ) -> Path | None:

        candidates: list[Path] = []

        # --------------------------------------------------------
        # Structured labels directory
        # --------------------------------------------------------

        labels_dir = (
            self.model_dir / "labels"
        )

        if labels_dir.exists():

            candidates.extend(
                labels_dir.glob(
                    "labels_*.joblib"
                )
            )

        # --------------------------------------------------------
        # Flat labels
        # --------------------------------------------------------

        candidates.extend(
            self.model_dir.glob(
                "labels_*.joblib"
            )
        )

        # Remove duplicates
        candidates = list(
            dict.fromkeys(candidates)
        )

        # --------------------------------------------------------
        # Prefer exact version
        # --------------------------------------------------------

        if self.version:

            expected_name = (
                f"labels_v{self.version}.joblib"
            )

            for candidate in candidates:

                if candidate.name == expected_name:
                    return candidate

        # --------------------------------------------------------
        # Fallback to newest
        # --------------------------------------------------------

        if candidates:

            candidates.sort(
                key=lambda p: p.stat().st_mtime,
                reverse=True,
            )

            return candidates[0]

        return None

    # ============================================================
    # READY
    # ============================================================

    def ready(self) -> bool:
        return self.pipeline is not None and self.load_error is None

    # ============================================================
    # EXPECTED FEATURES
    # ============================================================

    def _get_expected_features(
        self,
    ) -> list[str]:

        if self.pipeline is None:
            return []

        # --------------------------------------------------------
        # Pipeline feature_names_in_
        # --------------------------------------------------------

        try:

            if hasattr(
                self.pipeline,
                "feature_names_in_",
            ):

                return list(
                    self.pipeline.feature_names_in_
                )

        except Exception:
            pass

        # --------------------------------------------------------
        # ColumnTransformer
        # --------------------------------------------------------

        try:

            preprocessor = (
                self.pipeline
                .named_steps[
                    "preprocessor"
                ]
            )

            features = []

            for (
                _,
                _,
                columns,
            ) in preprocessor.transformers_:

                if isinstance(
                    columns,
                    (list, tuple),
                ):

                    features.extend(
                        columns
                    )

            return list(features)

        except Exception:
            return []

    # ============================================================
    # NORMALIZE CATEGORICAL DATA
    # ============================================================

    def _normalize_categorical_columns(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        df = df.copy()

        for column in self.CATEGORICAL_COLUMNS:

            if column not in df.columns:
                continue

            # Replace None / NaN
            df[column] = df[column].where(
                df[column].notna(),
                "",
            )

            # IMPORTANT:
            # sklearn OneHotEncoder expects
            # consistent data types.
            df[column] = (
                df[column]
                .astype(str)
            )

        return df

    # ============================================================
    # NORMALIZE NUMERIC DATA
    # ============================================================

    def _normalize_numeric_columns(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        df = df.copy()

        if self.pipeline is None:
            return df

        try:

            preprocessor = (
                self.pipeline
                .named_steps[
                    "preprocessor"
                ]
            )

            for (
                name,
                _,
                columns,
            ) in preprocessor.transformers_:

                if name != "num":
                    continue

                if not isinstance(
                    columns,
                    (list, tuple),
                ):
                    continue

                for column in columns:

                    if column not in df.columns:
                        continue

                    df[column] = (
                        pd.to_numeric(
                            df[column],
                            errors="coerce",
                        )
                        .fillna(0)
                    )

        except Exception:
            pass

        return df

    # ============================================================
    # PREPARE INPUT
    # ============================================================

    def _prepare_input(
        self,
        records: list[dict[str, Any]],
    ) -> pd.DataFrame:

        flattened_records = []

        for record in records:

            flattened = flatten_record(
                record
            )

            flattened_records.append(
                flattened
            )

        df = pd.DataFrame(
            flattened_records
        )

        # --------------------------------------------------------
        # Normalize categorical columns
        # --------------------------------------------------------

        df = (
            self._normalize_categorical_columns(
                df
            )
        )

        # --------------------------------------------------------
        # Normalize numeric columns
        # --------------------------------------------------------

        df = (
            self._normalize_numeric_columns(
                df
            )
        )

        # --------------------------------------------------------
        # Match exact trained schema
        # --------------------------------------------------------

        expected = (
            self._get_expected_features()
        )

        if expected:

            # ----------------------------------------------------
            # Add missing columns
            # ----------------------------------------------------

            for column in expected:

                if column in df.columns:
                    continue

                if (
                    column
                    in self.CATEGORICAL_COLUMNS
                ):

                    df[column] = ""

                else:

                    df[column] = 0

            # ----------------------------------------------------
            # Remove extra columns
            # ----------------------------------------------------

            df = df[
                [
                    column
                    for column in expected
                ]
            ]

            # ----------------------------------------------------
            # Correct order
            # ----------------------------------------------------

            df = df.reindex(
                columns=expected
            )

        return df

    # ============================================================
    # PREDICT
    # ============================================================

    def predict(
        self,
        records: list[dict[str, Any]],
        top_k: int = 5,
    ) -> list[list[dict[str, Any]]]:
        self.ensure_active()

        if not records:
            return []

        # --------------------------------------------------------
        # Prepare input
        # --------------------------------------------------------

        X = self._prepare_input(
            records
        )

        # --------------------------------------------------------
        # Predict
        # --------------------------------------------------------

        probabilities = (
            self.pipeline.predict_proba(X)
        )

        # --------------------------------------------------------
        # Classes
        # --------------------------------------------------------

        try:

            classes = list(
                self.pipeline.classes_
            )

        except Exception:

            try:

                classifier = (
                    self.pipeline
                    .named_steps[
                        "classifier"
                    ]
                )

                classes = list(
                    classifier.classes_
                )

            except Exception:

                classes = list(
                    range(
                        probabilities.shape[1]
                    )
                )

        # --------------------------------------------------------
        # Build recommendations
        # --------------------------------------------------------

        results = []

        for row_probabilities in probabilities:

            ranked_indices = (
                np.argsort(
                    row_probabilities
                )[::-1]
            )

            recommendations = []

            for index in ranked_indices[:top_k]:

                score = float(
                    row_probabilities[
                        index
                    ]
                )

                class_id = classes[index]

                label = (
                    self._resolve_label(
                        class_id
                    )
                )

                recommendations.append(
                    {
                        "training_id": str(
                            class_id
                        ),
                        "training_name": label,
                        "score": round(
                            score,
                            6,
                        ),
                        "percentage": round(
                            score * 100,
                            2,
                        ),
                    }
                )

            results.append(
                recommendations
            )

        return results

    CATEGORY_SURVEY_MAPPING: dict[str, tuple[str, Any]] = {
        "Artificial Intelligence": ("emerging", "artificial_intelligence"),
        "Machine Learning": ("emerging", "machine_learning"),
        "Data Analytics": ("emerging", "data_analytics"),
        "Cybersecurity": ("emerging", "cybersecurity"),
        "Cloud Computing": ("emerging", "cloud_computing"),
        "Learning Management Systems": ("emerging", "learning_management_systems"),
        "Educational Technology": ("emerging", "educational_technology"),
        "Statistical Software": ("emerging", "statistical_software"),
        "Research Methods": ("emerging", "research_methods"),
        "Effective Teaching and Classroom Management": ("competency", "effective_teaching_classroom_management"),
        "Innovative Instructional Material Development": ("competency", "innovative_instructional_material_development"),
        "Outcomes-Based Education": ("competency", "outcomes_based_education"),
        "Quality Assurance Management": ("competency", "quality_assurance_management"),
        "Research and Publication Writing": ("competency", "publication_writing"),
        "Leadership and Strategic Management": ("competency", ["strategic_thinking", "leading_change"]),
        "Critical Thinking and Problem Solving": ("competency", "critical_thinking_problem_solving"),
        "Technology Transfer and Innovation": ("competency", "technology_transfer_innovation"),
    }

    def _extract_survey_signal(self, record: dict[str, Any], category: str) -> float | None:
        if not isinstance(record, dict):
            return None
        mapping = self.CATEGORY_SURVEY_MAPPING.get(category)
        if not mapping:
            return None
        kind, keys = mapping
        if kind == "emerging":
            val = record.get("emerging_training_needs", {}).get(keys)
            if val is not None:
                try:
                    return float(val) / 5.0
                except (ValueError, TypeError):
                    pass
        elif kind == "competency":
            key_list = [keys] if isinstance(keys, str) else keys
            comp_dict = record.get("competency", {})
            scores = []
            for k in key_list:
                c = comp_dict.get(k)
                if isinstance(c, dict) and "proficiency" in c and "importance" in c:
                    try:
                        prof = float(c.get("proficiency", 3))
                        imp = float(c.get("importance", 3))
                        gap = max(0.0, imp - prof)
                        scores.append(0.6 * (gap / 4.0) + 0.4 * (imp / 5.0))
                    except (ValueError, TypeError):
                        pass
            if scores:
                return sum(scores) / len(scores)
        return None

    # ============================================================
    # TRANSPARENT CATEGORY PREDICTIONS
    # ============================================================

    def predict_transparent(
        self,
        records: list[dict[str, Any]],
        top_k: int = 3,
    ) -> list[dict[str, Any]]:
        self.ensure_active()
        if not records:
            return []

        X = self._prepare_input(records)
        probabilities = self.pipeline.predict_proba(X)

        try:
            classes = list(self.pipeline.classes_)
        except Exception:
            try:
                classifier = self.pipeline.named_steps["classifier"]
                classes = list(classifier.classes_)
            except Exception:
                classes = list(range(probabilities.shape[1]))

        results = []
        for rec, row_probabilities in zip(records, probabilities):
            scored_predictions = []

            for index in range(len(classes)):
                raw_prob = float(row_probabilities[index])
                class_id = classes[index]
                label = self._resolve_label(class_id)
                survey_signal = self._extract_survey_signal(rec, label)

                if survey_signal is not None:
                    # 40% learned model demographic/profile probability + 60% faculty questionnaire stated assessment
                    final_score = round(0.40 * raw_prob + 0.60 * survey_signal, 4)
                else:
                    final_score = round(raw_prob, 4)

                scored_predictions.append({
                    "training_category": label,
                    "probability": final_score,
                })

            # Sort by personalized score descending
            scored_predictions.sort(key=lambda x: x["probability"], reverse=True)

            top_predictions = []
            all_predictions = []

            for rank, item in enumerate(scored_predictions, 1):
                item_with_rank = {
                    "training_category": item["training_category"],
                    "probability": item["probability"],
                    "rank": rank,
                }
                if rank <= top_k:
                    top_predictions.append(item_with_rank)

                all_predictions.append({
                    "training_category": item["training_category"],
                    "probability": item["probability"],
                })

            results.append({
                "top_predictions": top_predictions,
                "all_predictions": all_predictions,
            })

        return results

    # ============================================================
    # LABEL RESOLUTION
    # ============================================================

    def _resolve_label(
        self,
        class_id: Any,
    ) -> str:

        # --------------------------------------------------------
        # MultiLabelBinarizer / object with classes_
        # --------------------------------------------------------

        if hasattr(self.labels, "classes_"):
            try:
                index = int(class_id)
                classes_arr = list(self.labels.classes_)
                if 0 <= index < len(classes_arr):
                    return str(classes_arr[index])
            except (ValueError, TypeError):
                pass

        # --------------------------------------------------------
        # Dictionary
        # --------------------------------------------------------

        if isinstance(
            self.labels,
            dict,
        ):

            value = self.labels.get(
                class_id
            )

            if value is None:

                value = self.labels.get(
                    str(class_id)
                )

            if value is not None:

                return str(value)

        # --------------------------------------------------------
        # List / tuple
        # --------------------------------------------------------

        if isinstance(
            self.labels,
            (list, tuple),
        ):

            try:

                index = int(
                    class_id
                )

                if (
                    0
                    <= index
                    < len(self.labels)
                ):

                    return str(
                        self.labels[index]
                    )

            except (
                ValueError,
                TypeError,
            ):
                pass

        # --------------------------------------------------------
        # Fallback
        # --------------------------------------------------------

        return str(
            class_id
        )

