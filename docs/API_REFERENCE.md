# QSU Faculty Training Recommender — API Documentation

This document provides complete, production-ready REST API documentation for the **QSU Faculty Training Needs Recommender System**.

---

## 1. Overview & Architecture

The API strictly separates **ML Model Category Prediction** from **Training Catalog Recommendation**:

```text
Questionnaire Data ──> Feature Processor ──> ML Model ──> Transparent Predictions ──> Catalog Matcher ──> Recommendations
```

1. **ML Model Layer**: Predicts underlying training-need categories with model probability scores (e.g. *Artificial Intelligence*, *Educational Technology*).
2. **Training Catalog Layer**: Stores active training programs with metadata (modalities, schedules, target competencies, durations) and matches them to model predictions and faculty preferences.

---

## 2. Base URL & Authentication

- **Base URL**: `http://localhost:8000/api/v1` (or deployed server address)
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Admin Authentication**: Administrative endpoints require the `X-Admin-API-Key` header:
  ```http
  X-Admin-API-Key: change-this-in-production
  ```

---

## 3. Endpoints Summary

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | None | API health check and version status |
| `POST` | `/api/v1/recommendations/individual` | None | Individual faculty category predictions and catalog recommendations |
| `POST` | `/api/v1/recommendations/department` | None | Aggregated department-level category priorities and catalog recommendations |
| `GET` | `/api/v1/catalog` | None | List available training catalog programs |
| `POST` | `/api/v1/catalog` | Admin | Add/update a training catalog program dynamically (no retraining required) |
| `POST` | `/api/v1/training/train` | Admin | Trigger background ML model training job |
| `POST` | `/api/v1/training/reload` | Admin | Signal workers to reload the active ML model |

---

## 4. Endpoint Details

### 4.1 Health Check

Check whether the API is running and operational.

- **Method**: `GET`
- **Endpoint**: `/api/v1/health`
- **Headers**: None
- **Response**: `200 OK`

#### Response Example
```json
{
  "status": "ok",
  "app": "QSU Faculty Training Needs Recommender",
  "version": "1.0.0"
}
```

---

### 4.2 Individual Recommendation (Transparent API)

Returns transparent ML model category probabilities and catalog recommendations matched to individual faculty preferences.

- **Method**: `POST`
- **Endpoint**: `/api/v1/recommendations/individual`
- **Content-Type**: `application/json`
- **Headers**: None
- **Response**: `200 OK` (or `503 Service Unavailable` if no model is loaded)

#### Request Body Schema (`PredictionRequest`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `faculty` | `object` | Yes | Faculty survey input object |
| `faculty.department` | `string` | Yes | Faculty department code (e.g. `"BSED"`, `"BSIT"`, `"BSCE"`) |
| `faculty.age` | `integer` | No | Age (default `35`, range `18-100`) |
| `faculty.sex` | `string` | No | Gender / Sex (e.g. `"Female"`, `"Male"`) |
| `faculty.employment_status` | `string` | No | Employment status (`"Permanent"`, `"Temporary"`, `"Contractual"`) |
| `faculty.academic_rank` | `string` | No | Rank (`"Instructor"`, `"Assistant Professor"`, `"Associate Professor"`, `"Professor"`) |
| `faculty.highest_educational_attainment` | `string` | No | Degree level (`"Master's Degree"`, `"Doctorate Degree"`, `"Bachelor's Degree"`) |
| `faculty.field_of_specialization` | `string` | No | Field of specialization (e.g. `"English"`, `"Computer Science"`) |
| `faculty.years_teaching` | `string` | No | Teaching experience bracket (e.g. `"5-10 years"`) |
| `faculty.administrative_designation` | `string` | No | Admin role (e.g. `"Department Chair"`, `"None"`) |
| `faculty.trainings_last_3_years` | `string` | No | Previous training count (e.g. `"1-2"`, `"3-5"`) |
| `faculty.training_areas` | `array[str]` | No | Attended areas (`["Instruction", "Research"]`) |
| `faculty.competency` | `object` | No | Competencies with `proficiency` (`1-5`) and `importance` (`1-5`) |
| `faculty.emerging_training_needs` | `object` | No | Self-assessed emerging needs (`1-5`) |
| `faculty.preferred_learning_modality` | `array[str]` | No | Modalities (`["Webinar", "Blended Learning"]`) |
| `faculty.preferred_schedule` | `array[str]` | No | Availability (`["Saturdays", "Semester Break"]`) |
| `faculty.preferred_duration` | `array[str]` | No | Duration preference (`["Two days"]`) |
| `faculty.barriers` | `object` | No | Barriers rated `1-5` (`heavy_teaching_workload`, `lack_of_budget`) |

