"""
Integration & Security Tests: Authentication, RBAC, Data Isolation, Audit Logging
"""
from fastapi.testclient import TestClient
from app.main import app


def test_auth_login_and_me():
    with TestClient(app) as client:
        # 1. Login with default admin account
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "admin", "password": "admin123"},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert "access_token" in data
        token = data["access_token"]
        assert data["user"]["role"] == "system_admin"

        # 2. Query /me profile with Bearer token
        me_res = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_res.status_code == 200, me_res.text
        profile = me_res.json()
        assert profile["username"] == "admin"
        assert profile["role"] == "system_admin"


def test_rbac_access_control():
    with TestClient(app) as client:
        # 1. Unauthenticated request to /me fails
        res = client.get("/api/v1/auth/me")
        assert res.status_code == 401

        # 2. Login as admin
        login_res = client.post(
            "/api/v1/auth/login",
            json={"username": "admin", "password": "admin123"},
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. System Admin can query audit logs
        audit_res = client.get("/api/v1/audit-logs", headers=headers)
        assert audit_res.status_code == 200, audit_res.text
        assert "logs" in audit_res.json()

        # 4. System Admin can list users
        users_res = client.get("/api/v1/users", headers=headers)
        assert users_res.status_code == 200, users_res.text
        assert len(users_res.json()["users"]) > 0
