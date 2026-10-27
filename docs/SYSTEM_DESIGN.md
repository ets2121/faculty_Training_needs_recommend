# QSU Faculty Training Needs Recommender — System Design

> **Version 3.0** — Transparent ML Recommendations · Multi-Campus RBAC · Next.js Full-Stack

---

## 1. System Overview

The QSU Faculty Training Needs Recommender is composed of three integrated layers:

```
┌──────────────────────────────────────────────────────────────┐
│  LAYER 1: Data Collection                                    │
│  6-Part Online Questionnaire (Next.js frontend)              │
│  Competency proficiency · Importance ratings · Profile       │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│  LAYER 2: ML Prediction                                      │
│  Random Forest One-vs-Rest Multi-label Classifier            │
│  Predicts training-need CATEGORIES with probability scores   │
│  Returns transparent model metadata with each prediction     │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│  LAYER 3: Catalog Matching                                   │
│  Training programs are ranked by Match Score                 │
│  Match Score = category probability × preference alignment   │
│  Output: ranked recommendations with match_score field       │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Questionnaire Structure (6 Parts)

The questionnaire is the system's primary data collection mechanism. It serves two roles:

1. **Training data** — collected responses are used to train the ML model
2. **Inference input** — a faculty member's completed questionnaire is used to generate their recommendation

### Parts and Required Status

| Part | Content | Required for Recommendation? |
|---|---|---|
| Part 1 | Personal Profile (department, rank, age, sex, years teaching) | Yes |
| Part 2 | Training History (number of trainings, training areas) | Yes |
| Part 3 | Competency Assessment (proficiency + importance per area) | Yes |
| Part 4 | Emerging Training Needs (AI, ML, Cybersecurity, etc.) | No (Part 4 optional) |
| Part 5 | Preferred Modality + Schedule + Duration | Yes |
| Part 6 | Barriers to Training Participation | Yes |

### Questionnaire Status Lifecycle

```
[not_started]
     │ submit Part 1
     ▼
[in_progress]
     │ complete Parts 1, 2, 3, 5, 6
     ▼
[eligible] ─────────────────────────► recommendation generated
     │
     ▼
[has_recommendation]
```

**Department recommendation filtering:** Only faculty in `eligible` or `has_recommendation` status are included. Faculty in `not_started` or `in_progress` are skipped and listed in the response's `skipped_faculty[]` array.

---

## 3. ML Model Design

### Model Type

**One-vs-Rest Random Forest** multi-label classifier:

```
Input Features
     │
     ▼
8-Step Data Cleaner (whitespace strip, canonical topic mapping, deduplication, Likert bounding)
     │
     ▼
OneHotEncoder (categorical: department, sex, employment_status,
               academic_rank, education, years_teaching, etc.)
StandardScaler (numeric: competency scores, emerging needs ratings,
                barrier ratings)
     │
     ▼
ColumnTransformer → Feature Matrix (67 features)
     │
     ▼
OneVsRestClassifier(RandomForestClassifier(n_estimators=200, class_weight="balanced", random_state=42))
     │
     ▼
Predict probability distribution across 17 training categories
```

### Target Labels (17 Canonical Categories)

1. Artificial Intelligence
2. Cybersecurity
3. Data Analytics
4. Distance Learning & Online Pedagogy
5. Educational Technology
6. Extension & Community Development
7. Health & Wellness in Academia
8. Inclusive Education & Special Needs
9. Industry 4.0 & Smart Technologies
10. Instructional Design & Curriculum Development
11. Intellectual Property & Patenting
12. Leadership & Supervisory Management
13. Outcomes-Based Education (OBE)
14. Professional Development & Ethics
15. Publication Writing
16. Quality Assurance & Accreditation
17. Research Methodology

### Critical Research Constraint

Labels **must** come from the respondent's actual Part VIII Top Five priorities. Do NOT derive:

```
Top Five = Importance - Proficiency   ← WRONG — creates target leakage
```

The model must learn to predict actual human priority rankings, not a mathematical gap calculation.

### Recommendation Output Sizing
- Individual recommendations output the **Top 3 Recommended Training Programs** with match score breakdown.
- Department recommendations output the **Top 3 Recommended Training Programs** based on aggregated priority scores and faculty coverage.

### Model Artifacts

| File | Description |
|---|---|
| `models/training_recommender_v{timestamp}.joblib` | Trained sklearn pipeline |
| `models/labels_v{timestamp}.joblib` | MultiLabelBinarizer encoder |
| `models/metadata_v{timestamp}.json` | Training stats (samples, features, labels, F1) |
| `models/active.json` | Pointer to active model version |

### Model Versioning

```json
// models/active.json
{ "version": "v20260820180225" }
```

The `ModelService` class loads the active model at startup. The System Admin can hot-swap the active version from the `/ml-pipeline` page without restarting the server.

---

## 4. Recommendation Pipeline

### Individual Recommendation

```
faculty_id (query param)
     │
     ▼