#### Request Body Example
```json
{
  "faculty": {
    "faculty_id": "TEST-BSED-001",
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
      "artificial_intelligence": 5,
      "machine_learning": 3,
      "data_analytics": 4,
      "educational_technology": 5,
      "research_methods": 5
    },
    "preferred_learning_modality": ["Webinar", "Blended Learning"],
    "preferred_schedule": ["Saturdays"],
    "preferred_duration": ["Two days"],
    "barriers": {
      "heavy_teaching_workload": 4,
      "lack_of_budget": 3
    }
  }
}
```

#### Response Body Example (`TransparentPredictionResponse`)
```json
{
  "status": "success",
  "model": {
    "status": "ready",
    "version": "20260807173722"
  },
  "prediction": {
    "top_predictions": [
      {
        "training_category": "Educational Technology",
        "probability": 0.7285,
        "rank": 1
      },
      {
        "training_category": "Research Methods",
        "probability": 0.7218,
        "rank": 2
      },
      {
        "training_category": "Artificial Intelligence",
        "probability": 0.6543,
        "rank": 3
      }
    ],
    "all_predictions": [
      {
        "training_category": "Educational Technology",
        "probability": 0.7285
      },
      {
        "training_category": "Research Methods",
        "probability": 0.7218
      },
      {
        "training_category": "Artificial Intelligence",
        "probability": 0.6543
      }
    ]
  },
  "recommendations": [
    {
      "training_id": "TRN-007",
      "title": "Digital Tools for Modern Teaching and Blended Learning",
      "category": "Educational Technology",
      "match_score": 0.83,
      "reason": "Matches the predicted Educational Technology training need. Aligns with preferred modality (Blended Learning, Webinar). Addresses identified competency gap.",
      "description": "Integrating modern interactive tools, multimedia, and digital assessments into higher education teaching."
    },
    {
      "training_id": "TRN-001",
      "title": "Generative AI for Higher Education",
      "category": "Artificial Intelligence",
      "match_score": 0.75,
      "reason": "Matches the predicted Artificial Intelligence training need. Aligns with preferred modality (Blended Learning, Webinar). Addresses identified competency gap.",
      "description": "Introduction to practical generative AI tools and responsible use in teaching, research, and academic work."
    }
  ]
}
```

---

### 4.3 Department Recommendation

Aggregates individual faculty predictions across a department to identify institutional priority categories and recommended training catalog programs.

- **Method**: `POST`
- **Endpoint**: `/api/v1/recommendations/department`
- **Content-Type**: `application/json`
- **Headers**: None
- **Response**: `200 OK`

#### Request Body Example
```json
{
  "department": "BSED",
  "faculty": [
    {
      "department": "BSED",
      "age": 35,
      "employment_status": "Permanent",
      "academic_rank": "Assistant Professor",
      "highest_educational_attainment": "Master's Degree",
      "field_of_specialization": "English",
      "years_teaching": "5-10 years",
      "trainings_last_3_years": "1-2",
      "emerging_training_needs": {
        "artificial_intelligence": 5,
        "research_methods": 4
      }
    },
    {
      "department": "BSED",
      "age": 42,
      "employment_status": "Permanent",
      "academic_rank": "Associate Professor",
      "highest_educational_attainment": "Doctorate Degree",
      "field_of_specialization": "Mathematics",
      "years_teaching": "10+ years",
      "trainings_last_3_years": "3-5",
      "emerging_training_needs": {
        "data_analytics": 5,
        "educational_technology": 5
      }
    }
  ]
}
```

#### Response Body Example (`TransparentDepartmentResponse`)
```json
{
  "status": "success",
  "model": {
    "status": "ready",
    "version": "20260807173722"
  },
  "department": "BSED",
  "faculty_count": 2,
  "prediction": {
    "top_categories": [
      {
        "training_category": "Educational Technology",
        "department_score": 0.7125,
        "faculty_coverage": 1.0,
        "rank": 1
      },
      {
        "training_category": "Research Methods",
        "department_score": 0.689,
        "faculty_coverage": 1.0,
        "rank": 2
      }
    ]
  },
  "recommendations": [
    {
      "training_id": "TRN-007",
      "title": "Digital Tools for Modern Teaching and Blended Learning",
      "category": "Educational Technology",
      "match_score": 0.71,
      "reason": "Matches the predicted Educational Technology training need.",
      "description": "Integrating modern interactive tools, multimedia, and digital assessments into higher education teaching."
    }
  ]
}
```

---

### 4.4 List Training Catalog

Retrieves active (or all) available training programs stored in the system catalog.

- **Method**: `GET`
- **Endpoint**: `/api/v1/catalog`
- **Query Parameters**:
  - `include_inactive` (boolean, optional, default `false`): Set `true` to include archived/inactive catalog items.
- **Response**: `200 OK`

