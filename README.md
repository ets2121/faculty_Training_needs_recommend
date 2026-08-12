# QSU Faculty Training Needs Recommender — Production-Oriented Backend

## Scope

This backend is designed around the uploaded **QSU Faculty Training Needs Recommender System**
questionnaire. The questionnaire contains respondent profile, training history, competency
assessment, emerging training needs, preferred modality, availability, barriers, and Top Five
priority training topics.

Source: uploaded questionnaire (`TRAINING NEEDS ASSESSMENT TOOL-Faculty.pdf`).

### Important source constraint

The printed department checklist in the questionnaire contains:
BSCE, BEED, BSBA, BSCS, BAELS, BSMATH, BSHM, BSMidwifery, with BSHM appearing twice.
The software therefore keeps department values configurable rather than hard-coding a fixed
department-to-training rule. BSIT and future departments can be added to the department catalog
without changing the model architecture.

The questionnaire itself does NOT specify a particular machine-learning algorithm or a fixed
mapping from competencies to training titles. Those parts in this backend are implementation
choices and should be validated with your research adviser and actual institutional training
catalog.

## Architecture

```text
Frontend / Mobile / Admin Dashboard
              |
              v
        FastAPI REST API
              |
       +------+------+
       |             |
       v             v
Individual       Department
Prediction       Recommendation
       |             |
       +------+------+
              |
         Model Service
              |
       scikit-learn model
              |
       Feature Pipeline
              |
     Real anonymized survey data
```

## Packages

- FastAPI: REST API
- Pydantic: request/response validation
- SQLAlchemy + **MySQL** (via PyMySQL): application data (RBAC, catalog, audit logs)
- Alembic: database migrations
- PyJWT + bcrypt: JWT authentication and password hashing
- pandas/numpy: data processing
- scikit-learn: preprocessing + Random Forest multi-label model
- joblib: model artifacts
- pytest/httpx: testing

## Documentation

| Document | Description |
|---|---|
| [docs/TEST_CREDENTIALS.md](docs/TEST_CREDENTIALS.md) | **Seeded test user login credentials reference** |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | **Full API reference + Postman testing guide** |
| [docs/THESIS_METHODOLOGY.md](docs/THESIS_METHODOLOGY.md) | Academic methodology narrative |
| [Database Schema & Access-Control Implementation Instructions.md](Database%20Schema%20%26%20Access-Control%20Implementation%20Instructions.md) | RBAC schema specification |

## Setup

### Local

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env
```

For PowerShell use:
```powershell
Copy-Item .env.example .env
```

### Database (MySQL via XAMPP)

1. Start XAMPP → ensure **MySQL** is running.
2. Create the database:
```powershell
.venv\Scripts\python scripts/create_mysql_db.py
```
3. Create all tables and seed roles, departments, admin user, and training catalog:
```powershell
.venv\Scripts\python scripts/seed_db.py
```
4. Start the API:
```powershell
.venv\Scripts\uvicorn app.main:app --reload
```
5. Open Swagger UI at: **http://127.0.0.1:8000/docs**

**Default admin account:** `admin` / `admin123`

> See [docs/API_REFERENCE.md](docs/API_REFERENCE.md) for the full Postman testing guide.

## Dataset

The model target is:
```text
priority_1
priority_2
priority_3
priority_4
priority_5
```

These should contain the respondent's actual Top Five priority training topics from Part VIII.

Do not generate target labels from the input features when creating the final research dataset.
That would create target leakage / circular labels.

### Real-data workflow

```text
Google Forms / Web Form / Excel
          |
          v
Raw anonymized export
          |
          v
Explicit schema mapping
          |
          v
data/raw/faculty_training.csv
          |
          v
train.py
          |
          v