Validate: questionnaire_status IN ('eligible', 'has_recommendation')
     │
     ▼
build_faculty_record() — assemble feature dict from all questionnaire parts
     │
     ▼
individual(model, record) — ML inference
     │  ├── model.predict_proba() → category probability scores
     │  └── catalog matching → match_score ranked programs
     ▼
Store result → Faculty.last_recommendation_json
Update → Faculty.questionnaire_status = 'has_recommendation'
Log → TrainingRecommendationRequest history
     │
     ▼
Return transparent result (model metadata + scores + ranked recommendations)
```

### Department Recommendation

```
department_id or department_code (query param)
     │
     ▼
Fetch all active faculty in department
     │
     ▼
Filter: questionnaire_status IN ('eligible', 'has_recommendation')
     │
     ▼
Build faculty records for each eligible member
     │
     ▼
dept_recommendation(model, records[]) — aggregate
     │  ├── Run individual inference per faculty member
     │  ├── Average category probabilities (department_score)
     │  ├── Compute faculty_coverage (% faculty with score > threshold)
     │  └── Match catalog → match_score ranked programs
     ▼
Store individual results back on each faculty record
Persist to RecommendationHistory table
     │
     ▼
Return: top_categories (with department_score + faculty_coverage)
        recommendations (with match_score)
        skipped_faculty[]
        model metadata
```

### Campus Recommendation

Identical to department recommendation but aggregates across all departments in the campus. Stored as `recommendation_type="campus"` in `RecommendationHistory`.

---

## 5. Transparency API

Every prediction response includes a `model` block with full transparency metadata:

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
    { "category": "Educational Technology", "score": 0.76 }
  ],
  "recommendations": [
    {
      "rank": 1,
      "title": "Advanced Research Methods Workshop",
      "category": "Research Methods",
      "match_score": 0.94,
      "modality": "Face-to-face",
      "duration": "3 days"
    }
  ]
}
```

### Match Score Calculation

```
match_score = category_probability × preference_alignment_factor

preference_alignment_factor considers:
  - modality match (faculty's preferred modality vs program modality)
  - schedule compatibility
  - category relevance rank
```

---

## 6. Frontend Architecture

### Next.js 14 App Router with Role-Based Layouts

```
frontend/src/app/
  (faculty)/              ← faculty role group layout
    faculty-dashboard/
    questionnaire/
    my-recommendation/
    profile/
  (dept-admin)/           ← department_admin role group layout
    dept-dashboard/
    dept-faculty/
    dept-recommendations/
    register-faculty/
  (campus-admin)/         ← campus_admin role group layout
    campus-dashboard/
    campus-faculty/
    campus-departments/
    campus-recommendations/
  (sys-admin)/            ← system_admin role group layout
    admin-dashboard/
    user-management/
    catalog-management/
    ml-pipeline/
    register-admin/
```

### Key Shared Components

| Component | Purpose |
|---|---|
| `GeneratingProgressModal.tsx` | 4-step animated progress modal during recommendation generation |
| `RecommendationCard.tsx` | Displays Model Transparency Card + ranked programs with match scores |
| `Sidebar.tsx` | Role-aware navigation sidebar |
| `StatusBadge.tsx` | Color-coded questionnaire status indicator |
| `Pagination.tsx` | Reusable table pagination (all admin roster pages) |
| `UserModals.tsx` | Add/Edit/Delete modal dialogs for user management |
| `TransferFacultyModal.tsx` | Move faculty between departments |
| `AdminVisualCharts.tsx` | Charts for admin dashboards |

### GeneratingProgressModal — 4-Step Flow

```typescript
const STEPS = [
  "Loading questionnaire data...",
  "Running ML inference...",
  "Matching training catalog...",
  "Finalizing results..."
]
```

The modal shows animated progress and auto-closes when the API returns the result.

### Auth Flow

```
/login → POST /api/v1/auth/login → JWT token stored in localStorage
     │
     ▼
AuthContext reads token → extracts role
     │
     ▼
Next.js redirect to role-appropriate dashboard:
  faculty         → /faculty-dashboard
  department_admin → /dept-dashboard
  campus_admin    → /campus-dashboard
  system_admin    → /admin-dashboard
```

---

## 7. Database Schema (Key Tables)