#### Response Body Example
```json
{
  "items": [
    {
      "training_id": "TRN-001",
      "title": "Generative AI for Higher Education",
      "description": "Introduction to practical generative AI tools and responsible use in teaching, research, and academic work.",
      "categories": ["Artificial Intelligence", "Educational Technology"],
      "target_competencies": ["Computer Literacy and Digital Technologies", "Effective Teaching and Classroom Management"],
      "modalities": ["Webinar", "Blended Learning"],
      "durations": ["One day", "Two days"],
      "schedules": ["Saturdays", "Semester Break"],
      "status": "active"
    }
  ]
}
```

---

### 4.5 Add / Update Training Catalog Item

Adds a new training program to the catalog dynamically without requiring ML model retraining as long as the categories exist.

- **Method**: `POST`
- **Endpoint**: `/api/v1/catalog`
- **Headers**:
  ```http
  X-Admin-API-Key: change-this-in-production
  Content-Type: application/json
  ```
- **Response**: `200 OK` (or `403 Forbidden` if API key is invalid)

#### Request Body Example
```json
{
  "training_id": "TRN-018",
  "title": "AI Tools for Academic Writing and Literature Review",
  "description": "Practical session on utilizing generative AI tools for academic literature synthesis.",
  "categories": ["Artificial Intelligence", "Research Methods"],
  "target_competencies": ["Research and Publication Writing"],
  "modalities": ["Webinar"],
  "durations": ["One day"],
  "schedules": ["Saturdays"],
  "status": "active"
}
```

#### Response Body Example
```json
{
  "status": "success",
  "message": "Catalog item saved successfully without model retraining.",
  "item": {
    "training_id": "TRN-018",
    "title": "AI Tools for Academic Writing and Literature Review",
    "description": "Practical session on utilizing generative AI tools for academic literature synthesis.",
    "categories": ["Artificial Intelligence", "Research Methods"],
    "target_competencies": ["Research and Publication Writing"],
    "modalities": ["Webinar"],
    "durations": ["One day"],
    "schedules": ["Saturdays"],
    "status": "active"
  }
}
```

---

### 4.6 Trigger Model Training

Triggers model training from raw survey dataset file.

- **Method**: `POST`
- **Endpoint**: `/api/v1/training/train`
- **Headers**:
  ```http
  X-Admin-API-Key: change-this-in-production
  ```
- **Response**: `200 OK`

#### Response Body Example
```json
{
  "status": "success",
  "version": "20260811140000",
  "artifact": "models/training_recommender_v20260811140000.joblib",
  "metrics": {
    "f1_micro": 0.842,
    "f1_macro": 0.791,
    "samples_trained": 150
  }
}
```

---

### 4.7 Signal Model Reload

Signals API worker nodes to reload active model artifacts.

- **Method**: `POST`
- **Endpoint**: `/api/v1/training/reload`
- **Headers**:
  ```http
  X-Admin-API-Key: change-this-in-production
  ```
- **Response**: `200 OK`

#### Response Body Example
```json
{
  "status": "restart_or_reload_workers_after_training"
}
```

---

## 5. Error Responses & Status Codes

| Status Code | Meaning | Example Response |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | Standard JSON response |
| `400 Bad Request` | Invalid payload schema or malformed JSON | `{"detail": "Field 'department' is required"}` |
| `403 Forbidden` | Missing or invalid `X-Admin-API-Key` | `{"detail": "Invalid or missing admin API key"}` |
| `404 Not Found` | Resource or raw training file not found | `{"detail": "Training dataset not found: ..."}` |
| `503 Service Unavailable` | No trained model is loaded | `{"detail": "No trained model is active."}` |

---

## 6. cURL Quickstart Examples

### Individual Recommendation
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/recommendations/individual" \
  -H "Content-Type: application/json" \
  -d '{
    "faculty": {
      "department": "BSED",
      "age": 35,
      "employment_status": "Permanent",
      "academic_rank": "Assistant Professor",
      "highest_educational_attainment": "Master'\''s Degree",
      "field_of_specialization": "English",
      "years_teaching": "5-10 years",
      "trainings_last_3_years": "1-2",
      "emerging_training_needs": {
        "artificial_intelligence": 5,
        "educational_technology": 5
      },
      "preferred_learning_modality": ["Webinar"],
      "preferred_schedule": ["Saturdays"]
    }
  }'
```

### Get Training Catalog
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/catalog"
```

### Add New Catalog Item (Admin)
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/catalog" \
  -H "Content-Type: application/json" \
  -H "X-Admin-API-Key: change-this-in-production" \
  -d '{
    "title": "Quantum Computing Essentials for Higher Ed",
    "description": "Introduction to quantum algorithms and implications for research.",
    "categories": ["Emerging Technology", "Research Methods"],
    "modalities": ["Webinar"],
    "durations": ["One day"],
    "schedules": ["Saturdays"],
    "status": "active"
  }'
```
