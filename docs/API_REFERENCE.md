# QSU Faculty Training Recommender — Complete API Reference v2.0

> **Version 2.0** — MySQL + RBAC + Multi-Part Questionnaire + Next.js Ready

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Server Setup](#2-server-setup)
3. [Authentication](#3-authentication)
4. [Account Hierarchy](#4-account-hierarchy)
5. [Role-Based Access Control](#5-role-based-access-control)
6. [Endpoints Reference](#6-endpoints-reference)
   - [Health](#61-health)
   - [Auth — Login & Register](#62-auth--login--register)
   - [Profile — Faculty Self-Service](#63-profile--faculty-self-service)
   - [Questionnaire — Multi-Part Form](#64-questionnaire--multi-part-form)
   - [Users — Admin Management](#65-users--admin-management)
   - [Recommendations](#66-recommendations)
   - [Training Catalog](#67-training-catalog)
   - [Model Training](#68-model-training)
   - [Audit Logs](#69-audit-logs)
7. [Postman Testing Guide](#7-postman-testing-guide)
8. [Next.js Integration Guide](#8-nextjs-integration-guide)
9. [Error Reference](#9-error-reference)

---

## 1. Architecture Overview

```
                    ┌─────────────────────────────────────────┐
                    │         Next.js Frontend                │
                    │  (Faculty Dashboard / Admin Panel)      │
                    └────────────────┬────────────────────────┘
                                     │ HTTPS + JWT Bearer Token
                                     ▼
                    ┌─────────────────────────────────────────┐
                    │         FastAPI REST API v2.0           │
                    │                                         │
                    │  /auth          /profile                │
                    │  /questionnaire /users                  │
                    │  /recommendations /catalog              │
                    │  /training      /audit-logs             │
                    └──────────┬──────────────────┬──────────┘
                               │                  │
                    ┌──────────▼───────┐  ┌───────▼──────────┐
                    │   MySQL (XAMPP)  │  │  ML Model (.joblib)│
                    │                 │  │  scikit-learn       │
                    │  users          │  │  Random Forest      │
                    │  faculty        │  │  Multi-label        │
                    │  departments    │  └─────────────────────┘
                    │  questionnaire  │
                    │  training_catalog│
                    │  audit_logs     │
                    └─────────────────┘
```

### Questionnaire Flow

```
Faculty Login
     │
     ▼
Dashboard: view progress (Parts 1–8)
     │
     ▼
Submit Part 1 (Personal Profile)  ──► Saved to MySQL
     │ (must be complete before Part 2 unlocks)
     ▼
Submit Part 2 (Educational Background) ──► Saved
     │
     ▼
Submit Part 3 (Professional Background) ──► Saved
     │
    ...
     │
     ▼
Parts 1+2+3+5+6 complete ──► Eligible for Recommendation
     │
     ▼
POST /profile/request-recommendation ──► Returns ML predictions + catalog matches
```

---

## 2. Server Setup

### Prerequisites
- XAMPP (MySQL running on port 3306)
- Python 3.11+
- Virtual environment activated

### Start the Server

```powershell
# 1. Create MySQL database
.venv\Scripts\python scripts/create_mysql_db.py

# 2. Create tables + seed roles, departments, default admin, catalog
.venv\Scripts\python scripts/seed_db.py

# 3. Start API server
.venv\Scripts\uvicorn app.main:app --reload
```

### Endpoints
| URL | Purpose |
|---|---|
| `http://127.0.0.1:8000` | API root |
| `http://127.0.0.1:8000/api/v1` | Versioned API prefix |
| `http://127.0.0.1:8000/docs` | Swagger UI (interactive testing) |
| `http://127.0.0.1:8000/redoc` | ReDoc documentation |
| `http://127.0.0.1:8000/openapi.json` | OpenAPI schema (for Next.js codegen) |

---

## 3. Authentication

### JWT Bearer Token

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your_access_token>
```

Obtain a token via `POST /api/v1/auth/login`. Tokens expire based on the `ACCESS_TOKEN_EXPIRE_MINUTES` setting in `.env` (default: 60 minutes).

### Admin API Key (Legacy — Training & Catalog Write)

```http
X-Admin-API-Key: change-this-in-production
```

Used only for model training triggers and catalog item creation.

---

## 4. Account Hierarchy

Account creation follows a **strict top-down hierarchy**:

```
system_admin
    │
    └──► creates ──► department_admin  (requires department_code)
                         │
                         └──► creates ──► faculty  (within their own department only)
                                              │
                                              └──► CANNOT create any accounts
```

| Creator | Can Create | Restrictions |
|---|---|---|
| `system_admin` | `department_admin`, `system_admin` | Must supply `department_code` for dept admin |
| `department_admin` | `faculty` only | Only within their own department |
| `faculty` | Nothing | Cannot call `/auth/register` |

**Default Admin Account** (created by seed script):
- Username: `admin`
- Password: `admin123`
- Role: `system_admin`

> **Important:** Change the default admin password immediately in production.

---

## 5. Role-Based Access Control

| Endpoint | faculty | department_admin | system_admin |
|---|:---:|:---:|:---:|
| `GET /health` | ✅ | ✅ | ✅ |
| `POST /auth/login` | ✅ | ✅ | ✅ |
| `GET /auth/me` | ✅ | ✅ | ✅ |
| `POST /auth/register` | ❌ | ✅ (faculty in own dept) | ✅ (dept_admin / system_admin) |
| **Profile** | | | |
| `GET /profile` | ✅ (own) | ❌ | ❌ |
| `PATCH /profile` | ✅ (own) | ❌ | ❌ |
| `POST /profile/request-recommendation` | ✅ (own, min parts required) | ❌ | ❌ |
| `GET /profile/recommendation-history` | ✅ (own) | ❌ | ❌ |
| **Questionnaire** | | | |
| `GET /questionnaire/progress` | ✅ (own) | ❌ | ❌ |
| `GET /questionnaire/parts/{n}` | ✅ (own) | ❌ | ❌ |
| `PUT /questionnaire/parts/{n}` | ✅ (own) | ❌ | ❌ |
| `GET /questionnaire/can-recommend` | ✅ (own) | ❌ | ❌ |
| **Users Management** | | | |
| `GET /users` | ❌ | ✅ (own dept faculty) | ✅ (all) |
| `GET /users/{id}` | ❌ | ✅ (own dept) | ✅ (all) |
| `GET /users/{id}/questionnaire-status` | ❌ | ✅ (own dept) | ✅ (all) |
| `PATCH /users/{id}` | ❌ | ✅ (own dept, limited) | ✅ (all) |
| **Recommendations** | | | |
| `POST /recommendations/individual` | ❌ (use /profile) | ✅ (own dept faculty) | ✅ (any faculty) |
| `POST /recommendations/department` | ❌ | ✅ (own dept only) | ✅ (any dept) |
| **Catalog** | | | |
| `GET /catalog` | ✅ | ✅ | ✅ |
| `POST /catalog` | ❌ | ❌ | ✅ (Admin Key) |
| **Training** | | | |
| `POST /training/train` | ❌ | ❌ | ✅ (Admin Key) |
| **Audit Logs** | | | |
| `GET /audit-logs` | ❌ | ❌ | ✅ |

---

## 6. Endpoints Reference

---

### 6.1 Health

**`GET /api/v1/health`** — No auth required

```json
{
  "status": "ok",
  "model": {
    "status": "ready",
    "version": "20260812055414"
  }
}
```

---

### 6.2 Auth — Login & Register

#### Login

**`POST /api/v1/auth/login`** — No auth required

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "full_name": "System Administrator",
    "role": "system_admin",
    "department": null
  }
}
```

**Errors:**
- `401` — Invalid username or password
- `403` — Account is inactive

---

#### Get My Auth Profile

**`GET /api/v1/auth/me`** — Requires JWT

```json
{
  "id": 2,
  "username": "prof_santos",
  "email": "santos@qsu.edu.ph",
  "full_name": "Maria Santos",
  "role": "faculty",
  "department": {
    "id": 1,
    "code": "BSIT",
    "name": "Bachelor of Science in Information Technology"
  },
  "status": "active"
}
```

---

#### Register Account

**`POST /api/v1/auth/register`** — Requires JWT (dept_admin or system_admin only)

**Creating a Department Admin** (system_admin only):
```json
{
  "username": "dept_bsit",
  "password": "securepass123",
  "email": "bsit.chair@qsu.edu.ph",
  "full_name": "BSIT Department Chair",
  "role": "department_admin",
  "department_code": "BSIT"
}
```

**Creating a Faculty Account** (department_admin):
```json
{
  "username": "prof_reyes",
  "password": "securepass123",
  "email": "reyes@qsu.edu.ph",
  "full_name": "Juan Reyes",
  "role": "faculty",
  "department_code": "BSIT",
  "faculty_code": "BSIT-001",
  "academic_rank": "Instructor I",
  "highest_degree": "Master's Degree",
  "specialization": "Computer Science"
}
```

**Available Department Codes:**
`BSIT`, `BSED`, `BSCE`, `BEED`, `BSBA`, `BSCS`, `BAELS`, `BSMATH`, `BSHM`, `BSMidwifery`

**Response (201):**
```json
{
  "status": "success",
  "message": "Account for 'prof_reyes' (faculty) created successfully.",
  "user_id": 5
}
```

---

### 6.3 Profile — Faculty Self-Service

All `/profile` endpoints are **faculty-only**. Admins should use `/users` instead.

---

#### Get Own Profile

**`GET /api/v1/profile`** — Requires JWT (faculty only)

```json
{
  "user": {
    "id": 3,
    "username": "prof_reyes",
    "email": "reyes@qsu.edu.ph",
    "full_name": "Juan Reyes",
    "status": "active"
  },
  "faculty_profile": {
    "faculty_id": 2,
    "faculty_code": "BSIT-001",
    "academic_rank": "Instructor I",
    "highest_degree": "Master's Degree",
    "specialization": "Computer Science",
    "department": {
      "code": "BSIT",
      "name": "Bachelor of Science in Information Technology"
    }
  },
  "questionnaire_progress": {
    "eligible_for_recommendation": false,
    "required_parts_completed": "1/5",
    "total_parts_completed": "1/8",
    "parts_status": {
      "Personal Profile": "complete",
      "Educational Background": "not_completed",
      "Professional Background": "not_completed",
      "Training History": "not_completed",
      "Competency Assessment": "not_completed",
      "Emerging Training Needs": "not_completed",
      "Learning Preferences": "not_completed",
      "Barriers to Training": "not_completed"
    }
  }
}
```

---

#### Update Own Profile

**`PATCH /api/v1/profile`** — Requires JWT (faculty only)

```json
{
  "full_name": "Juan dela Cruz Reyes",
  "email": "jd.reyes@qsu.edu.ph",
  "academic_rank": "Instructor II",
  "specialization": "Software Engineering",
  "highest_degree": "Master's Degree"
}
```

All fields are optional. Only provided fields are updated.

---

#### Request My Training Recommendation

**`POST /api/v1/profile/request-recommendation`** — Requires JWT (faculty only)

No request body. Uses saved questionnaire data from MySQL.

**Requires:** Parts 1, 2, 3, 5, and 6 must be complete.

**Response (200):**
```json
{
  "status": "success",
  "model": { "status": "ready", "version": "20260812055414" },
  "prediction": {
    "top_predictions": [
      { "rank": 1, "training_category": "Artificial Intelligence", "probability": 0.87 },
      { "rank": 2, "training_category": "Educational Technology", "probability": 0.81 }
    ],
    "all_predictions": [...]
  },
  "recommendations": [
    {
      "training_id": "TRN-001",
      "title": "AI in Higher Education: Tools and Applications",
      "category": "Artificial Intelligence",
      "match_score": 0.92,
      "reason": "Matches the predicted Artificial Intelligence training need. Aligns with preferred modality (Webinar).",
      "description": "..."
    }
  ]
}
```

**Error (400):**
```json
{
  "detail": "Please complete the following questionnaire parts first: ['Educational Background', 'Competency Assessment']"
}
```

---

#### View Recommendation History

**`GET /api/v1/profile/recommendation-history`** — Requires JWT (faculty only)

```json
{
  "faculty_id": 2,
  "total": 3,
  "history": [
    {
      "id": 1,
      "recommendation_type": "individual",
      "model_version": "20260812055414",
      "created_at": "2026-08-12T10:45:00",
      "recommendation": { ... }
    }
  ]
}
```

---

### 6.4 Questionnaire — Multi-Part Form

All `/questionnaire` endpoints are **faculty-only**. Parts must be completed in order — Part N cannot be submitted until Part N-1 is complete.

#### Part Overview

| Part | Name | Required for Recommendation |
|---|---|:---:|
| 1 | Personal Profile | ✅ Yes |
| 2 | Educational Background | ✅ Yes |
| 3 | Professional Background | ✅ Yes |
| 4 | Training History | ❌ No |
| 5 | Competency Assessment | ✅ Yes |
| 6 | Emerging Training Needs | ✅ Yes |
| 7 | Learning Preferences | ❌ No |
| 8 | Barriers to Training | ❌ No |

---

#### Get Progress

**`GET /api/v1/questionnaire/progress`** — Requires JWT (faculty only)

```json
{
  "faculty_id": 2,
  "eligible_for_recommendation": false,
  "required_parts_completed": "3/5",
  "total_parts_completed": "3/8",
  "parts": [
    {
      "part_number": 1,
      "label": "Personal Profile",
      "required_for_recommendation": true,
      "status": "complete",
      "updated_at": "2026-08-12T10:00:00"
    },
    {
      "part_number": 2,
      "label": "Educational Background",
      "required_for_recommendation": true,
      "status": "complete",
      "updated_at": "2026-08-12T10:05:00"
    },
    {
      "part_number": 3,
      "label": "Professional Background",
      "required_for_recommendation": true,
      "status": "complete",
      "updated_at": "2026-08-12T10:10:00"
    },
    {
      "part_number": 4,
      "label": "Training History",
      "required_for_recommendation": false,
      "status": "not_started",
      "updated_at": null
    },
    {
      "part_number": 5,
      "label": "Competency Assessment",
      "required_for_recommendation": true,
      "status": "not_started",
      "updated_at": null
    }
  ]
}
```

---

#### Get Saved Part Data

**`GET /api/v1/questionnaire/parts/{part_number}`** — Requires JWT (faculty only)

```json
{
  "part_number": 1,
  "label": "Personal Profile",
  "is_complete": true,
  "data": {
    "department": "BSIT",
    "age": 32,
    "sex": "Female",
    "employment_status": "Permanent"
  },
  "updated_at": "2026-08-12T10:00:00"
}
```

---

#### Submit / Update a Part

**`PUT /api/v1/questionnaire/parts/{part_number}`** — Requires JWT (faculty only)

Submitting a part validates it and marks it complete. You can re-submit to update data.

**Part 1 — Personal Profile**
```json
{
  "department": "BSIT",
  "age": 32,
  "sex": "Female",
  "employment_status": "Permanent"
}
```
Valid `sex` values: `Male`, `Female`, `Prefer not to say`

---

**Part 2 — Educational Background**
```json
{
  "highest_educational_attainment": "Master's Degree",
  "field_of_specialization": "Computer Science"
}
```

---

**Part 3 — Professional Background**
```json
{
  "academic_rank": "Instructor I",
  "years_teaching": "1-4 years",
  "administrative_designation": "None",
  "trainings_last_3_years": "3-5"
}
```

---

**Part 4 — Training History** *(optional)*
```json
{
  "training_areas": ["Instruction", "Research", "Technology Integration"],
  "training_modalities_attended": ["Webinar", "Face-to-Face"]
}
```

---

**Part 5 — Competency Assessment** *(required)*

Each competency must have `proficiency` (1–5) and `importance` (1–5):
```json
{
  "competency": {
    "research_competency": { "proficiency": 2, "importance": 5 },
    "computer_literacy_digital_technologies": { "proficiency": 3, "importance": 5 },
    "outcomes_based_education": { "proficiency": 2, "importance": 4 },
    "student_development": { "proficiency": 3, "importance": 4 },
    "curriculum_development": { "proficiency": 2, "importance": 4 },
    "instructional_material_development": { "proficiency": 2, "importance": 3 },
    "community_extension": { "proficiency": 3, "importance": 3 }
  }
}
```

---

**Part 6 — Emerging Training Needs** *(required)*

Rate each area 1 (Not Important) to 5 (Most Important):
```json
{
  "emerging_training_needs": {
    "artificial_intelligence": 5,
    "machine_learning": 4,
    "data_analytics": 4,
    "cybersecurity": 3,
    "cloud_computing": 2,
    "learning_management_systems": 4,
    "educational_technology": 5,
    "statistical_software": 3,
    "research_methods": 4,
    "grant_writing": 3
  }
}
```

---

**Part 7 — Learning Preferences** *(optional)*
```json
{
  "preferred_learning_modality": ["Webinar", "Blended Learning"],
  "preferred_schedule": ["Saturdays"],
  "preferred_duration": ["Two days"]
}
```

---

**Part 8 — Barriers to Training** *(optional)*

Rate each barrier 1–5:
```json
{
  "barriers": {
    "heavy_teaching_workload": 4,
    "time_constraints": 4,
    "lack_of_budget": 3,
    "internet_connectivity": 2,
    "family_responsibilities": 3,
    "lack_of_information": 2
  }
}
```

**Successful submission response:**
```json
{
  "status": "success",
  "message": "Part 1 (Personal Profile) saved successfully.",
  "part_number": 1,
  "is_complete": true,
  "eligible_for_recommendation": false
}
```

**Error — previous part not complete:**
```json
{
  "detail": "Part 4 (Training History) must be completed before submitting Part 5."
}
```

---

#### Check Eligibility

**`GET /api/v1/questionnaire/can-recommend`** — Requires JWT (faculty only)

```json
{
  "eligible": false,
  "missing_required_parts": [
    { "part_number": 5, "label": "Competency Assessment" },
    { "part_number": 6, "label": "Emerging Training Needs" }
  ],
  "message": "Please complete the following required parts first: ['Competency Assessment', 'Emerging Training Needs']"
}
```

When eligible:
```json
{
  "eligible": true,
  "missing_required_parts": [],
  "message": "You are eligible to request a training recommendation."
}
```

---

### 6.5 Users — Admin Management

Only `department_admin` and `system_admin` can access `/users`. Faculty must use `/profile`.

---

#### List Users

**`GET /api/v1/users`** — Requires JWT (admin roles only)

- `system_admin`: all users
- `department_admin`: only faculty in their department

```json
{
  "users": [
    {
      "id": 3,
      "username": "prof_reyes",
      "email": "reyes@qsu.edu.ph",
      "full_name": "Juan Reyes",
      "role": "faculty",
      "department_code": "BSIT",
      "department_name": "Bachelor of Science in Information Technology",
      "status": "active"
    }
  ]
}
```

---

#### Get User by ID

**`GET /api/v1/users/{user_id}`** — Requires JWT (admin roles)

Same structure as list item above.

---

#### Get User's Questionnaire Status

**`GET /api/v1/users/{user_id}/questionnaire-status`** — Requires JWT (admin roles)

Allows department admin to see which parts a faculty member has completed:

```json
{
  "user_id": 3,
  "faculty_id": 2,
  "username": "prof_reyes",
  "full_name": "Juan Reyes",
  "eligible_for_recommendation": false,
  "required_parts_completed": "3/5",
  "total_parts_completed": "3/8",
  "parts": [
    { "part_number": 1, "label": "Personal Profile", "required": true, "status": "complete" },
    { "part_number": 2, "label": "Educational Background", "required": true, "status": "complete" },
    { "part_number": 3, "label": "Professional Background", "required": true, "status": "complete" },
    { "part_number": 4, "label": "Training History", "required": false, "status": "not_started" },
    { "part_number": 5, "label": "Competency Assessment", "required": true, "status": "not_started" },
    { "part_number": 6, "label": "Emerging Training Needs", "required": true, "status": "not_started" },
    { "part_number": 7, "label": "Learning Preferences", "required": false, "status": "not_started" },
    { "part_number": 8, "label": "Barriers to Training", "required": false, "status": "not_started" }
  ]
}
```

---

#### Update User

**`PATCH /api/v1/users/{user_id}`** — Requires JWT (admin roles)

```json
{
  "full_name": "Updated Name",
  "email": "newemail@qsu.edu.ph",
  "status": "inactive"
}
```

> `status` can only be changed by `system_admin`.

---

### 6.6 Recommendations

All recommendation endpoints require JWT. Faculty use `/profile/request-recommendation` instead.

---

#### Individual Recommendation (Admin Use)

**`POST /api/v1/recommendations/individual?faculty_id=2`** — Requires JWT

- `department_admin`: can only run for faculty in their own department
- `system_admin`: can run for any faculty
- `faculty`: **403 Forbidden** — use `/profile/request-recommendation`

Automatically uses saved questionnaire data from MySQL. No request body needed.

**Query parameter:** `faculty_id` (required)

**Response:** Same structure as `/profile/request-recommendation`

**Error — not eligible:**
```json
{
  "detail": "Faculty ID 2 has not completed the minimum questionnaire requirements (Parts 1, 2, 3, 5, 6)."
}
```

---

#### Department Recommendation

**`POST /api/v1/recommendations/department?department_code=BSIT`** — Requires JWT

- `department_admin`: auto-uses their own department (`department_code` ignored)
- `system_admin`: must specify `department_code` as query parameter
- `faculty`: **403 Forbidden**

Automatically fetches all eligible faculty from MySQL, filters out incomplete ones, and runs the recommendation.

**Response:**
```json
{
  "status": "success",
  "department": "BSIT",
  "department_name": "Bachelor of Science in Information Technology",
  "total_faculty_in_dept": 10,
  "eligible_faculty_count": 7,
  "skipped_incomplete_count": 3,
  "model": { "status": "ready", "version": "20260812055414" },
  "faculty_count": 7,
  "prediction": {
    "top_categories": [
      {
        "training_category": "Artificial Intelligence",
        "department_score": 0.81,
        "faculty_coverage": 0.86,
        "rank": 1
      }
    ]
  },
  "recommendations": [...]
}
```

---

### 6.7 Training Catalog

#### List Catalog

**`GET /api/v1/catalog`** — No auth required

```
GET /api/v1/catalog?include_inactive=false
```

```json
{
  "items": [
    {
      "training_id": "TRN-001",
      "title": "AI in Higher Education: Tools and Applications",
      "description": "...",
      "categories": ["Artificial Intelligence"],
      "target_competencies": ["Computer Literacy & Digital Technologies"],
      "modalities": ["Webinar", "Blended Learning"],
      "durations": ["Two days"],
      "schedules": ["Saturdays"],
      "status": "active"
    }
  ]
}
```

---

#### Add Catalog Item

**`POST /api/v1/catalog`** — Requires `X-Admin-API-Key` header

```json
{
  "title": "ChatGPT Prompting for Educators",
  "description": "Learn prompt engineering for academic use cases.",
  "categories": ["Artificial Intelligence", "Educational Technology"],
  "target_competencies": ["Computer Literacy & Digital Technologies"],
  "modalities": ["Webinar"],
  "durations": ["One day"],
  "schedules": ["Saturdays"],
  "status": "active"
}
```

---

### 6.8 Model Training

#### Trigger Retraining

**`POST /api/v1/training/train`** — Requires `X-Admin-API-Key`

Retrains the ML model from `data/raw/faculty_training.csv`. Saves metrics to MySQL `model_registry`.

```json
{
  "version": "20260812180000",
  "artifact": "models/training_recommender_v20260812180000.joblib",
  "metrics": {
    "f1_micro": 0.81,
    "f1_macro": 0.78
  }
}
```

---

### 6.9 Audit Logs

**`GET /api/v1/audit-logs`** — Requires JWT (system_admin only)

**Query parameters:** `limit`, `offset`, `action`, `user_id`

**Recorded Actions:**

| Action | Triggered By |
|---|---|
| `login` | Successful login |
| `create_user` | New account created |
| `update_user` | User profile updated |
| `update_profile` | Faculty updated own profile |
| `submit_questionnaire_part` | Faculty saved a questionnaire part |
| `request_recommendation` | Faculty requested own recommendation |
| `individual_recommendation` | Admin ran individual recommendation |
| `department_recommendation` | Dept admin ran department recommendation |
| `add_catalog_item` | Catalog item added |
| `train_model` | Model retraining triggered |

---

## 7. Postman Testing Guide

### 7.1 Setup

1. Install [Postman](https://www.postman.com/downloads/)
2. Create collection: **QSU Training Recommender v2**
3. Add collection variables:
   - `base_url` → `http://127.0.0.1:8000/api/v1`
   - `admin_token` → *(auto-set by Tests tab)*
   - `faculty_token` → *(auto-set by Tests tab)*
   - `dept_token` → *(auto-set by Tests tab)*
   - `admin_key` → `change-this-in-production`

---

### 7.2 Complete Test Sequence

#### Test 1 — Health Check
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/health` |

---

#### Test 2 — Admin Login (save token)
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/auth/login` |
| **Body** | `{"username": "admin", "password": "admin123"}` |

**Tests tab (auto-save token):**
```javascript
const res = pm.response.json();
if (res.access_token) {
    pm.collectionVariables.set("admin_token", res.access_token);
}
pm.test("Login successful", () => pm.response.to.have.status(200));
pm.test("Has access_token", () => pm.expect(res.access_token).to.be.a('string'));
pm.test("Role is system_admin", () => pm.expect(res.user.role).to.eql("system_admin"));
```

---

#### Test 3 — Create Department Admin
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/auth/register` |
| **Headers** | `Authorization: Bearer {{admin_token}}` |
| **Body** | See below |

```json
{
  "username": "dept_bsit",
  "password": "password123",
  "full_name": "BSIT Department Chair",
  "role": "department_admin",
  "department_code": "BSIT"
}
```

---

#### Test 4 — Dept Admin Login
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/auth/login` |
| **Body** | `{"username": "dept_bsit", "password": "password123"}` |

**Tests tab:**
```javascript
const res = pm.response.json();
pm.collectionVariables.set("dept_token", res.access_token);
pm.test("Role is department_admin", () => pm.expect(res.user.role).to.eql("department_admin"));
```

---

#### Test 5 — Dept Admin Creates Faculty Account
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/auth/register` |
| **Headers** | `Authorization: Bearer {{dept_token}}` |

```json
{
  "username": "prof_santos",
  "password": "password123",
  "full_name": "Maria Santos",
  "role": "faculty",
  "department_code": "BSIT",
  "faculty_code": "BSIT-001",
  "academic_rank": "Instructor I"
}
```

---

#### Test 6 — Faculty Login
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/auth/login` |
| **Body** | `{"username": "prof_santos", "password": "password123"}` |

**Tests tab:**
```javascript
const res = pm.response.json();
pm.collectionVariables.set("faculty_token", res.access_token);
pm.test("Role is faculty", () => pm.expect(res.user.role).to.eql("faculty"));
```

---

#### Test 7 — Faculty: View Profile + Progress
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/profile` |
| **Headers** | `Authorization: Bearer {{faculty_token}}` |

---

#### Test 8 — Faculty: Check Questionnaire Progress
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/questionnaire/progress` |
| **Headers** | `Authorization: Bearer {{faculty_token}}` |

---

#### Test 9 — Faculty: Submit Part 1 (Personal Profile)
| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `{{base_url}}/questionnaire/parts/1` |
| **Headers** | `Authorization: Bearer {{faculty_token}}`, `Content-Type: application/json` |

```json
{
  "department": "BSIT",
  "age": 32,
  "sex": "Female",
  "employment_status": "Permanent"
}
```

---

#### Test 10 — Faculty: Submit Part 2
| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `{{base_url}}/questionnaire/parts/2` |
| **Headers** | `Authorization: Bearer {{faculty_token}}` |

```json
{
  "highest_educational_attainment": "Master's Degree",
  "field_of_specialization": "Computer Science"
}
```

---

#### Test 11 — Faculty: Submit Part 3
```json
{
  "academic_rank": "Instructor I",
  "years_teaching": "1-4 years",
  "administrative_designation": "None",
  "trainings_last_3_years": "3-5"
}
```

---

#### Test 12 — Faculty: Submit Part 5 (Competency)

> **Note:** Part 4 is optional. Submit Part 5 directly after Part 3 — this tests that optional parts can be skipped.

```json
{
  "competency": {
    "research_competency": {"proficiency": 2, "importance": 5},
    "computer_literacy_digital_technologies": {"proficiency": 3, "importance": 5},
    "outcomes_based_education": {"proficiency": 2, "importance": 4},
    "student_development": {"proficiency": 3, "importance": 4}
  }
}
```

> **Note:** Part 5 requires Part 4 to be submitted first (sequential rule). Submit Part 4 with empty arrays, then Part 5.

**Part 4 first:**
```json
{
  "training_areas": [],
  "training_modalities_attended": []
}
```

---

#### Test 13 — Faculty: Submit Part 6 (Emerging Needs)
```json
{
  "emerging_training_needs": {
    "artificial_intelligence": 5,
    "machine_learning": 4,
    "data_analytics": 4,
    "educational_technology": 5,
    "research_methods": 4
  }
}
```

---

#### Test 14 — Faculty: Check Eligibility
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/questionnaire/can-recommend` |
| **Headers** | `Authorization: Bearer {{faculty_token}}` |

Expected: `"eligible": true`

---

#### Test 15 — Faculty: Request Recommendation
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/profile/request-recommendation` |
| **Headers** | `Authorization: Bearer {{faculty_token}}` |
| **Body** | None |

---

#### Test 16 — Dept Admin: Run Department Recommendation
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/recommendations/department` |
| **Headers** | `Authorization: Bearer {{dept_token}}` |

No body needed. Auto-uses own department.

---

#### Test 17 — Security: Faculty Cannot Access Dept Recommendation
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/recommendations/department` |
| **Headers** | `Authorization: Bearer {{faculty_token}}` |

**Expected:** `403 Forbidden`

---

#### Test 18 — Security: Faculty Cannot Access Users List
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/users` |
| **Headers** | `Authorization: Bearer {{faculty_token}}` |

**Expected:** `403 Forbidden`

---

#### Test 19 — Dept Admin: View Faculty Questionnaire Status
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/users/3/questionnaire-status` |
| **Headers** | `Authorization: Bearer {{dept_token}}` |

---

#### Test 20 — Admin: View Audit Logs
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/audit-logs?limit=20` |
| **Headers** | `Authorization: Bearer {{admin_token}}` |

---

## 8. Next.js Integration Guide

### 8.1 Environment Setup

Create `.env.local` in your Next.js project:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_APP_NAME=QSU Training Recommender
```

### 8.2 Axios Instance with JWT Interceptor

```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 8.3 Auth Context

```typescript
// context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

interface AuthUser {
  id: number;
  username: string;
  full_name: string;
  role: 'faculty' | 'department_admin' | 'system_admin';
  department: { id: number; code: string; name: string } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem('access_token'))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    localStorage.setItem('access_token', res.data.access_token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

### 8.4 Role-Based Route Guard

```typescript
// components/RoleGuard.tsx
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('faculty' | 'department_admin' | 'system_admin')[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user && !allowedRoles.includes(user.role)) {
      router.push('/unauthorized');
    }
  }, [user, isLoading, allowedRoles, router]);

  if (isLoading || !user) return <div>Loading...</div>;
  if (!allowedRoles.includes(user.role)) return null;
  return <>{children}</>;
}
```

### 8.5 Questionnaire Hooks

```typescript
// hooks/useQuestionnaire.ts
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface PartStatus {
  part_number: number;
  label: string;
  required_for_recommendation: boolean;
  status: 'complete' | 'in_progress' | 'not_started';
  updated_at: string | null;
}

export interface QuestionnaireProgress {
  faculty_id: number;
  eligible_for_recommendation: boolean;
  required_parts_completed: string;
  total_parts_completed: string;
  parts: PartStatus[];
}

export function useQuestionnaireProgress() {
  const [progress, setProgress] = useState<QuestionnaireProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await api.get('/questionnaire/progress');
      setProgress(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  return { progress, loading, refresh };
}

export function useSubmitPart() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPart = async (partNumber: number, data: Record<string, unknown>) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.put(`/questionnaire/parts/${partNumber}`, data);
      return res.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Submission failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return { submitPart, submitting, error };
}
```

### 8.6 Recommended Next.js Page Structure

```
app/
├── (auth)/
│   └── login/page.tsx               # Login form → POST /auth/login
├── (faculty)/
│   ├── dashboard/page.tsx           # GET /profile (progress summary)
│   ├── questionnaire/
│   │   ├── page.tsx                 # GET /questionnaire/progress
│   │   └── parts/[part]/page.tsx   # GET+PUT /questionnaire/parts/{n}
│   └── recommendations/
│       └── page.tsx                 # POST /profile/request-recommendation
├── (dept-admin)/
│   ├── dashboard/page.tsx           # GET /users (dept faculty list)
│   ├── faculty/[id]/page.tsx        # GET /users/{id}/questionnaire-status
│   └── recommendations/page.tsx    # POST /recommendations/department
├── (system-admin)/
│   ├── dashboard/page.tsx
│   ├── users/page.tsx              # GET /users (all)
│   ├── departments/page.tsx
│   ├── catalog/page.tsx            # GET+POST /catalog
│   └── audit-logs/page.tsx         # GET /audit-logs
└── unauthorized/page.tsx
```

### 8.7 OpenAPI Type Generation

Generate TypeScript types automatically from the API schema:

```bash
# Install openapi-typescript
npm install -D openapi-typescript

# Generate types from running server
npx openapi-typescript http://127.0.0.1:8000/openapi.json -o types/api.d.ts
```

Then use in your code:
```typescript
import type { paths } from '@/types/api';
```

---

## 9. Error Reference

| Status | Meaning | Common Cause |
|---|---|---|
| `200` | OK | Request successful |
| `201` | Created | New user/resource created |
| `400` | Bad Request | Missing required questionnaire parts, invalid body |
| `401` | Unauthorized | Missing or expired JWT token |
| `403` | Forbidden | Valid token but wrong role or department scope violation |
| `404` | Not Found | Faculty/user/department not found |
| `409` | Conflict | Username or email already exists |
| `422` | Unprocessable Entity | Validation error (invalid field values, missing required fields) |
| `503` | Service Unavailable | ML model not loaded (run training first) |

**Standard Error Body:**
```json
{
  "detail": "Human-readable explanation of what went wrong."
}
```

**Validation Error (422):**
```json
{
  "detail": [
    {
      "loc": ["body", "department"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**RBAC Violation (403):**
```json
{
  "detail": "Faculty members cannot generate department recommendations."
}
```

**Questionnaire Sequence Violation (400):**
```json
{
  "detail": "Part 4 (Training History) must be completed before submitting Part 5."
}
```
