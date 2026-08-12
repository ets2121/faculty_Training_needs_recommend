# QSU Faculty Training Recommender — Seeded Test Credentials

This document provides a complete list of pre-configured test user accounts, login credentials, assigned roles, department codes, and questionnaire statuses for testing the API and Next.js frontend integration.

---

## 1. Credentials Quick Reference Table

| Username | Password | Role | Department | `questionnaire_status` | Ideal Testing Scenario |
|---|---|---|---|---|---|
| **`admin`** | `admin123` | `system_admin` | *All / System* | — | System Admin Dashboard, account creation, audit logs, training triggers |
| **`dept_bsit`** | `dept123` | `department_admin` | `BSIT` | — | BSIT Department Admin Dashboard, department recommendations, faculty monitoring |
| **`dept_bsed`** | `dept123` | `department_admin` | `BSED` | — | BSED Department Admin Dashboard, department recommendations |
| **`prof_santos`** | `faculty123` | `faculty` | `BSIT` | `has_recommendation` | Faculty Dashboard with **pre-generated recommendation results ready to display** |
| **`prof_reyes`** | `faculty123` | `faculty` | `BSIT` | `eligible` | Faculty Dashboard ready to test clicking **"Request Recommendation"** |
| **`prof_cruz`** | `faculty123` | `faculty` | `BSIT` | `in_progress` | Faculty Dashboard testing **Part 3 resume flow** (Parts 1 & 2 done) |
| **`prof_garcia`** | `faculty123` | `faculty` | `BSIT` | `not_started` | Faculty Dashboard testing **fresh onboarding & Part 1 submission** |
| **`prof_torres`** | `faculty123` | `faculty` | `BSED` | `eligible` | BSED Faculty Dashboard testing |

---

## 2. Account Details by Role & Status

### 2.1 System Administrator

- **Username:** `admin`
- **Password:** `admin123`
- **Role:** `system_admin`
- **Scope:** Full system access across all departments
- **Permissions:**
  - Create `department_admin` and `system_admin` accounts (`POST /api/v1/auth/register`)
  - View all registered users across all departments (`GET /api/v1/users`)
  - Run department recommendations for any department (`POST /api/v1/recommendations/department?department_code=BSIT`)
  - View system-wide audit logs (`GET /api/v1/audit-logs`)
  - Add/update training catalog items (`POST /api/v1/catalog`)
  - Trigger ML model retraining (`POST /api/v1/training/train`)

---

### 2.2 Department Administrators

#### BSIT Department Chair
- **Username:** `dept_bsit`
- **Password:** `dept123`
- **Role:** `department_admin`
- **Department:** `BSIT` (Bachelor of Science in Information Technology)
- **Scope:** Restricted to BSIT department faculty members
- **Permissions:**
  - Create new `faculty` accounts for BSIT department (`POST /api/v1/auth/register`)
  - View BSIT faculty users and their questionnaire completion progress (`GET /api/v1/users`, `GET /api/v1/users/{id}/questionnaire-status`)
  - Run department-level recommendations for BSIT (`POST /api/v1/recommendations/department`)

#### BSED Department Chair
- **Username:** `dept_bsed`
- **Password:** `dept123`
- **Role:** `department_admin`
- **Department:** `BSED` (Bachelor of Secondary Education)

---

### 2.3 Faculty Accounts (by Questionnaire Status)

#### 1. `prof_santos` — Active Recommendation Result Available (`has_recommendation`)
- **Username:** `prof_santos`
- **Password:** `faculty123`
- **Role:** `faculty`
- **Department:** `BSIT`
- **Questionnaire Status:** `has_recommendation`
- **Pre-seeded State:**
  - Parts 1–8 of the questionnaire are complete.
  - Active recommendation result pre-saved to her record (`last_recommendation_json`).
- **Use Case:** Test loading and rendering existing recommendation results on the Faculty Dashboard (`GET /api/v1/profile/last-recommendation`).

---

#### 2. `prof_reyes` — Ready to Request Recommendation (`eligible`)
- **Username:** `prof_reyes`
- **Password:** `faculty123`
- **Role:** `faculty`
- **Department:** `BSIT`
- **Questionnaire Status:** `eligible`
- **Pre-seeded State:**
  - Required parts (1, 2, 3, 5, 6) are complete.
  - No recommendation generated yet.
- **Use Case:** Test the **"Request Recommendation"** button on the Faculty Dashboard (`POST /api/v1/profile/request-recommendation`).

---

#### 3. `prof_cruz` — Questionnaire In Progress (`in_progress`)
- **Username:** `prof_cruz`
- **Password:** `faculty123`
- **Role:** `faculty`
- **Department:** `BSIT`
- **Questionnaire Status:** `in_progress`
- **Pre-seeded State:**
  - Parts 1 & 2 complete.
  - Part 3 is unlocked and ready to submit.
  - Parts 4–8 are currently locked.
- **Use Case:** Test resuming a partially completed questionnaire on the Faculty Dashboard (`GET /api/v1/questionnaire/progress`).

---

#### 4. `prof_garcia` — Fresh Account (`not_started`)
- **Username:** `prof_garcia`
- **Password:** `faculty123`
- **Role:** `faculty`
- **Department:** `BSIT`
- **Questionnaire Status:** `not_started`
- **Pre-seeded State:**
  - Zero questionnaire parts saved.
- **Use Case:** Test fresh faculty onboarding, starting Part 1, and initial step-by-step progress tracking.

---

#### 5. `prof_torres` — BSED Department Faculty (`eligible`)
- **Username:** `prof_torres`
- **Password:** `faculty123`
- **Role:** `faculty`
- **Department:** `BSED`
- **Questionnaire Status:** `eligible`
- **Use Case:** Test department recommendation filtering for `BSED` department.

---

## 3. Account Hierarchy & Creation Rules

```
system_admin
    │
    └──► creates ──► department_admin  (requires department_code)
                         │
                         └──► creates ──► faculty  (within their own department only)
                                              │
                                              └──► CANNOT create any accounts
```

1. **System Admin** creates `department_admin` accounts.
2. **Department Admin** creates `faculty` accounts for their assigned department.
3. **Faculty** cannot create accounts; they log in and manage their own profile and questionnaire.

---

## 4. Resetting & Re-Seeding the Database

To reset the database back to this exact initial test state at any point during Next.js frontend development:

```powershell
# Run from project root with XAMPP MySQL active
.venv\Scripts\python scripts/seed_db.py
```

---

## 5. API Testing Quick Example

### Login as `prof_santos`:

```http
POST http://127.0.0.1:8000/api/v1/auth/login
Content-Type: application/json

{
  "username": "prof_santos",
  "password": "faculty123"
}
```

### Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 8,
    "username": "prof_santos",
    "full_name": "Maria Santos",
    "role": "faculty",
    "department": {
      "id": 1,
      "code": "BSIT",
      "name": "Bachelor of Science in Information Technology"
    }
  }
}
```
