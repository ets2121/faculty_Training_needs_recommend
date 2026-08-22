# QSU Faculty Training Recommender — API Reference v3.0

> **Version 3.0** — Multi-Campus · RBAC · Transparent Recommendations · Match Scores

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Server Setup](#2-server-setup)
3. [Authentication](#3-authentication)
4. [Account Hierarchy & RBAC](#4-account-hierarchy--rbac)
5. [Questionnaire Status Lifecycle](#5-questionnaire-status-lifecycle)
6. [Endpoints Reference](#6-endpoints-reference)
   - [Health](#61-health)
   - [Auth — Login & Register](#62-auth--login--register)
   - [Profile — Faculty Self-Service](#63-profile--faculty-self-service)
   - [Questionnaire — Multi-Part Form](#64-questionnaire--multi-part-form)
   - [Users — Admin Management](#65-users--admin-management)
   - [Campuses & Departments](#66-campuses--departments)
   - [Recommendations](#67-recommendations)
   - [Training Catalog](#68-training-catalog)
   - [Model Training](#69-model-training)
   - [Audit Logs](#610-audit-logs)
7. [Recommendation Response Schemas](#7-recommendation-response-schemas)
8. [Error Reference](#8-error-reference)
9. [Postman Testing Guide](#9-postman-testing-guide)

---

## 1. Architecture Overview

```
Next.js Frontend (Faculty / Dept Admin / Campus Admin / Sys Admin)
                │ HTTPS + JWT Bearer Token
                ▼
        FastAPI REST API v3.0
        Base URL: http://localhost:8000/api/v1
                │
      ┌─────────┴────────┐
      ▼                  ▼
  MySQL DB          ML Model (.joblib)
  (XAMPP)           scikit-learn Random Forest
```

---

## 2. Server Setup

**Start backend:**
```powershell
.venv\Scripts\uvicorn app.main:app --reload
```

**Swagger UI:** http://127.0.0.1:8000/docs
**ReDoc:** http://127.0.0.1:8000/redoc
**Base URL:** `http://127.0.0.1:8000/api/v1`

---

## 3. Authentication

All protected endpoints require a JWT Bearer token.

### Login

```http
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=admin&password=admin123
```

**Response:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "role": "system_admin",
  "full_name": "System Administrator"
}
```

**Using the token:**
```http
Authorization: Bearer <access_token>
```

Token lifetime: configured via `ACCESS_TOKEN_EXPIRE_MINUTES` in `.env` (default: 480 minutes / 8 hours).

---

## 4. Account Hierarchy & RBAC

| Role | Scope | Key Permissions |
|---|---|---|
| `faculty` | Self only | Questionnaire, own recommendation |
| `department_admin` | Own department | Faculty roster, dept recommendation |
| `campus_admin` | Own campus | All departments, campus recommendation |
| `system_admin` | All campuses | Full access, ML training, user management |

### Enforcement

- `department_admin`: API validates `faculty.department_id == admin.department_id`
- `campus_admin`: API validates `faculty.department.campus_id == admin.campus_id`
- `faculty`: Cannot call admin recommendation endpoints (403 Forbidden)

---

## 5. Questionnaire Status Lifecycle

```
not_started  →  in_progress  →  eligible  →  has_recommendation
```

| Status | Trigger |
|---|---|
| `not_started` | Default after account creation |
| `in_progress` | At least one questionnaire part saved |
| `eligible` | All 5 required parts (1,2,3,5,6) complete |
| `has_recommendation` | `POST /recommendations/individual` or `POST /profile/request-recommendation` called successfully |

**Recommendation filtering:** Endpoints `POST /recommendations/department` and `POST /recommendations/campus` automatically skip faculty with `not_started` or `in_progress` status. These appear in the response's `skipped_faculty[]` array.

---

## 6. Endpoints Reference

### 6.1 Health

```http
GET /api/v1/health
```

No auth required.

**Response:**
```json
{
  "status": "ok",
  "model_ready": true,
  "model_version": "v20260820180225",
  "database": "connected"
}
```

---

### 6.2 Auth — Login & Register

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=johndoe&password=pass123
```

#### Faculty Self-Registration
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "jdoe",
  "email": "jdoe@qsu.edu.ph",
  "full_name": "John Doe",
  "password": "pass123",
  "department_id": 3
}
```

---

### 6.3 Profile — Faculty Self-Service

All routes require `Authorization: Bearer <token>` (faculty role).

#### Get own profile
```http
GET /api/v1/profile/me
```

#### Update own profile
```http
PUT /api/v1/profile/me
Content-Type: application/json

{ "full_name": "Updated Name", "email": "new@email.com" }
```

#### Request own recommendation
```http
POST /api/v1/profile/request-recommendation
```

Triggers ML inference for the authenticated faculty member. The faculty must be `eligible` or `has_recommendation` status. Returns the full transparent recommendation result.

#### Get own last recommendation
```http
GET /api/v1/profile/last-recommendation
```

Returns the stored recommendation JSON without re-running inference.

---

### 6.4 Questionnaire — Multi-Part Form

Faculty complete the questionnaire in parts. Each part can be saved independently.

```http
# Part 1 — Personal Profile
POST /api/v1/questionnaire/part1
PUT  /api/v1/questionnaire/part1
GET  /api/v1/questionnaire/part1

# Part 2 — Training History
POST /api/v1/questionnaire/part2
PUT  /api/v1/questionnaire/part2
GET  /api/v1/questionnaire/part2

# Part 3 — Competency Assessment
POST /api/v1/questionnaire/part3
PUT  /api/v1/questionnaire/part3
GET  /api/v1/questionnaire/part3

# Part 4 — Emerging Training Needs
POST /api/v1/questionnaire/part4
PUT  /api/v1/questionnaire/part4
GET  /api/v1/questionnaire/part4

# Part 5 — Preferred Modality / Schedule / Duration
POST /api/v1/questionnaire/part5
PUT  /api/v1/questionnaire/part5
GET  /api/v1/questionnaire/part5

# Part 6 — Barriers
POST /api/v1/questionnaire/part6
PUT  /api/v1/questionnaire/part6
GET  /api/v1/questionnaire/part6

# Status check
GET /api/v1/questionnaire/status
```

**Part 1 Example Body:**
```json
{
  "department": "BSCS",
  "age": 32,
  "sex": "Male",
  "employment_status": "Permanent",
  "academic_rank": "Instructor I",
  "highest_educational_attainment": "Master's Degree",
  "field_of_specialization": "Computer Science",
  "years_teaching": "5-10 years",
  "administrative_designation": "None",
  "trainings_last_3_years": "3-5"
}
```

**Part 3 Example Body (Competency):**
```json
{
  "competency": {
    "research_competency": { "proficiency": 2, "importance": 5 },
    "computer_literacy_digital_technologies": { "proficiency": 3, "importance": 5 },
    "outcomes_based_education": { "proficiency": 2, "importance": 5 },
    "teaching_learning_process": { "proficiency": 4, "importance": 5 },
    "publication_writing": { "proficiency": 1, "importance": 4 }
  }
}
```

**Status Response:**
```json
{
  "questionnaire_status": "eligible",
  "parts_completed": {
    "part1": true,
    "part2": true,
    "part3": true,
    "part4": false,
    "part5": true,
    "part6": true
  }
}
```

---

### 6.5 Users — Admin Management

Requires admin role (department_admin, campus_admin, or system_admin).

#### List users
```http
GET /api/v1/users?page=1&per_page=20&role=faculty&campus_id=1&department_id=3&status=active
```

Returns paginated list with headers:
- `X-Total-Count` — total matching records
- `X-Page` — current page
- `X-Per-Page` — page size

#### Get single user
```http
GET /api/v1/users/{user_id}
```

#### Create user (admin-managed)
```http
POST /api/v1/users
Content-Type: application/json

{
  "username": "jsmith",
  "full_name": "Jane Smith",
  "email": "jsmith@qsu.edu.ph",
  "password": "securepass",
  "role": "faculty",
  "department_id": 3,
  "campus_id": 1
}
```

#### Update user
```http
PUT /api/v1/users/{user_id}
Content-Type: application/json

{ "full_name": "Jane M. Smith", "is_active": true }
```

#### Delete user
```http
DELETE /api/v1/users/{user_id}
```

#### List users by campus
```http
GET /api/v1/users?campus_id=1&role=faculty
```

---

### 6.6 Campuses & Departments

#### List all campuses
```http
GET /api/v1/campuses
```

#### Get campus details
```http
GET /api/v1/campuses/{campus_id}
```

#### List departments in campus
```http
GET /api/v1/campuses/{campus_id}/departments
```

#### Create department (system_admin)
```http
POST /api/v1/campuses/{campus_id}/departments
Content-Type: application/json

{ "name": "BS Information Technology", "code": "BSIT" }
```

---

### 6.7 Recommendations

> **Note:** Faculty members cannot call any of these endpoints. Faculty use `POST /api/v1/profile/request-recommendation` instead.

#### Individual Recommendation

```http
POST /api/v1/recommendations/individual?faculty_id=42
Authorization: Bearer <token>
```

**RBAC:**
- `department_admin`: faculty must be in their department
- `campus_admin`: faculty must be in their campus
- `system_admin`: any faculty

**Validation:** Faculty must have `questionnaire_status` in `['eligible', 'has_recommendation']`

**Returns:** Full transparent recommendation result (see Section 7).

---

#### Department Recommendation

```http
POST /api/v1/recommendations/department?department_id=3
POST /api/v1/recommendations/department?department_code=BSCS&campus_id=1
Authorization: Bearer <token>
```

**RBAC:**
- `department_admin`: always uses their own department (params ignored)
- `campus_admin`: must specify a department in their campus
- `system_admin`: any department

**Processing:**
1. Fetches all active faculty in the department
2. Filters to `eligible`/`has_recommendation` status
3. Runs individual inference per eligible faculty
4. Aggregates category scores and faculty coverage
5. Persists individual results back to each faculty record
6. Stores department result in `RecommendationHistory`

**Response includes:**
```json
{
  "department": "BSCS",
  "department_id": 3,
  "campus_name": "QSU Diffun",
  "total_faculty_in_dept": 15,
  "eligible_faculty_count": 12,
  "skipped_faculty": [
    {"faculty_id": 7, "questionnaire_status": "in_progress"}
  ],
  "top_categories": [...],
  "recommendations": [...],
  "model": {...},
  "generated_at": "..."
}
```

---

#### Get Last Department Recommendation

```http
GET /api/v1/recommendations/department/last?department_id=3
```

Returns most recent stored department recommendation without re-running inference.

**Response:** Same schema as POST above, plus `"has_recommendation": true`

---

#### Department Recommendation History

```http
GET /api/v1/recommendations/department/history?department_id=3&limit=10
```

Returns list of past department recommendations in descending order.

---

#### Campus Recommendation

```http
POST /api/v1/recommendations/campus
POST /api/v1/recommendations/campus?campus_id=2
Authorization: Bearer <token>
```

**RBAC:** `campus_admin` or `system_admin` only.
- `campus_admin`: uses their own campus (campus_id param ignored)
- `system_admin`: must specify campus_id

Aggregates recommendations across ALL departments in the campus.

---

#### Get Last Campus Recommendation

```http
GET /api/v1/recommendations/campus/last?campus_id=1
```

---

#### Campus Recommendation History

```http
GET /api/v1/recommendations/campus/history?campus_id=1&limit=10
```

---

#### Get Faculty Last Recommendation (Admin view)

```http
GET /api/v1/recommendations/faculty/42/last
Authorization: Bearer <token>
```

Returns stored recommendation for a specific faculty member. Used by department/campus admins to review individual faculty results.

**Note:** Faculty members use `GET /api/v1/profile/last-recommendation` instead.

---

### 6.8 Training Catalog

```http
# List all training programs
GET /api/v1/catalog?category=AI&status=active&page=1&per_page=20

# Get single program
GET /api/v1/catalog/{program_id}

# Create program (system_admin only)
POST /api/v1/catalog
Content-Type: application/json
{
  "title": "AI and Machine Learning for Educators",
  "category": "Artificial Intelligence",
  "modality": "Blended Learning",
  "duration": "3 days",
  "provider": "QSU ICT Department",
  "description": "Hands-on AI/ML tools for classroom use"
}

# Update program
PUT /api/v1/catalog/{program_id}

# Delete program
DELETE /api/v1/catalog/{program_id}
```

---

### 6.9 Model Training

Requires `system_admin` role.

#### Trigger training
```http
POST /api/v1/training/train
Authorization: Bearer <token>
```

Trains a new model version from `data/raw/faculty_training.csv`. Returns training metrics.

**Response:**
```json
{
  "version": "v20260822120000",
  "metrics": {
    "f1_micro": 0.82,
    "f1_macro": 0.79,
    "precision": 0.84,
    "recall": 0.80,
    "training_samples": 245,
    "test_samples": 62
  },
  "model_path": "models/training_recommender_v20260822120000.joblib"
}
```

#### List available model versions
```http
GET /api/v1/training/versions
```

#### Set active model version
```http
POST /api/v1/training/activate
Content-Type: application/json

{ "version": "v20260820180225" }
```

---

### 6.10 Audit Logs

Requires `system_admin` role.

```http
GET /api/v1/audit-logs?action=department_recommendation&limit=50&page=1
```

**Logged actions:** `login`, `individual_recommendation`, `department_recommendation`, `campus_recommendation`, `model_training`, `user_create`, `user_update`, `user_delete`, `catalog_create`, `catalog_update`, `catalog_delete`

---

## 7. Recommendation Response Schemas

### Individual Recommendation

```json
{
  "model": {
    "version": "v20260820180225",
    "algorithm": "Random Forest (One-vs-Rest)",
    "n_estimators": 100,
    "training_samples": 245,
    "features": 67,
    "labels": 9,
    "timestamp": "2026-08-20T18:02:25"
  },
  "top_categories": [
    { "category": "Research Methods", "score": 0.87 },
    { "category": "Educational Technology", "score": 0.76 },
    { "category": "Artificial Intelligence", "score": 0.65 }
  ],
  "recommendations": [
    {
      "rank": 1,
      "title": "Advanced Research Methods Workshop",
      "category": "Research Methods",
      "match_score": 0.94,
      "modality": "Face-to-face",
      "duration": "3 days",
      "provider": "QSU Graduate School"
    },
    {
      "rank": 2,
      "title": "EdTech Integration for Modern Classrooms",
      "category": "Educational Technology",
      "match_score": 0.81,
      "modality": "Blended Learning",
      "duration": "2 days",
      "provider": "QSU ICT Department"
    }
  ],
  "generated_at": "2026-08-20T18:05:33+08:00"
}
```

### Department Recommendation

```json
{
  "department": "BSCS",
  "department_id": 3,
  "department_name": "BS Computer Science",
  "campus_id": 1,
  "campus_code": "DIFFUN",
  "campus_name": "QSU Diffun",
  "total_faculty_in_dept": 15,
  "eligible_faculty_count": 12,
  "skipped_faculty": [
    { "faculty_id": 7, "questionnaire_status": "in_progress" },
    { "faculty_id": 14, "questionnaire_status": "not_started" }
  ],
  "individual_results_stored": 12,
  "top_categories": [
    {
      "category": "Artificial Intelligence",
      "department_score": 0.82,
      "faculty_coverage": 0.75
    },
    {
      "category": "Research Methods",
      "department_score": 0.71,
      "faculty_coverage": 0.67
    }
  ],
  "recommendations": [
    {
      "rank": 1,
      "title": "AI and Machine Learning for Educators",
      "category": "Artificial Intelligence",
      "match_score": 0.91
    }
  ],
  "model": {
    "version": "v20260820180225",
    "algorithm": "Random Forest (One-vs-Rest)"
  },
  "has_recommendation": true,
  "generated_at": "2026-08-20T18:05:33+08:00"
}
```

### Field Glossary

| Field | Type | Description |
|---|---|---|
| `model.version` | string | Model artifact version timestamp |
| `model.algorithm` | string | Algorithm name |
| `model.training_samples` | int | Number of training samples |
| `top_categories[].score` | float (0–1) | ML probability score for this category |
| `top_categories[].department_score` | float (0–1) | Averaged faculty scores for this category |
| `top_categories[].faculty_coverage` | float (0–1) | Fraction of faculty with score above threshold |
| `recommendations[].match_score` | float (0–1) | Combined relevance × preference alignment score |
| `recommendations[].rank` | int | Rank by match_score descending |
| `skipped_faculty[].questionnaire_status` | string | Status of excluded faculty |
| `eligible_faculty_count` | int | Faculty actually processed by the model |
| `has_recommendation` | bool | Whether a recommendation exists for this entity |

---

## 8. Error Reference

| HTTP Status | Code | Common Cause |
|---|---|---|
| 400 | `BAD_REQUEST` | Validation error, missing required params, faculty not eligible |
| 401 | `UNAUTHORIZED` | No token or expired token |
| 403 | `FORBIDDEN` | Role does not have permission (e.g., faculty calling /recommendations/department) |
| 404 | `NOT_FOUND` | Faculty, department, or campus not found |
| 409 | `CONFLICT` | Username/email already registered |
| 503 | `SERVICE_UNAVAILABLE` | No active trained model loaded |

**Example 400 (not eligible):**
```json
{
  "detail": "Faculty ID 7 has questionnaire_status='in_progress'. Required: one of ['eligible', 'has_recommendation']. Faculty must complete Parts 1, 2, 3, 5, and 6 first."
}
```

**Example 503 (no model):**
```json
{
  "detail": "No trained model is active. Contact your system administrator."
}
```

---

## 9. Postman Testing Guide

### 1. Set up environment variable
```
BASE_URL = http://127.0.0.1:8000/api/v1
TOKEN    = (set after login)
```

### 2. Login as System Admin
```
POST {{BASE_URL}}/auth/login
Body (form-data): username=admin, password=admin123
→ Copy access_token to TOKEN variable
```

### 3. Test health check
```
GET {{BASE_URL}}/health
→ Expect: model_ready = true
```

### 4. Get faculty list
```
GET {{BASE_URL}}/users?role=faculty&per_page=20
Authorization: Bearer {{TOKEN}}
```

### 5. Generate individual recommendation
```
POST {{BASE_URL}}/recommendations/individual?faculty_id=1
Authorization: Bearer {{TOKEN}}
→ Must have eligible faculty
```

### 6. Generate department recommendation
```
POST {{BASE_URL}}/recommendations/department?department_code=BSCS&campus_id=1
Authorization: Bearer {{TOKEN}}
```

### 7. Retrieve last department recommendation (read-only)
```
GET {{BASE_URL}}/recommendations/department/last?department_code=BSCS&campus_id=1
Authorization: Bearer {{TOKEN}}
```

### 8. Trigger model training (system_admin only)
```
POST {{BASE_URL}}/training/train
Authorization: Bearer {{TOKEN}}
→ Requires data/raw/faculty_training.csv to exist
```

### Test Account Reference

See [TEST_ACCOUNTS.md](../TEST_ACCOUNTS.md) for all seeded credentials.

| Role | Username | Password |
|---|---|---|
| System Admin | `admin` | `admin123` |
| Campus Admin (Diffun) | `campus_diffun` | `campus123` |
| Dept Admin (BSCS) | `dept_bscs` | `dept123` |
| Faculty | `faculty01` | `faculty123` |
