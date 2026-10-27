# QSU Faculty Training Needs Recommender System

> **Version 3.0** — Multi-Campus · Full-Stack Next.js + FastAPI · Random Forest ML · Model Transparency · RBAC

A production-grade web application that recommends personalized faculty training programs for Quirino State University (QSU). The system collects structured competency data via an online questionnaire, processes it through a trained Random Forest model, and surfaces transparent, match-score-ranked training recommendations across three access tiers: **Faculty**, **Department Admin**, and **Campus Admin**.

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Tech Stack](#2-tech-stack)
3. [Role-Based Access Control](#3-role-based-access-control)
4. [Frontend Pages](#4-frontend-pages)
5. [Recommendation Engine](#5-recommendation-engine)
6. [Quick Start](#6-quick-start)
7. [Frontend Setup](#7-frontend-setup)
8. [ML Model Training](#8-ml-model-training)
9. [Documentation Index](#9-documentation-index)
10. [Project Structure](#10-project-structure)
11. [Security & Privacy](#11-security--privacy)

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 14 Frontend                          │
│   Faculty Dashboard · Dept Admin · Campus Admin · Sys Admin     │
│            (Role-based routing, Tailwind CSS)                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS + JWT Bearer Token
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FastAPI REST API v3.0                         │
│                                                                 │
│  /auth          /profile        /questionnaire                  │
│  /recommendations              /users       /campuses           │
│  /catalog       /training       /audit-logs                     │
└──────┬───────────────────────────────────────┬──────────────────┘
       │                                       │
┌──────▼───────────────────┐    ┌──────────────▼───────────────┐
│     MySQL (XAMPP)        │    │   ML Model Pipeline          │
│                          │    │                              │
│  users                   │    │  Random Forest (scikit-learn)│
│  faculty                 │    │  One-vs-Rest Multi-label     │
│  departments             │    │  Versioned .joblib artifacts │
│  campuses                │    │  Feature Pipeline:           │
│  questionnaire_*         │    │   OneHotEncoder + Scaler     │
│  training_catalog        │    │  models/active.json          │
│  recommendation_history  │    └──────────────────────────────┘
│  audit_logs              │
└──────────────────────────┘
```

### Questionnaire → Recommendation Flow

```
Faculty Login
     │
     ▼
Complete 6-Part Questionnaire  ──► questionnaire_status = "eligible"
     │
     ▼
Request Recommendation
     │
     ▼
GeneratingProgressModal (4-step animated inference):
  1. Loading questionnaire data
  2. Running ML inference
  3. Matching training catalog
  4. Finalizing results
     │
     ▼
Model Transparency Card  ──► Model version, algorithm, training stats
     │
     ▼
Ranked Training Recommendations with Match Scores
```

---

## 2. Tech Stack

### Backend
| Package | Purpose |
|---|---|
| FastAPI | REST API framework |
| Pydantic | Request/response validation |
| SQLAlchemy + PyMySQL | ORM + MySQL connector |
| Alembic | Database migrations |
| PyJWT + bcrypt | JWT auth + password hashing |
| pandas / numpy | Data processing |
| scikit-learn | Random Forest multi-label model |
| joblib | Model artifact serialization |
| pytest / httpx | Testing |
| zoneinfo | Asia/Manila timezone handling |

### Frontend
| Package | Purpose |
|---|---|
| Next.js 14 | React framework with App Router |
| TypeScript | Type-safe frontend code |
| Tailwind CSS | Utility-first styling |
| React Context | Auth state management |

---

## 3. Role-Based Access Control

| Role | Account Scope | Recommendation Access |
|---|---|---|
| `faculty` | Self only | Own recommendation via `/profile/request-recommendation` |
| `department_admin` | Own department | Individual + Department-level recommendation |
| `campus_admin` | Entire campus | Department + Campus-level aggregated recommendation |
| `system_admin` | All campuses | Full unrestricted access + ML pipeline management |

### Faculty Status Lifecycle

| Status | Meaning | Recommendation Eligible? |
|---|---|---|
| `not_started` | No questionnaire parts submitted | No |
| `in_progress` | Some parts submitted, not all required | No |
| `eligible` | All 5 required parts (1,2,3,5,6) complete | Yes |
| `has_recommendation` | Recommendation generated and stored | Yes |

> **Department Recommendation Rule:** Only faculty with `eligible` or `has_recommendation` status are included. Incomplete faculty are automatically skipped and listed in `skipped_faculty[]` in the response.

---

## 4. Frontend Pages

### Faculty Role
| Route | Page | Description |
|---|---|---|
| `/faculty-dashboard` | Faculty Dashboard | Status overview, recommendation summary |
| `/questionnaire` | Questionnaire | 6-part assessment form |
| `/my-recommendation` | My Recommendation | Model Transparency + Match-Score ranked programs |
| `/profile` | Profile | Self-service profile management |

### Department Admin Role
| Route | Page | Description |
|---|---|---|
| `/dept-dashboard` | Department Dashboard | Faculty stats, quick actions |
| `/dept-faculty` | Faculty Roster | Faculty list with status filter + pagination |
| `/dept-recommendations` | Dept Recommendations | Model Transparency + Department training priorities |
| `/register-faculty` | Register Faculty | Add new faculty members |

### Campus Admin Role
| Route | Page | Description |
|---|---|---|
| `/campus-dashboard` | Campus Dashboard | Multi-department overview |
| `/campus-faculty` | Campus Faculty | All campus faculty with status filter |
| `/campus-departments` | Departments | Department management |
| `/campus-recommendations` | Campus Recommendations | Aggregated campus-wide recommendations |

### System Admin Role
| Route | Page | Description |
|---|---|---|
| `/admin-dashboard` | Admin Hub | System-wide analytics |
| `/user-management` | User Management | Full user CRUD with pagination |
| `/catalog-management` | Training Catalog | Training program CRUD |
| `/ml-pipeline` | ML Pipeline | Model training, versioning, active model management |
| `/register-admin` | Register Admin | Create department/campus/system admins |

---

## 5. Recommendation Engine

### Model Transparency

Every recommendation response includes a `model` block with full transparency metadata:

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
  }
}
```

### Individual Recommendation Response (Top 3 Recommendations)

```json
{
  "model": {
    "version": "v20261026184948",
    "algorithm": "Random Forest (One-vs-Rest)",
    "n_estimators": 200,
    "training_samples": 132,
    "test_samples": 34,
    "features": 67,
    "labels": 17,
    "top1_hit_accuracy": 0.8235,
    "top3_hit_accuracy": 0.9706,
    "top5_hit_accuracy": 1.0,
    "micro_f1": 0.6562
  },
  "top_categories": [
    { "category": "Data Analytics", "score": 0.82 },
    { "category": "Cybersecurity", "score": 0.80 },
    { "category": "Artificial Intelligence", "score": 0.79 }
  ],
  "recommendations": [
    {
      "rank": 1,
      "title": "Data Analytics and Visualization for Academic Decision-Making",
      "category": "Data Analytics",
      "match_score": 0.94,
      "modality": "Face-to-face",
      "duration": "3 days",
      "provider": "QSU Faculty Development Office"
    },
    {
      "rank": 2,
      "title": "Applied Cybersecurity and Digital Safety for Higher Education",
      "category": "Cybersecurity",
      "match_score": 0.90,
      "modality": "Hybrid",
      "duration": "2 days",
      "provider": "QSU MIS Department"
    },
    {
      "rank": 3,
      "title": "Artificial Intelligence and Machine Learning for Educators",
      "category": "Artificial Intelligence",
      "match_score": 0.88,
      "modality": "Webinar",
      "duration": "2 days",
      "provider": "QSU IT Department"
    }
  ],
  "generated_at": "2026-10-27T03:33:41+08:00"
}
```

### Department Recommendation Response

```json
{
  "department": "BSCS",
  "department_id": 3,
  "campus_name": "QSU Diffun",
  "eligible_faculty_count": 12,
  "total_faculty_in_dept": 15,
  "skipped_faculty": [{"faculty_id": 7, "questionnaire_status": "in_progress"}],
  "top_categories": [
    {
      "category": "Artificial Intelligence",
      "department_score": 0.82,
      "faculty_coverage": 0.75
    }
  ],
  "recommendations": [
    {
      "rank": 1,
      "title": "AI and Machine Learning for Educators",
      "match_score": 0.91
    }
  ],
  "model": { "version": "..." },
  "generated_at": "2026-08-20T18:02:25+08:00"
}
```

### GeneratingProgressModal

A 4-step animated modal that provides visual feedback during recommendation generation:

1. **Loading questionnaire data** — Retrieves faculty responses
2. **Running ML inference** — Random Forest prediction pipeline
3. **Matching training catalog** — Aligns predictions with available programs
4. **Finalizing results** — Persists recommendation to faculty record

---

## 6. Quick Start

### Prerequisites
- XAMPP (MySQL running on port 3306)
- Python 3.11+
- Node.js 18+

### Backend Setup

```powershell
# Clone and set up virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
Copy-Item .env.example .env
# Edit .env with your MySQL credentials and JWT secret

# Create database
.venv\Scripts\python scripts/create_mysql_db.py

# Run migrations and seed data
.venv\Scripts\python scripts/seed_db.py

# Start API server
.venv\Scripts\uvicorn app.main:app --reload
```

API available at: **http://127.0.0.1:8000**
Swagger UI: **http://127.0.0.1:8000/docs**

### Default Admin Credentials

| Role | Username | Password |
|---|---|---|
| System Admin | `admin` | `admin123` |

> See [TEST_ACCOUNTS.md](TEST_ACCOUNTS.md) and [docs/TEST_CREDENTIALS.md](docs/TEST_CREDENTIALS.md) for all seeded test accounts.

---

## 7. Frontend Setup

```powershell
cd frontend

# Install dependencies
npm install

# Configure environment
Copy-Item .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev
```

Frontend available at: **http://localhost:3000**

---

## 8. ML Model Training

```bash
python train.py
```

### ML Training Pipeline (Colab & Backend Parity)

```bash
python train.py
```

The trainer executes a 5-step standardized pipeline with 100% parity to the Google Colab training notebook:
1. **Data Cleaning & Normalization**: Executes an 8-step cleaning module (`app/ml/data_cleaner.py`) that strips whitespace, performs canonical topic mapping (normalizing 17 standardized categories), drops non-informative rows, and validates Likert bounds `[1, 5]`.
2. **Multi-Label Target Binarization**: Multi-label binarizes the Top-5 priority topics from Part VIII across all 17 canonical categories.
3. **Feature Engineering**: `ColumnTransformer` applying `OneHotEncoder` to categorical demographics and `StandardScaler` to competency scores, emerging needs, and barrier ratings.
4. **Classifier Training**: Trains `OneVsRestClassifier(RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=42))` with an 80/20 train-test split.
5. **Comprehensive Multi-Label Evaluation**: Generates Colab Cell 7-equivalent metrics:
   - Top-1 Hit: **82.4%** · Top-3 Hit: **97.1%** · Top-5 Hit: **100.0%**
   - Exact Match: **20.6%** · Hamming Accuracy: **81.1%** · Jaccard IoU: **53.5%**
   - Micro F1: **65.6%** · Macro F1: **33.5%**
   - Per-Category Performance Breakdown table (Accuracy, F1, Precision, Recall for all 17 categories)
   - Normalized Feature Importance weights
6. **Artifact Persistence & Versioning**: Saves `training_recommender_v*.joblib`, `labels_v*.joblib`, `metadata_v*.json`, and updates `models/active.json`.

### Model Versioning

```
models/
  active.json                        ← { "version": "v20261026184948" }
  final_clean_v1/
    training_recommender_v*.joblib   ← Scikit-learn Pipeline
    labels_v*.joblib                 ← Category Label Binarizer
    metadata_v*.json                 ← Metrics, Per-Class Stats, & Feature Importances
```

The System Admin can monitor real-time training progress (5-step stepper) and activate model versions directly from the `/ml-pipeline` dashboard without restarting the server.

---

## 9. Documentation Index

| Document | Description |
|---|---|
| [README.md](README.md) | This file — full project overview |
| [SYSTEM_QA_DEFENSE_GUIDE.md](SYSTEM_QA_DEFENSE_GUIDE.md) | Thesis defense & review guide with direct Q&A |
| [TEST_ACCOUNTS.md](TEST_ACCOUNTS.md) | All seeded test account credentials |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Complete API endpoint reference |
| [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md) | Architecture & ML pipeline design |
| [docs/THESIS_METHODOLOGY.md](docs/THESIS_METHODOLOGY.md) | Academic methodology narrative |
| [docs/TEST_CREDENTIALS.md](docs/TEST_CREDENTIALS.md) | Test credential reference |
| [data/raw/README.md](data/raw/README.md) | Dataset schema and usage |
| [notebooks/README.md](notebooks/README.md) | Colab notebook guide |

---

## 10. Project Structure

```
faculty_Training_needs_recommend/
│
├── app/                          # FastAPI application
│   ├── main.py                   # App entry point, CORS, route registration
│   ├── api/                      # Route handlers
│   │   ├── auth.py               # Login / register
│   │   ├── profile.py            # Faculty self-service + recommendation request
│   │   ├── predictions.py        # Individual / Department / Campus recommendations
│   │   ├── questionnaire.py      # 6-part questionnaire CRUD
│   │   ├── users.py              # Admin user management
│   │   ├── campuses.py           # Campus & department management
│   │   ├── catalog.py            # Training catalog CRUD
│   │   ├── training.py           # ML model training trigger
│   │   ├── audit.py              # Audit log access
│   │   └── health.py             # Health check
│   ├── core/
│   │   ├── config.py             # Settings (env vars)
│   │   └── security.py           # JWT, RBAC helpers, audit logger
│   ├── db/
│   │   ├── models.py             # SQLAlchemy ORM models
│   │   ├── session.py            # DB session factory
│   │   ├── init_db.py            # Table initialization
│   │   └── seed.py               # Seed data
│   ├── ml/
│   │   ├── predictor.py          # ModelService — loads active model
│   │   ├── features.py           # Feature engineering pipeline
│   │   ├── trainer.py            # Model training logic
│   │   └── schema.py             # ML input/output schemas
│   └── services/
│       ├── recommendation.py     # individual() / department() aggregation
│       └── catalog.py            # Catalog matching + match_score calculation
│
├── frontend/                     # Next.js 14 frontend
│   └── src/
│       ├── app/
│       │   ├── (faculty)/        # Faculty role pages
│       │   ├── (dept-admin)/     # Department admin pages
│       │   ├── (campus-admin)/   # Campus admin pages
│       │   └── (sys-admin)/      # System admin pages
│       ├── components/
│       │   ├── GeneratingProgressModal.tsx   # 4-step recommendation progress modal
│       │   ├── RecommendationCard.tsx        # Transparent recommendation display card
│       │   ├── Sidebar.tsx                   # Role-aware navigation sidebar
│       │   ├── StatusBadge.tsx               # Questionnaire status indicator
│       │   ├── Pagination.tsx                # Reusable table pagination
│       │   └── ...
│       ├── context/              # Auth context
│       ├── lib/                  # API client (api.ts)
│       └── types/                # TypeScript interfaces
│
├── models/                       # Versioned ML model artifacts
│   ├── active.json               # Active model pointer
│   └── training_recommender_v*.joblib
│
├── data/
│   └── raw/faculty_training.csv  # Training dataset
│
├── docs/                         # Technical documentation
├── tests/                        # pytest test suites
├── alembic/                      # DB migration scripts
├── scripts/                      # DB setup & utility scripts
├── train.py                      # Model training entry point
├── requirements.txt
└── docker-compose.yml
```

---

## 11. Security & Privacy

The questionnaire data is confidential and anonymized for academic purposes. Production deployment must:

- Store only anonymized faculty IDs (no unnecessary PII)
- Use HTTPS everywhere
- Restrict CORS to known frontend origins
- Rotate JWT secrets regularly
- Use Alembic for all schema changes
- Enable audit logging (all write operations are logged)
- Restrict model training to `system_admin` role only
- Never log full questionnaire payloads
- Separate dataset storage from public API access

### Audit Log Coverage

All sensitive operations are automatically logged to `audit_logs`:

| Operation | Logged Fields |
|---|---|
| `login` | user_id, IP |
| `individual_recommendation` | faculty_id, model_version |
| `department_recommendation` | dept, campus, eligible count |
| `campus_recommendation` | campus, eligible count |
| `model_training` | version, metrics |
| `user_create/update/delete` | user_id, role changes |

---

## Dataset Note

The model target is the faculty's **actual** Top Five priority training topics from Part VIII of the questionnaire. Labels must **not** be derived from the competency gap (Importance - Proficiency) — that creates target leakage. For a rigorous thesis evaluation, compare:

1. Competency-gap baseline
2. ML model predictions
3. Actual respondent Top Five priorities
