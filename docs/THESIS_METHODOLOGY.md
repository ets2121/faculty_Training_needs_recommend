# QSU Faculty Training Needs Recommender — Thesis Methodology

> Academic methodology narrative for thesis documentation.
> System Version 3.0 — Multi-Campus · RBAC · Transparent ML Recommendations

---

## 1. Research Overview

This study presents the design, development, and evaluation of an intelligent web-based Faculty Training Needs Recommender System for Quirino State University (QSU). The system collects structured faculty assessment data through a six-part online questionnaire, processes it using a supervised machine learning pipeline, and generates personalized training program recommendations with full model transparency.

The system serves three hierarchical operational contexts:
1. **Individual faculty** — personalized training recommendations based on competency assessment
2. **Department** — aggregated training priorities for department-level planning
3. **Campus** — institution-wide training demand analysis across all departments

---

## 2. Conceptual Framework

```
[Input]                [Processing]              [Output]
Faculty profile    →   Feature Engineering   →   Category Scores
Training history   →   ML Inference         →   Match-Score Ranked
Competency         →   Catalog Matching     →   Training Programs
Emerging needs     →   Aggregation (dept)   →   Dept Priorities
Preferences        →   Persistence          →   Recommendation History
```

---

## 3. Data Collection Instrument

The questionnaire tool is based on the official QSU Faculty Training Needs Assessment Tool and is organized into six parts:

| Part | Content | Required |
|---|---|---|
| 1 | Personal Profile (rank, department, years of service) | Yes |
| 2 | Training History (attended programs, topic areas) | Yes |
| 3 | Competency Assessment (proficiency + importance per 20 areas) | Yes |
| 4 | Emerging Training Needs (AI, ML, Cybersecurity, etc.) | Optional |
| 5 | Preferred Modality, Schedule, Duration | Yes |
| 6 | Barriers to Training Participation | Yes |

A faculty member's questionnaire is considered complete when Parts 1, 2, 3, 5, and 6 are submitted (`questionnaire_status = 'eligible'`).

---

## 4. Machine Learning Model

### Algorithm

**Random Forest Classifier with One-vs-Rest Multi-label Classification**

Random Forest was selected as the baseline model for the following reasons:
- Handles mixed feature types (categorical + numeric)
- Robust to outliers and missing values
- Produces probability scores per label
- Interpretable feature importance
- Suitable for small-to-medium dataset sizes

### Feature Engineering

```
Categorical inputs → OneHotEncoder
Numeric inputs     → StandardScaler
                     ↓
              ColumnTransformer
                     ↓
             Feature Matrix (~67 features)
```

**Categorical features:** department, sex, employment_status, academic_rank, education, years_teaching, training areas, preferred modality

**Numeric features:** competency proficiency scores (10 areas), competency importance scores (10 areas), emerging training need ratings (9 areas), barrier ratings (4 areas), trainings_last_3_years

### Target Labels (17 Canonical Training Categories)

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

### Critical Integrity Constraint

The model targets **must** be the actual Top Five priority training topics selected by each respondent in Part VIII of the questionnaire form. They must NOT be derived algorithmically from the competency gap (Importance - Proficiency score).

Deriving targets from input features creates **target leakage**, which inflates model performance metrics and produces a system that cannot generalize to unseen faculty preferences.

### Training Procedure

```bash
python train.py
```

Steps:
1. Load dataset (`data/raw/Raws_Datas_named.csv` or `faculty_training.csv`)
2. Execute 8-step data cleaning pipeline (`clean_training_dataframe`): trim whitespace, normalize canonical topics, drop low-information rows, and validate Likert bounds
3. Multi-label binarize the top_1…top_5 columns across all 17 categories
4. Apply ColumnTransformer feature pipeline (OneHotEncoder + StandardScaler)
5. Train `OneVsRestClassifier(RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=42))`
6. Evaluate on 20% held-out test set
7. Report Top-1/3/5 hit accuracy, Exact Match, Hamming accuracy, Jaccard IoU, Micro/Macro F1, Precision, Recall, and Per-Category Performance Breakdown
8. Save versioned artifact to `models/`
9. Update `models/active.json`

---

## 5. Transparency & Explainability

The system is designed for academic and institutional accountability. Every recommendation includes:

### Model Transparency Card

```json
{
  "model": {
    "version": "v20260820180225",
    "algorithm": "Random Forest (One-vs-Rest)",
    "n_estimators": 100,
    "training_samples": 245,
    "features": 67,
    "labels": 9
  }
}
```

### Category Probability Scores

Raw ML probability scores are exposed per category, not hidden behind opaque rankings.

### Match Score

Each recommended training program displays a `match_score` (0–1) that reflects the combined relevance of the ML prediction and alignment with the faculty member's stated preferences (modality, schedule, duration).

### Department Transparency

For department-level recommendations, the system reports:
- `department_score`: average category probability across all eligible faculty
- `faculty_coverage`: proportion of faculty with score above threshold
- `eligible_faculty_count` vs `total_faculty_in_dept`
- `skipped_faculty` with their specific status reason

---

## 6. System Evaluation

### Quantitative Metrics

Report all of the following on a held-out test set (never seen during training):

| Metric | Target |
|---|---|
| Micro F1 | > 0.75 |
| Macro F1 | > 0.70 |
| Precision | > 0.75 |
| Recall | > 0.75 |
| Recall@5 | > 0.85 |

### Baseline Comparison

A stronger thesis compares the ML model against:

1. **Competency-gap baseline** — ranks categories by `(importance - proficiency)`, recommend top-5
2. **ML model** — Random Forest predictions
3. **Ground truth** — actual respondent Top Five priorities from questionnaire Part VIII

The comparison should use Recall@5 and Normalized Discounted Cumulative Gain (NDCG) as the primary metrics.

### Functional Evaluation

In addition to model metrics, evaluate:
- Questionnaire completion rate
- System usability (SUS scale)
- Stakeholder acceptance (department heads and faculty)
- Recommendation relevance rating by department heads

---

## 7. Role-Based Access Design

The system implements four roles aligned with QSU's organizational structure:

| Role | Real-world Equivalent | System Scope |
|---|---|---|
| `faculty` | Teaching faculty | Own assessment and recommendation |
| `department_admin` | Program Chair / Department Head | Department faculty roster and recommendations |
| `campus_admin` | Campus Director / Dean | All departments in one campus |
| `system_admin` | IT Administrator | Full system access, model management |

---

## 8. Multi-Campus Architecture

QSU operates across three campuses (Diffun, Maddela, Cabarroguis). The system supports all three within a single database using a `campuses` → `departments` → `faculty` hierarchy.

This design allows:
- Campus-specific recommendations
- Cross-campus comparisons by system admin
- Institutional planning at campus and university level

---

## 9. Privacy & Ethics

- All faculty data is stored with anonymized internal IDs
- Questionnaire responses are confidential and used only for academic recommendation purposes
- All administrative operations are audit-logged with timestamps and IP addresses
- The system complies with QSU's data privacy obligations under RA 10173 (Data Privacy Act of 2012)

---

## 10. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js + TypeScript | 14.x |
| UI Styling | Tailwind CSS | 3.x |
| Backend API | FastAPI | 0.11x |
| ORM | SQLAlchemy | 2.x |
| Database | MySQL (XAMPP) | 8.x |
| ML Library | scikit-learn | 1.x |
| Auth | JWT (PyJWT + bcrypt) | — |
| Migrations | Alembic | — |
| Testing | pytest + httpx | — |