```sql
-- Core entities
users           (id, username, email, full_name, hashed_password, role_id, is_active)
roles           (id, name)  -- faculty, department_admin, campus_admin, system_admin
campuses        (id, name, code, status)
departments     (id, name, code, campus_id, status)
faculty         (id, user_id, department_id, questionnaire_status,
                 last_recommendation_json, last_recommendation_at, status)

-- Questionnaire parts (stored as JSONB/TEXT per part)
faculty_profile               (faculty_id, profile_json)
faculty_training_history      (faculty_id, history_json)
faculty_competency            (faculty_id, competency_json)
faculty_emerging_needs        (faculty_id, needs_json)
faculty_preferences           (faculty_id, prefs_json)
faculty_barriers              (faculty_id, barriers_json)

-- Catalog & Recommendations
training_catalog              (id, title, category, modality, duration, provider, status)
recommendation_history        (id, campus_id, department_id, recommendation_type,
                               model_version, response_json, created_at)
training_recommendation_requests (id, faculty_id, requested_by_user_id,
                                  recommendation_type, model_version,
                                  recommendation_json, created_at)
audit_logs                    (id, user_id, action, entity_type, entity_id,
                               old_values, new_values, ip_address, created_at)
```

---

## 8. API Route Map

| Method | Route | Roles | Description |
|---|---|---|---|
| GET | `/api/v1/health` | Public | Health check + model status |
| POST | `/api/v1/auth/login` | Public | JWT authentication |
| POST | `/api/v1/auth/register` | Public | Faculty self-registration |
| GET | `/api/v1/profile/me` | Faculty | Own profile |
| POST | `/api/v1/profile/request-recommendation` | Faculty | Generate own recommendation |
| GET | `/api/v1/profile/last-recommendation` | Faculty | Retrieve last recommendation |
| GET/POST/PATCH | `/api/v1/questionnaire/*` | Faculty | Questionnaire CRUD |
| GET/POST/PUT/DELETE | `/api/v1/users/*` | Admin+ | User management |
| GET | `/api/v1/campuses` | Admin+ | Campus list |
| GET | `/api/v1/campuses/{id}/departments` | Admin+ | Departments in campus |
| POST | `/api/v1/recommendations/individual` | Dept/Campus/Sys Admin | Individual recommendation |
| POST | `/api/v1/recommendations/department` | Dept/Campus/Sys Admin | Department recommendation |
| GET | `/api/v1/recommendations/department/last` | Dept/Campus/Sys Admin | Latest department rec |
| GET | `/api/v1/recommendations/department/history` | Admin+ | Department rec history |
| POST | `/api/v1/recommendations/campus` | Campus/Sys Admin | Campus recommendation |
| GET | `/api/v1/recommendations/campus/last` | Campus/Sys Admin | Latest campus rec |
| GET | `/api/v1/recommendations/campus/history` | Campus/Sys Admin | Campus rec history |
| GET | `/api/v1/recommendations/faculty/{id}/last` | Dept/Campus/Sys Admin | Faculty last rec |
| GET/POST/PUT/DELETE | `/api/v1/catalog/*` | Sys Admin | Training catalog CRUD |
| POST | `/api/v1/training/train` | Sys Admin | Trigger model training |
| GET | `/api/v1/audit-logs` | Sys Admin | Audit log access |

---

## 9. Multi-Campus Structure

QSU operates three campuses, each with their own departments:

```
QSU System
  ├── QSU Diffun Campus
  │   ├── BSCS (Computer Science)
  │   ├── BSBA (Business Administration)
  │   ├── BSED (Education)
  │   └── ...
  ├── QSU Maddela Campus
  │   └── ...
  └── QSU Cabarroguis Campus
      └── ...
```

Campus admins have read/write access only within their campus. Department admins have access only within their department. The `campus_id` and `department_id` are enforced at the API layer via RBAC checks.

---

## 10. Deployment

### Local Development

```
Backend:  uvicorn app.main:app --reload        → http://localhost:8000
Frontend: npm run dev (in frontend/)            → http://localhost:3000
Database: XAMPP MySQL                           → localhost:3306
```

### Production Recommended Stack

```
Frontend (Vercel / Nginx)
     │ HTTPS
     ▼
FastAPI (Uvicorn + Gunicorn workers)
     │
     ├── MySQL (RDS / PlanetScale)
     └── ML Models (S3 / Backblaze object storage)

Background:
  Model training → Separate Celery/RQ worker
  Audit logs     → Indexed for search
```

### Docker

```bash
docker-compose up -d
```

The `docker-compose.yml` starts the FastAPI backend with MySQL. The frontend is deployed separately.
