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
        self.model_path: Path | None = None
        self.labels_path: Path | None = None

        self._load_model(labels_path)

    # ============================================================
    # MODEL LOADING
    # ============================================================

    def _load_model(
        self,
        labels_path: str | Path | None = None,
    ) -> None:

        if not self.model_dir.exists():
            print(
                f"WARNING: Model directory does not exist: {self.model_dir}. "
                "No model loaded — service will return HTTP 503 until a model is trained."
            )
            return

        model_files: list[Path] = []

        # --------------------------------------------------------
        # STRUCTURED DIRECTORY
        # --------------------------------------------------------

        training_dir = self.model_dir / "training"

        if training_dir.exists():
            model_files.extend(
                training_dir.glob(
                    "training_recommender_*.joblib"
                )
            )

        # --------------------------------------------------------
        # FLAT DIRECTORY
        # --------------------------------------------------------

        model_files.extend(
            self.model_dir.glob(
                "training_recommender_*.joblib"
            )
        )

        # Remove duplicates
        model_files = list(
            dict.fromkeys(model_files)
        )

        if not model_files:
            print(
                "WARNING: No trained model found. "
                f"Checked: {self.model_dir} and {self.model_dir / 'training'}. "
                "Service will return HTTP 503 until a model is trained."
            )
            return

        # Newest model
        model_files.sort(
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )

        model_path = model_files[0]

        self.model_path = model_path

        # --------------------------------------------------------
        # LOAD MODEL
        # --------------------------------------------------------

        self.pipeline = joblib.load(
            model_path
        )

        print(
            f"Model loaded: {model_path}"
        )

        # --------------------------------------------------------
        # VERSION
        # --------------------------------------------------------

        self.version = self._extract_version(
            model_path.name
        )

        # --------------------------------------------------------
        # LABELS
        # --------------------------------------------------------

        if labels_path is not None:

            label_file = Path(
                labels_path
            )

            if not label_file.exists():
                raise FileNotFoundError(
                    f"Labels file does not exist: "
                    f"{label_file}"
                )

        else:

            label_file = (
                self._find_matching_labels()
            )

        if label_file is not None:

            self.labels_path = label_file

            self.labels = joblib.load(
                label_file
            )

            print(
                f"Labels loaded: {label_file}"
            )

        else:

            print(
                "WARNING: No labels file found."
            )

        print(
            f"Model version: {self.version}"
        )

        expected = (
            self._get_expected_features()
        )

        print(
            f"Expected features: {len(expected)}"
        )

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

        return self.pipeline is not None

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

        if not self.ready():

            raise RuntimeError(
                "Model is not loaded."
            )

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

    # ============================================================
    # TRANSPARENT CATEGORY PREDICTIONS
    # ============================================================

    def predict_transparent(
        self,
        records: list[dict[str, Any]],
        top_k: int = 5,
    ) -> list[dict[str, Any]]:
        if not self.ready():
            raise RuntimeError("Model is not loaded.")
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
        for row_probabilities in probabilities:
            ranked_indices = np.argsort(row_probabilities)[::-1]

            top_predictions = []
            all_predictions = []

            for rank, index in enumerate(ranked_indices, 1):
                score = float(row_probabilities[index])
                class_id = classes[index]
                label = self._resolve_label(class_id)
                prob_rounded = round(score, 4)

                if rank <= top_k:
                    top_predictions.append({
                        "training_category": label,
                        "probability": prob_rounded,
                        "rank": rank,
                    })

                all_predictions.append({
                    "training_category": label,
                    "probability": prob_rounded,
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

