import json
from collections import defaultdict
from typing import Any
from sqlalchemy.orm import Session

from app.ml.predictor import ModelService
from app.services.catalog import get_catalog_service, CatalogService
from app.db.models import RecommendationHistory, TrainingResponse


def match_catalog_items(
    prediction_details: dict[str, Any],
    record: dict[str, Any],
    catalog_service: CatalogService | None = None,
    top_k: int = 5,
) -> list[dict[str, Any]]:
    """
    Matches active catalog training programs to predicted categories and faculty preferences.
    Calculates match_score distinct from prediction probability.
    """
    if catalog_service is None:
        catalog_service = get_catalog_service()

    active_items = catalog_service.get_all_items(include_inactive=False)
    if not active_items:
        return []

    # Map category to prediction probability
    category_probs: dict[str, float] = {}
    for p in prediction_details.get("all_predictions", []):
        cat = p["training_category"]
        category_probs[cat.lower()] = p["probability"]

    # Extract user preferences
    pref_modalities = {m.lower().strip() for m in record.get("preferred_learning_modality", [])}
    pref_schedules = {s.lower().strip() for s in record.get("preferred_schedule", [])}
    pref_durations = {d.lower().strip() for d in record.get("preferred_duration", [])}

    # Extract competency gaps (importance > proficiency)
    user_competency_gaps = set()
    competencies = record.get("competency", {})
    if isinstance(competencies, dict):
        for comp_name, comp_data in competencies.items():
            if isinstance(comp_data, dict):
                prof = comp_data.get("proficiency", 3)
                imp = comp_data.get("importance", 3)
                if imp > prof:
                    user_competency_gaps.add(comp_name.lower().replace("_", " "))

    matches = []

    for item in active_items:
        categories = item.get("categories", [])
        if isinstance(categories, str):
            categories = [categories]

        # Find best matching category probability
        best_prob = 0.0
        matched_cat_name = categories[0] if categories else "General"

        for cat in categories:
            prob = category_probs.get(cat.lower(), 0.0)
            if prob > best_prob:
                best_prob = prob
                matched_cat_name = cat

        if best_prob <= 0.01:
            # Skip items with negligible category match
            continue

        base_score = best_prob
        bonus = 0.0
        reasons = [f"Matches the predicted {matched_cat_name} training need."]

        # Modality match bonus
        item_modalities = {m.lower().strip() for m in item.get("modalities", [])}
        matched_modalities = pref_modalities.intersection(item_modalities)
        if matched_modalities:
            bonus += 0.03
            mod_str = ", ".join(m.title() for m in list(matched_modalities)[:2])
            reasons.append(f"Aligns with preferred modality ({mod_str}).")

        # Schedule match bonus
        item_schedules = {s.lower().strip() for s in item.get("schedules", [])}
        if pref_schedules.intersection(item_schedules):
            bonus += 0.02

        # Duration match bonus
        item_durations = {d.lower().strip() for d in item.get("durations", [])}
        if pref_durations.intersection(item_durations):
            bonus += 0.02

        # Competency gap match bonus
        item_target_comp = {c.lower().strip() for c in item.get("target_competencies", [])}
        if user_competency_gaps.intersection(item_target_comp):
            bonus += 0.03
            reasons.append("Addresses identified competency gap.")

        final_match_score = min(0.99, round(base_score + bonus, 2))

        matches.append({
            "training_id": item.get("training_id", ""),
            "title": item.get("title", ""),
            "category": matched_cat_name,
            "match_score": final_match_score,
            "reason": " ".join(reasons),
            "description": item.get("description", ""),
        })

    # Sort matches by match_score descending
    matches.sort(key=lambda x: x["match_score"], reverse=True)
    return matches[:top_k]


def individual(model: ModelService, record: dict, db: Session | None = None) -> dict[str, Any]:
    """
    Generates transparent individual recommendation response adhering to
    QSU_Training_Catalog_and_Transparent_API.md format.
    Records history in MySQL if db session is provided.
    """
    prediction_details = model.predict_transparent([record])[0]
    recommendations = match_catalog_items(prediction_details, record)

    from datetime import datetime, timezone
    now_iso = datetime.now(timezone.utc).isoformat()
    response_payload = {
        "status": "success",
        "model": {
            "status": "ready",
            "version": model.version or "active",
        },
        "prediction": prediction_details,
        "recommendations": recommendations,
        "generated_at": now_iso,
    }

    if db is not None:
        try:
            hist = RecommendationHistory(
                recommendation_type="individual",
                model_version=model.version or "active",
                request_payload_json=json.dumps(record),
                response_json=json.dumps(response_payload),
            )
            db.add(hist)
            db.commit()
        except Exception as e:
            print(f"Warning recording recommendation history: {e}")

    return response_payload


def department(model: ModelService, records: list[dict], dept_name: str = "BSED", db: Session | None = None) -> dict[str, Any]:
    """
    Generates transparent department recommendation response.
    Aggregates faculty predictions and matches department catalog recommendations.
    Records history in MySQL if db session is provided.
    """
    transparent_preds = model.predict_transparent(records)
    n = len(records)

    totals = defaultdict(float)
    coverage = defaultdict(int)

    for pred in transparent_preds:
        for item in pred.get("all_predictions", []):
            cat = item["training_category"]
            prob = item["probability"]
            totals[cat] += prob
            if prob >= 0.3:
                coverage[cat] += 1

    ranked_categories = sorted(
        totals.keys(),
        key=lambda c: (totals[c] / n, coverage[c] / n),
        reverse=True,
    )

    top_categories = [
        {
            "training_category": cat,
            "department_score": round(totals[cat] / n, 4),
            "faculty_coverage": round(coverage[cat] / n, 4),
            "rank": rank,
        }
        for rank, cat in enumerate(ranked_categories[:5], 1)
    ]

    dept_prediction_mock = {
        "all_predictions": [
            {"training_category": cat["training_category"], "probability": cat["department_score"]}
            for cat in top_categories
        ]
    }
    catalog_recs = match_catalog_items(dept_prediction_mock, record={}, top_k=5)

    now_iso = datetime.now(timezone.utc).isoformat()
    response_payload = {
        "status": "success",
        "department": dept_name,
        "model": {
            "status": "ready",
            "version": model.version or "active",
        },
        "faculty_count": n,
        "prediction": {
            "top_categories": top_categories
        },
        "recommendations": catalog_recs,
        "generated_at": now_iso,
    }

    # Note: RecommendationHistory for department runs is saved by predictions.py
    # (which also attaches department_id). Do NOT save it here to avoid duplicates.

    return response_payload
