"""
Tests for Multi-Part Questionnaire, Status Persistence, Department Recommendation Filtering, and Non-Auth Test Endpoints
"""
import uuid
from fastapi.testclient import TestClient
from app.main import app


def test_no_auth_recommendation_endpoints():
    with TestClient(app) as client:
        # Test non-auth individual recommendation
        payload = {
            "faculty": {
                "department": "BSIT",
                "age": 35,
                "sex": "Male",
                "employment_status": "Permanent",
                "academic_rank": "Assistant Professor",
                "highest_educational_attainment": "Master's Degree",
                "field_of_specialization": "Computer Science",
                "years_teaching": "5-10 years",
                "administrative_designation": "None",
                "trainings_last_3_years": "1-2",
                "training_areas": ["Instruction", "Research"],
                "competency": {
                    "research_competency": {"proficiency": 2, "importance": 5},
                    "computer_literacy_digital_technologies": {"proficiency": 3, "importance": 5}
                },
                "emerging_training_needs": {
                    "artificial_intelligence": 5,
                    "machine_learning": 4,
                    "educational_technology": 5
                },
                "preferred_learning_modality": ["Webinar"],
                "preferred_schedule": ["Saturdays"],
                "preferred_duration": ["Two days"],
                "barriers": {"time_constraints": 4}
            }
        }
        res = client.post("/api/v1/test/recommendations/individual", json=payload)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["_test_mode"] is True
        assert "prediction" in data

        # Test non-auth department recommendation
        dept_payload = {
            "department": "BSIT",
            "faculty": [payload["faculty"]]
        }
        dept_res = client.post("/api/v1/test/recommendations/department", json=dept_payload)
        assert dept_res.status_code == 200, dept_res.text
        dept_data = dept_res.json()
        assert dept_data["_test_mode"] is True
        assert "prediction" in dept_data


def test_questionnaire_lifecycle_and_recommendation():
    uid = uuid.uuid4().hex[:6]
    dept_username = f"dept_head_{uid}"
    fac_username = f"fac_user_{uid}"

    with TestClient(app) as client:
        # 1. Login as Admin
        admin_login = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
        assert admin_login.status_code == 200
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 2. Admin creates a department_admin
        dept_admin_res = client.post(
            "/api/v1/auth/register",
            headers=admin_headers,
            json={
                "username": dept_username,
                "password": "password123",
                "full_name": "Test Dept Head",
                "role": "department_admin",
                "department_code": "BSIT",
                "campus_code": "DIFFUN"
            }
        )
        assert dept_admin_res.status_code == 201

        # 3. Login as department_admin
        dept_login = client.post("/api/v1/auth/login", json={"username": dept_username, "password": "password123"})
        assert dept_login.status_code == 200
        dept_token = dept_login.json()["access_token"]
        dept_headers = {"Authorization": f"Bearer {dept_token}"}

        # 4. Department admin creates a faculty account
        fac_res = client.post(
            "/api/v1/auth/register",
            headers=dept_headers,
            json={
                "username": fac_username,
                "password": "password123",
                "full_name": "Test Faculty Member",
                "role": "faculty",
                "department_code": "BSIT",
                "faculty_code": f"TEST-BSIT-{uid}"
            }
        )
        assert fac_res.status_code == 201

        # 5. Login as Faculty
        fac_login = client.post("/api/v1/auth/login", json={"username": fac_username, "password": "password123"})
        assert fac_login.status_code == 200
        fac_token = fac_login.json()["access_token"]
        fac_headers = {"Authorization": f"Bearer {fac_token}"}

        # 6. Check progress — initially not_started
        prog_res = client.get("/api/v1/questionnaire/progress", headers=fac_headers)
        assert prog_res.status_code == 200
        assert prog_res.json()["questionnaire_status"] == "not_started"

        # 7. Submit Part 1 — status becomes in_progress
        p1 = client.put("/api/v1/questionnaire/parts/1", headers=fac_headers, json={
            "department": "BSIT", "age": 30, "sex": "Male", "employment_status": "Permanent"
        })
        assert p1.status_code == 200
        assert p1.json()["questionnaire_status"] == "in_progress"

        # 8. Try submitting Part 3 out of order — fails with 400
        p3_fail = client.put("/api/v1/questionnaire/parts/3", headers=fac_headers, json={
            "academic_rank": "Instructor I", "years_teaching": "1-4 years", "trainings_last_3_years": "1"
        })
        assert p3_fail.status_code == 400

        # 9. Submit Part 2, Part 3, Part 4, Part 5, Part 6 sequentially
        client.put("/api/v1/questionnaire/parts/2", headers=fac_headers, json={
            "highest_educational_attainment": "Master's Degree", "field_of_specialization": "IT"
        })
        client.put("/api/v1/questionnaire/parts/3", headers=fac_headers, json={
            "academic_rank": "Instructor I", "years_teaching": "1-4 years", "trainings_last_3_years": "1"
        })
        client.put("/api/v1/questionnaire/parts/4", headers=fac_headers, json={
            "training_areas": [], "training_modalities_attended": []
        })
        client.put("/api/v1/questionnaire/parts/5", headers=fac_headers, json={
            "competency": {"research": {"proficiency": 3, "importance": 5}}
        })
        p6 = client.put("/api/v1/questionnaire/parts/6", headers=fac_headers, json={
            "emerging_training_needs": {"artificial_intelligence": 5, "data_analytics": 4}
        })
        assert p6.status_code == 200
        assert p6.json()["questionnaire_status"] == "eligible"

        # 10. Request recommendation as faculty — stores result and sets status to has_recommendation
        rec_res = client.post("/api/v1/profile/request-recommendation", headers=fac_headers)
        assert rec_res.status_code == 200, rec_res.text
        assert "prediction" in rec_res.json()

        # 11. Verify last recommendation is saved on faculty profile
        last_rec = client.get("/api/v1/profile/last-recommendation", headers=fac_headers)
        assert last_rec.status_code == 200
        assert last_rec.json()["questionnaire_status"] == "has_recommendation"
        assert last_rec.json()["recommendation"] is not None

        # 12. Run Department Recommendation as department_admin — includes eligible/has_recommendation faculty
        dept_rec = client.post("/api/v1/recommendations/department", headers=dept_headers)
        assert dept_rec.status_code == 200, dept_rec.text
        assert dept_rec.json()["eligible_faculty_count"] >= 1
