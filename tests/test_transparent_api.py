import json
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app


def test_individual_recommendation_transparent_api():
    demo_path = Path("demo-request-body.json")
    assert demo_path.exists()

    with open(demo_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    with TestClient(app) as client:
        response = client.post("/api/v1/test/recommendations/individual", json=payload)
        assert response.status_code == 200, response.text
        data = response.json()

        # 1. Top-level transparent schema keys
        assert data["status"] == "success"
        assert "model" in data
        assert "prediction" in data
        assert "recommendations" in data

        # 2. Model section
        assert data["model"]["status"] == "ready"
        assert "version" in data["model"]

        # 3. Prediction section (model outputs categories, not catalog titles)
        prediction = data["prediction"]
        assert "top_predictions" in prediction
        assert "all_predictions" in prediction
        assert len(prediction["top_predictions"]) > 0

        first_pred = prediction["top_predictions"][0]
        assert "training_category" in first_pred
        assert "probability" in first_pred
        assert "rank" in first_pred
        assert first_pred["rank"] == 1

        # 4. Recommendations section (catalog items matched)
        recs = data["recommendations"]
        assert len(recs) > 0
        first_rec = recs[0]
        assert "training_id" in first_rec
        assert "title" in first_rec
        assert "category" in first_rec
        assert "match_score" in first_rec
        assert "reason" in first_rec


def test_department_recommendation_transparent_api():
    demo_path = Path("demo-request-body.json")
    with open(demo_path, "r", encoding="utf-8") as f:
        faculty_obj = json.load(f)["faculty"]

    dept_payload = {
        "department": "BSED",
        "faculty": [faculty_obj, faculty_obj]
    }

    with TestClient(app) as client:
        response = client.post("/api/v1/test/recommendations/department", json=dept_payload)
        assert response.status_code == 200, response.text
        data = response.json()

        assert data["status"] == "success"
        assert data["department"] == "BSED"
        assert data["faculty_count"] == 2
        assert "top_categories" in data["prediction"]
        assert len(data["recommendations"]) > 0


def test_catalog_api_filter_and_add():
    with TestClient(app) as client:
        # 1. List catalog
        res = client.get("/api/v1/catalog")
        assert res.status_code == 200
        items = res.json()["items"]
        # Verify inactive item is excluded by default
        inactive_items = [i for i in items if i.get("status") == "inactive"]
        assert len(inactive_items) == 0

        # 2. Add dynamic catalog item without model retraining
        new_item = {
            "title": "AI Tools for Academic Writing and Literature Review",
            "description": "Practical session on utilizing generative AI tools for academic literature synthesis.",
            "categories": ["Artificial Intelligence", "Research Methods"],
            "target_competencies": ["Research and Publication Writing"],
            "modalities": ["Webinar"],
            "durations": ["One day"],
            "schedules": ["Saturdays"],
            "status": "active"
        }

        from app.core.config import get_settings
        settings = get_settings()

        add_res = client.post(
            "/api/v1/catalog",
            json=new_item,
            headers={"X-Admin-API-Key": settings.admin_api_key}
        )
        assert add_res.status_code == 200, add_res.text
        assert add_res.json()["status"] == "success"
        assert "without model retraining" in add_res.json()["message"]


def test_incomplete_faculty_record():
    incomplete_payload = {
        "faculty": {
            "department": "BSIT",
            "age": 30
        }
    }
    with TestClient(app) as client:
        response = client.post("/api/v1/test/recommendations/individual", json=incomplete_payload)
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["status"] == "success"
        assert len(data["recommendations"]) > 0
