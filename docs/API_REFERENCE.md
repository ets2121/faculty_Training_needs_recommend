# QSU Faculty Training Recommender — Complete API Reference

This document provides full REST API documentation for the **QSU Faculty Training Needs Recommender System**, including all endpoints, request/response schemas, authentication, and step-by-step Postman testing instructions.

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Base URL & Server Setup](#2-base-url--server-setup)
3. [Authentication Methods](#3-authentication-methods)
4. [Endpoints Summary](#4-endpoints-summary)
5. [Endpoint Details](#5-endpoint-details)
   - [Health Check](#51-health-check)
   - [Authentication](#52-authentication)
   - [Users Management](#53-users-management)
   - [Individual Recommendation](#54-individual-recommendation)
   - [Department Recommendation](#55-department-recommendation)
   - [Training Catalog](#56-training-catalog)
   - [Model Training](#57-model-training)
   - [Audit Logs](#58-audit-logs)
6. [Postman Testing Guide](#6-postman-testing-guide)
7. [Role-Based Access Control Reference](#7-role-based-access-control-reference)
8. [Error Reference](#8-error-reference)

---

## 1. Overview & Architecture

The API uses a two-layer recommendation pipeline:

```
Survey Data ──► Feature Processor ──► ML Model ──► Category Predictions
                                                          │
                                                          ▼
                                              MySQL Training Catalog
                                                          │
                                                          ▼
                                               Matched Recommendations
                                          (with match_score & reasons)
```

**Key Design Decisions:**
- **ML Layer** predicts abstract competency categories (e.g., *Artificial Intelligence*, *Research Methods*) with probability scores.
- **Catalog Layer** stores active programs in MySQL and matches them to predictions, faculty modality/schedule preferences, and competency gaps.
- **RBAC** enforces Faculty, Department Admin, and System Admin scopes at the database level.
- **Audit Logging** automatically records all important actions (login, user creation, training, catalog updates).

---

## 2. Base URL & Server Setup

### Start the Server (XAMPP MySQL must be running)

```powershell
# Activate virtual environment
.venv\Scripts\activate

# Start FastAPI server
uvicorn app.main:app --reload
```

### Base URLs

| Environment | Base URL |
|---|---|
| Local Development | `http://127.0.0.1:8000` |
| API Prefix | `http://127.0.0.1:8000/api/v1` |
| Interactive Swagger UI | `http://127.0.0.1:8000/docs` |
| ReDoc Documentation | `http://127.0.0.1:8000/redoc` |

---

## 3. Authentication Methods

This API has two authentication mechanisms:

### 3.1 JWT Bearer Token (User Auth)

Used for faculty, department admin, and system admin endpoints. Obtain a token via `POST /auth/login`.

```http
Authorization: Bearer <your_jwt_token>
```

### 3.2 Admin API Key (Legacy / Training)

Used only for the model training endpoint. Passed as a header.

```http
X-Admin-API-Key: change-this-in-production
```

> **Default Admin Account (after seeding):**
> - Username: `admin`
> - Password: `admin123`
> - Role: `system_admin`

---

## 4. Endpoints Summary

| Method | Endpoint | Auth | Role Required | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/api/v1/health` | None | — | API health and model status |
| `POST` | `/api/v1/auth/login` | None | — | Login and get JWT token |
| `GET` | `/api/v1/auth/me` | JWT | Any | Get current user profile |
| `POST` | `/api/v1/auth/register` | JWT | Admin / Dept Admin | Register a new user |
| `GET` | `/api/v1/users` | JWT | Any (scoped) | List users (scoped by role) |
| `GET` | `/api/v1/users/{id}` | JWT | Any (scoped) | Get user by ID |
| `PATCH` | `/api/v1/users/{id}` | JWT | Any (scoped) | Update user details |
| `POST` | `/api/v1/recommendations/individual` | None | — | Individual faculty recommendation |
| `POST` | `/api/v1/recommendations/department` | None | — | Department-level recommendation |
| `GET` | `/api/v1/catalog` | None | — | List training catalog programs |
| `POST` | `/api/v1/catalog` | Admin Key | — | Add/update catalog program |
| `POST` | `/api/v1/training/train` | Admin Key | — | Trigger ML model retraining |
| `POST` | `/api/v1/training/reload` | Admin Key | — | Signal model reload |
| `GET` | `/api/v1/audit-logs` | JWT | system_admin | View system audit logs |

---

## 5. Endpoint Details

---

### 5.1 Health Check

**`GET /api/v1/health`**

Returns the server status and current ML model information.

**No authentication required.**

**Example Request:**
```http
GET http://127.0.0.1:8000/api/v1/health
```

**Example Response:**
```json
{
  "status": "ok",
  "model": {
    "status": "ready",
    "version": "20260812055414"
  }
}
```

**Response when no model is loaded:**
```json
{
  "status": "ok",
  "model": {
    "status": "no_model_loaded"
  }
}
```

---

### 5.2 Authentication

#### Login — `POST /api/v1/auth/login`

Authenticate with username and password. Returns a JWT Bearer token.

**No authentication required.**

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Example Response (200 OK):**
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

**Error Response (401 Unauthorized):**
```json
{
  "detail": "Invalid username or password."
}
```

---

#### Get My Profile — `GET /api/v1/auth/me`

Returns the currently authenticated user's profile, role, and department.

**Requires:** `Authorization: Bearer <token>`

**Example Response (200 OK):**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@qsu.edu.ph",
  "full_name": "System Administrator",
  "role": "system_admin",
  "department": null,
  "status": "active"
}
```

---

#### Register User — `POST /api/v1/auth/register`

Create a new user account. Only System Admins and Department Admins may call this.

**Requires:** `Authorization: Bearer <token>` (system_admin or department_admin role)

**Request Body:**
```json
{
  "username": "jdoe",
  "password": "securepassword123",
  "email": "jdoe@qsu.edu.ph",
  "full_name": "Juan Dela Cruz",
  "role": "faculty",
  "department_code": "BSIT",
  "academic_rank": "Assistant Professor",
  "highest_degree": "Master's Degree",
  "specialization": "Software Engineering"
}
```

**Role Options:** `faculty`, `department_admin`, `system_admin`

**Department Codes:** `BSIT`, `BSED`, `BSCE`, `BEED`, `BSBA`, `BSCS`, `BAELS`, `BSMATH`, `BSHM`, `BSMidwifery`

**Example Response (201 Created):**
```json
{
  "status": "success",
  "message": "User 'jdoe' created successfully.",
  "user_id": 2
}
```

---

### 5.3 Users Management

#### List Users — `GET /api/v1/users`

Lists users scoped by the caller's role:
- **system_admin**: sees ALL users
- **department_admin**: sees only users in their department
- **faculty**: sees only themselves

**Requires:** `Authorization: Bearer <token>`

**Example Response (200 OK):**
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@qsu.edu.ph",
      "full_name": "System Administrator",
      "role": "system_admin",
      "department_code": null,
      "status": "active"
    }
  ]
}
```

---

#### Get User by ID — `GET /api/v1/users/{id}`

**Requires:** `Authorization: Bearer <token>`

Faculty users can only view their own record. Department Admins can view their department. System Admins can view anyone.

**Example Request:**
```http
GET http://127.0.0.1:8000/api/v1/users/1
Authorization: Bearer <token>
```

---

#### Update User — `PATCH /api/v1/users/{id}`

**Requires:** `Authorization: Bearer <token>`

**Request Body (all fields optional):**
```json
{
  "full_name": "Updated Name",
  "email": "newemail@qsu.edu.ph",
  "status": "inactive"
}
```

> **Note:** Only admins can change `status`. Faculty can only update their own `full_name` and `email`.

**Example Response:**
```json
{
  "status": "success",
  "message": "User 1 updated."
}
```

---

### 5.4 Individual Recommendation

**`POST /api/v1/recommendations/individual`**

Generates training category predictions and matched catalog recommendations for a single faculty member.

**No authentication required.**

**Request Body (all fields except `department` and `age` are optional):**
```json
{
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
      "computer_literacy_digital_technologies": {"proficiency": 3, "importance": 5},
      "outcomes_based_education": {"proficiency": 2, "importance": 4},
      "student_development": {"proficiency": 3, "importance": 4}
    },
    "emerging_training_needs": {
      "artificial_intelligence": 5,
      "machine_learning": 4,
      "data_analytics": 4,
      "cybersecurity": 2,
      "cloud_computing": 3,
      "learning_management_systems": 4,
      "educational_technology": 5,
      "statistical_software": 3,
      "research_methods": 4
    },
    "preferred_learning_modality": ["Webinar", "Blended Learning"],
    "preferred_schedule": ["Saturdays"],
    "preferred_duration": ["Two days"],
    "barriers": {
      "heavy_teaching_workload": 4,
      "time_constraints": 4,
      "lack_of_budget": 3,
      "internet_connectivity": 2
    }
  }
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "model": {
    "status": "ready",
    "version": "20260812055414"
  },
  "prediction": {
    "top_predictions": [
      {
        "rank": 1,
        "training_category": "Artificial Intelligence",
        "probability": 0.87
      },
      {
        "rank": 2,
        "training_category": "Educational Technology",
        "probability": 0.82
      }
    ],
    "all_predictions": [
      {"training_category": "Artificial Intelligence", "probability": 0.87},
      {"training_category": "Educational Technology", "probability": 0.82},
      {"training_category": "Research Methods", "probability": 0.74}
    ]
  },
  "recommendations": [
    {
      "training_id": "TRN-001",
      "title": "AI in Higher Education: Tools and Applications",
      "category": "Artificial Intelligence",
      "match_score": 0.92,
      "reason": "Matches the predicted Artificial Intelligence training need. Aligns with preferred modality (Webinar).",
      "description": "An introductory workshop on integrating AI tools..."
    }
  ]
}
```

---

### 5.5 Department Recommendation

**`POST /api/v1/recommendations/department`**

Aggregates individual faculty predictions and returns department-level training priorities and catalog recommendations.

**No authentication required.**

**Request Body:**
```json
{
  "department": "BSIT",
  "faculty": [
    {
      "department": "BSIT",
      "age": 35,
      "sex": "Male",
      "employment_status": "Permanent",
      "academic_rank": "Assistant Professor",
      "highest_educational_attainment": "Master's Degree",
      "field_of_specialization": "Computer Science",
      "years_teaching": "5-10 years",
      "emerging_training_needs": {
        "artificial_intelligence": 5,
        "data_analytics": 4,
        "educational_technology": 4
      },
      "preferred_learning_modality": ["Webinar"],
      "preferred_schedule": ["Saturdays"]
    },
    {
      "department": "BSIT",
      "age": 42,
      "sex": "Female",
      "employment_status": "Permanent",
      "academic_rank": "Associate Professor",
      "highest_educational_attainment": "Doctoral Degree",
      "field_of_specialization": "Information Systems",
      "years_teaching": "11-15 years",
      "emerging_training_needs": {
        "research_methods": 5,
        "data_analytics": 5,
        "statistical_software": 4
      },
      "preferred_learning_modality": ["Face-to-Face"],
      "preferred_schedule": ["Weekdays"]
    }
  ]
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "department": "BSIT",
  "model": {
    "status": "ready",
    "version": "20260812055414"
  },
  "faculty_count": 2,
  "prediction": {
    "top_categories": [
      {
        "training_category": "Data Analytics",
        "department_score": 0.81,
        "faculty_coverage": 1.0,
        "rank": 1
      },
      {
        "training_category": "Artificial Intelligence",
        "department_score": 0.76,
        "faculty_coverage": 0.5,
        "rank": 2
      }
    ]
  },
  "recommendations": [
    {
      "training_id": "TRN-005",
      "title": "Data Analytics and Visualization for Educators",
      "category": "Data Analytics",
      "match_score": 0.84,
      "reason": "Matches the predicted Data Analytics training need.",
      "description": "..."
    }
  ]
}
```

---

### 5.6 Training Catalog

#### List Catalog — `GET /api/v1/catalog`

Returns all active training programs from MySQL.

**No authentication required.**

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `include_inactive` | bool | `false` | Include inactive programs |

**Example Request:**
```http
GET http://127.0.0.1:8000/api/v1/catalog?include_inactive=false
```

**Example Response:**
```json
{
  "items": [
    {
      "training_id": "TRN-001",
      "title": "AI in Higher Education: Tools and Applications",
      "description": "An introductory workshop on integrating AI tools into teaching.",
      "categories": ["Artificial Intelligence", "Educational Technology"],
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

#### Add/Update Catalog Item — `POST /api/v1/catalog`

Add a new training program or update an existing one. **Does not require model retraining** as long as the `categories` values match existing model output categories.

**Requires:** `X-Admin-API-Key: change-this-in-production`

**Request Body:**
```json
{
  "training_id": "TRN-020",
  "title": "ChatGPT for Academic Research",
  "description": "Practical use of large language models in academic writing and research.",
  "categories": ["Artificial Intelligence", "Research Methods"],
  "target_competencies": ["Research and Publication Writing"],
  "modalities": ["Webinar", "Online Self-Paced"],
  "durations": ["One day"],
  "schedules": ["Saturdays", "Sundays"],
  "status": "active"
}
```

**Example Response:**
```json
{
  "status": "success",
  "message": "Catalog item saved successfully to MySQL database without model retraining.",
  "item": {
    "training_id": "TRN-020",
    "title": "ChatGPT for Academic Research",
    "categories": ["Artificial Intelligence", "Research Methods"],
    "status": "active"
  }
}
```

---

### 5.7 Model Training

#### Trigger Training — `POST /api/v1/training/train`

Triggers ML model retraining from the dataset at `data/raw/faculty_training.csv`. Results are saved to MySQL `model_registry` and `audit_logs`.

**Requires:** `X-Admin-API-Key: change-this-in-production`

**No request body required.**

**Example Response:**
```json
{
  "version": "20260812180000",
  "artifact": "models/training_recommender_v20260812180000.joblib",
  "metrics": {
    "f1_micro": 0.81,
    "f1_macro": 0.78,
    "precision": 0.83,
    "recall": 0.79
  }
}
```

---

#### Signal Reload — `POST /api/v1/training/reload`

**Requires:** `X-Admin-API-Key: change-this-in-production`

```json
{
  "status": "restart_or_reload_workers_after_training"
}
```

---

### 5.8 Audit Logs

**`GET /api/v1/audit-logs`**

Returns a paginated list of system audit events. Restricted to System Administrators only.

**Requires:** `Authorization: Bearer <token>` (system_admin role only)

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | int | `100` | Max records to return (max 500) |
| `offset` | int | `0` | Pagination offset |
| `action` | string | — | Filter by action type (e.g. `login`, `create_user`, `train_model`) |
| `user_id` | int | — | Filter by specific user ID |

**Example Request:**
```http
GET http://127.0.0.1:8000/api/v1/audit-logs?limit=20&action=login
Authorization: Bearer <token>
```

**Example Response:**
```json
{
  "total": 5,
  "limit": 20,
  "offset": 0,
  "logs": [
    {
      "id": 1,
      "user_id": 1,
      "username": "admin",
      "role_name": "system_admin",
      "action": "login",
      "entity_type": "user",
      "entity_id": "1",
      "old_values": null,
      "new_values": null,
      "ip_address": "127.0.0.1",
      "created_at": "2026-08-12T10:30:00"
    }
  ]
}
```

**Audit Action Types:**

| Action | Triggered By |
|---|---|
| `login` | Successful user login |
| `create_user` | New user registered |
| `update_user` | User profile updated |
| `add_catalog_item` | New catalog program added |
| `train_model` | ML model retraining triggered |

---

## 6. Postman Testing Guide

### 6.1 Prerequisites

1. Install [Postman](https://www.postman.com/downloads/) (free).
2. Start XAMPP (ensure MySQL is running).
3. Seed the database: `.venv\Scripts\python scripts/seed_db.py`
4. Start the API: `.venv\Scripts\uvicorn app.main:app --reload`

---

### 6.2 Setting Up a Postman Collection

**Step 1 — Create a new Collection**
- Open Postman → click **Collections** → **+** → Name it `QSU Training Recommender API`

**Step 2 — Create a Collection Variable for the Token**
- Click on your collection → **Variables** tab
- Add a variable:
  - **Variable**: `jwt_token`
  - **Initial Value**: (leave blank)
  - **Current Value**: (leave blank)
- Click **Save**

**Step 3 — Set Base URL**
- Go to **Variables** tab in your collection
- Add variable:
  - **Variable**: `base_url`
  - **Current Value**: `http://127.0.0.1:8000/api/v1`

Now you can use `{{base_url}}` in all your requests.

---

### 6.3 Step-by-Step Testing Flow

#### Test 1 — Health Check

| Field | Value |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/health` |
| **Auth** | None |
| **Body** | None |

Click **Send**. You should see `{"status": "ok"}`.

---

#### Test 2 — Login (Auto-Save Token)

| Field | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/auth/login` |
| **Headers** | `Content-Type: application/json` |
| **Body (raw JSON)** | See below |

**Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Auto-Save Token via Tests Tab:**

In the request, click the **Tests** tab and paste this script:

```javascript
const response = pm.response.json();
if (response.access_token) {
    pm.collectionVariables.set("jwt_token", response.access_token);
    console.log("JWT Token saved to collection variable.");
}
```

Click **Send**. Your token is now saved automatically!

---

#### Test 3 — Get My Profile

| Field | Value |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/auth/me` |
| **Headers** | `Authorization: Bearer {{jwt_token}}` |

Click **Send**. You should see your admin profile with `"role": "system_admin"`.

---

#### Test 4 — Register a Faculty User

| Field | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/auth/register` |
| **Headers** | `Authorization: Bearer {{jwt_token}}`, `Content-Type: application/json` |

**Body:**
```json
{
  "username": "prof_santos",
  "password": "password123",
  "email": "santos@qsu.edu.ph",
  "full_name": "Maria Santos",
  "role": "faculty",
  "department_code": "BSIT",
  "academic_rank": "Instructor I",
  "highest_degree": "Master's Degree",
  "specialization": "Computer Science"
}
```

---

#### Test 5 — List Users

| Field | Value |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/users` |
| **Headers** | `Authorization: Bearer {{jwt_token}}` |

As system_admin, you should see all registered users.

---

#### Test 6 — Individual Recommendation (Main Use Case)

| Field | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/recommendations/individual` |
| **Headers** | `Content-Type: application/json` |
| **Body** | See below |

**Body:**
```json
{
  "faculty": {
    "department": "BSIT",
    "age": 32,
    "sex": "Female",
    "employment_status": "Permanent",
    "academic_rank": "Instructor I",
    "highest_educational_attainment": "Master's Degree",
    "field_of_specialization": "Computer Science",
    "years_teaching": "1-4 years",
    "administrative_designation": "None",
    "trainings_last_3_years": "3-5",
    "training_areas": ["Instruction", "Technology Integration"],
    "competency": {
      "research_competency": {"proficiency": 2, "importance": 5},
      "computer_literacy_digital_technologies": {"proficiency": 3, "importance": 5},
      "outcomes_based_education": {"proficiency": 2, "importance": 4}
    },
    "emerging_training_needs": {
      "artificial_intelligence": 5,
      "machine_learning": 4,
      "data_analytics": 3,
      "educational_technology": 5,
      "learning_management_systems": 4,
      "research_methods": 4
    },
    "preferred_learning_modality": ["Webinar", "Blended Learning"],
    "preferred_schedule": ["Saturdays"],
    "preferred_duration": ["Two days"],
    "barriers": {
      "heavy_teaching_workload": 4,
      "time_constraints": 3,
      "lack_of_budget": 2
    }
  }
}
```

Expected: A `prediction` block with ranked categories and a `recommendations` block with matched programs from the MySQL catalog.

---

#### Test 7 — Department Recommendation

| Field | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/recommendations/department` |
| **Headers** | `Content-Type: application/json` |

Use the same faculty object from Test 6 but wrap it in a department request:

```json
{
  "department": "BSIT",
  "faculty": [
    { "department": "BSIT", "age": 32, "sex": "Female", "employment_status": "Permanent",
      "academic_rank": "Instructor I", "highest_educational_attainment": "Master's Degree",
      "field_of_specialization": "Computer Science", "years_teaching": "1-4 years",
      "emerging_training_needs": {"artificial_intelligence": 5, "educational_technology": 4},
      "preferred_learning_modality": ["Webinar"], "preferred_schedule": ["Saturdays"] },
    { "department": "BSIT", "age": 45, "sex": "Male", "employment_status": "Permanent",
      "academic_rank": "Associate Professor", "highest_educational_attainment": "Doctoral Degree",
      "field_of_specialization": "Information Systems", "years_teaching": "11-15 years",
      "emerging_training_needs": {"research_methods": 5, "data_analytics": 5},
      "preferred_learning_modality": ["Face-to-Face"], "preferred_schedule": ["Weekdays"] }
  ]
}
```

---

#### Test 8 — View Catalog

| Field | Value |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/catalog` |
| **Auth** | None |

---

#### Test 9 — Add New Catalog Item

| Field | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/catalog` |
| **Headers** | `X-Admin-API-Key: change-this-in-production`, `Content-Type: application/json` |

**Body:**
```json
{
  "title": "ChatGPT Prompting for Educators",
  "description": "Learn to use AI assistants to create lesson plans, quizzes, and feedback.",
  "categories": ["Artificial Intelligence", "Educational Technology"],
  "target_competencies": ["Computer Literacy & Digital Technologies"],
  "modalities": ["Webinar"],
  "durations": ["One day"],
  "schedules": ["Saturdays"],
  "status": "active"
}
```

---

#### Test 10 — View Audit Logs (System Admin Only)

| Field | Value |
|---|---|
| **Method** | `GET` |
| **URL** | `{{base_url}}/audit-logs` |
| **Headers** | `Authorization: Bearer {{jwt_token}}` |

You should see all login events and any catalog/user changes recorded.

---

#### Test 11 — Trigger Model Training

| Field | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `{{base_url}}/training/train` |
| **Headers** | `X-Admin-API-Key: change-this-in-production` |
| **Body** | None |

> Requires `data/raw/faculty_training.csv` to exist.

---

### 6.4 Testing Role Isolation (Security Verification)

**Test A — Faculty Cannot Access Another Faculty's Records**

1. Login as a faculty user → get their token.
2. Call `GET {{base_url}}/users/1` (admin user ID).
3. Expected: **403 Forbidden**

**Test B — Unauthenticated Request to Protected Endpoint**

1. Call `GET {{base_url}}/auth/me` without any Authorization header.
2. Expected: **401 Unauthorized**

**Test C — Faculty Cannot Access Audit Logs**

1. Login as a faculty user → get token.
2. Call `GET {{base_url}}/audit-logs` with that faculty token.
3. Expected: **403 Forbidden** — "Access denied. Required role: system_admin"

---

### 6.5 Importing a Collection into Postman

You can also import the `examples/` folder requests manually or export this collection once set up.

---

## 7. Role-Based Access Control Reference

| Endpoint | faculty | department_admin | system_admin |
|---|:---:|:---:|:---:|
| `GET /health` | ✅ | ✅ | ✅ |
| `POST /auth/login` | ✅ | ✅ | ✅ |
| `GET /auth/me` | ✅ | ✅ | ✅ |
| `POST /auth/register` | ❌ | ✅ (own dept only) | ✅ |
| `GET /users` | ✅ (self only) | ✅ (own dept) | ✅ (all) |
| `GET /users/{id}` | ✅ (self only) | ✅ (own dept) | ✅ (all) |
| `PATCH /users/{id}` | ✅ (self, limited) | ✅ (own dept) | ✅ (all) |
| `POST /recommendations/individual` | ✅ | ✅ | ✅ |
| `POST /recommendations/department` | ✅ | ✅ | ✅ |
| `GET /catalog` | ✅ | ✅ | ✅ |
| `POST /catalog` | ❌ | ❌ | ✅ (Admin Key) |
| `POST /training/train` | ❌ | ❌ | ✅ (Admin Key) |
| `GET /audit-logs` | ❌ | ❌ | ✅ |

---

## 8. Error Reference

| HTTP Status | Code | Meaning |
|---|---|---|
| `200 OK` | — | Request successful |
| `201 Created` | — | New resource created |
| `401 Unauthorized` | — | Missing/invalid token or admin key |
| `403 Forbidden` | — | Valid token but insufficient role |
| `404 Not Found` | — | Resource not found |
| `409 Conflict` | — | Username or email already exists |
| `422 Unprocessable Entity` | — | Invalid request body / validation error |
| `500 Internal Server Error` | — | Server-side error |
| `503 Service Unavailable` | — | ML model not loaded yet |

**Common Error Response Format:**
```json
{
  "detail": "Human-readable error message explaining what went wrong."
}
```

**Validation Error Example (422):**
```json
{
  "detail": [
    {
      "loc": ["body", "faculty", "department"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```