model artifact
```

## Training

```bash
python train.py
```

The trainer:
1. reads the dataset
2. treats Top Five priorities as multi-label targets
3. one-hot encodes categorical inputs
4. scales numeric inputs
5. trains a One-vs-Rest Random Forest
6. evaluates on a held-out test set
7. saves a versioned model artifact
8. writes `models/active.json`

For a thesis, also maintain a final untouched validation set and report:
- micro/macro F1
- precision
- recall
- Top-K metrics such as Recall@5
- baseline comparison

## Run API

```bash
uvicorn app.main:app --reload
```

Swagger:
```text
http://127.0.0.1:8000/docs
```

## Endpoints

For full request/response schemas, JSON examples, and cURL commands, see [docs/API_REFERENCE.md](file:///e:/Traiing%20recomender%20system/qsu_training_recommender_production/docs/API_REFERENCE.md).

For a thesis-ready explanation of the system architecture, model choices, and API design, see [docs/THESIS_METHODOLOGY.md](file:///e:/Traiing%20recomender%20system/qsu_training_recommender_production/docs/THESIS_METHODOLOGY.md).

For details on the Catalog and Transparent API architecture, see [docs/SYSTEM_DESIGN.md](file:///e:/Traiing%20recomender%20system/qsu_training_recommender_production/docs/SYSTEM_DESIGN.md).

### Health

```http
GET /api/v1/health
```

### Individual recommendation

```http
POST /api/v1/recommendations/individual
```

Body shape:

```json
{
  "faculty": {
    "department": "BSED",
    "age": 35,
    "sex": "Female",
    "employment_status": "Permanent",
    "academic_rank": "Assistant Professor",
    "highest_educational_attainment": "Master's Degree",
    "field_of_specialization": "English",
    "years_teaching": "5-10 years",
    "administrative_designation": "None",
    "trainings_last_3_years": "1-2",
    "training_areas": ["Instruction", "Research"],
    "competency": {
      "research_competency": {"proficiency": 2, "importance": 5},
      "computer_literacy_digital_technologies": {"proficiency": 3, "importance": 5},
      "outcomes_based_education": {"proficiency": 2, "importance": 5}
    },
    "emerging_training_needs": {
      "artificial_intelligence": 4,
      "machine_learning": 2,
      "data_analytics": 3,
      "cybersecurity": 2,
      "cloud_computing": 2,
      "learning_management_systems": 4,
      "educational_technology": 5,
      "statistical_software": 4,
      "research_methods": 5
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

### Department recommendation

```http
POST /api/v1/recommendations/department
```

Body:

```json
{
  "department": "BSED",
  "faculty": [
    { "same faculty schema as above" },
    { "same faculty schema as above" }
  ]
}
```

The system predicts individual needs and aggregates them to produce department-level priorities.

## Retraining API

Training is an administrative operation and is protected with:
```text
X-Admin-API-Key: <ADMIN_API_KEY>
```

Endpoint:
```http
POST /api/v1/training/train
```

For production, do NOT allow ordinary users to trigger training.

Recommended production workflow:
1. collect/validate new survey data
2. create a versioned dataset
3. train in a separate job
4. evaluate
5. approve the candidate model
6. deploy/promote the model
7. reload/restart API workers

## Why department is not a hard-coded rule

Do NOT implement:
```text
if department == BSIT: AI
if department == BSED: OBE
```

Instead the department is a feature/context value and department recommendations are generated
from the faculty-level predictions/needs. This allows BSIT, BSED, BSHM, BSBA and future departments
to use the same architecture.

## Model design

Current production-oriented baseline:
```text
Categorical -> OneHotEncoder
Numeric     -> StandardScaler
                    |
                    v
            Random Forest
                    |
                    v
       One-vs-Rest multi-label
                    |
                    v
              Top Five
```

This is a starting model, not a claim that Random Forest is optimal for the final study.

## Critical research rule

The real dataset must preserve the respondent's actual Part VIII Top Five priorities as labels.

Do NOT derive:
```text
Top Five = Importance - Proficiency
```
and then train a model to predict the same derived result.

That would not test whether the model learns actual respondent preferences.

A stronger thesis evaluation compares:
1. competency-gap baseline
2. ML model
3. actual respondent Top Five priorities

## Security and privacy

The questionnaire states that responses are confidential, anonymized, and for academic purposes.
The production implementation should:
- avoid storing names unless necessary
- use a random internal respondent ID
- encrypt database backups
- restrict admin/training endpoints
- use HTTPS in deployment
- never log full questionnaire payloads
- restrict CORS
- rotate admin credentials
- keep dataset access separate from public API access

## Production deployment

Recommended:
```text
Frontend
   |
 HTTPS
   |
Reverse Proxy / Platform
   |
FastAPI
   |
PostgreSQL

Separate:
Training Worker / Job
   |
Model Registry / Object Storage
   |
Approved model
```

Do not train the model synchronously inside a normal public prediction request.

## Next production improvements

Before final deployment:
- add real authentication/authorization (JWT/OIDC) instead of a simple admin API key
- add model approval/rollback
- add immutable dataset versions
- add Recall@5 evaluation
- add model drift monitoring
- add rate limiting
- add structured audit logs
- use PostgreSQL in production
- put model artifacts in controlled object storage
- add background training jobs (Celery/RQ/managed jobs)
- add CI/CD tests
