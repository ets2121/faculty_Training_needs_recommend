# QSU Faculty Training Needs Recommender System
## Thesis Defense & Review Q&A Guide (Direct & Concise)

> **Quick Reference Guide**: Questions and direct, concise answers for panel defense, technical walkthrough, and system evaluation.

---

## 1. Project Background & Institutional Value

### Q1: What is the main objective of this system?
- To provide an AI-driven, transparent web platform that assesses faculty competencies and recommends personalized training programs for Quirino State University (QSU) faculty, while aggregating institutional priorities for department and campus leaders.

### Q2: What was the problem with the previous/traditional process at QSU?
- Previous Training Needs Assessment (TNA) relied on manual paper forms and static surveys.
- Data consolidation was slow, recommendations were one-size-fits-all, and administrative training budgets were not aligned with actual competency deficiencies.

### Q3: Who are the target users of the system?
- **Teaching Faculty**: Complete self-assessment and receive Top 3 personalized training recommendations.
- **Department Administrators (Program Chairs)**: Access roster compliance and aggregated department training plans.
- **Campus Administrators (Directors/Deans)**: Monitor campus-wide compliance and inter-department training priorities.
- **System Administrators**: Manage user accounts, catalog programs, audit logs, and retrain/hot-swap ML models.

---

## 2. High-Level Architecture & Tech Stack

### Q4: What is the architecture of the system?
- **3-Tier Decoupled Architecture**:
  1. **Frontend Client**: Next.js 14 App Router (TypeScript + Tailwind CSS) running on port 3000.
  2. **Backend API**: FastAPI (Python 3.11 + Pydantic v2 + SQLAlchemy 2.0) running on port 8000.
  3. **Database & ML Storage**: MySQL (XAMPP/Cloud) for relational data + versioned `.joblib` model artifacts.

### Q5: Why choose Next.js 14 for the frontend?
- Role-based route groups `(faculty)`, `(dept-admin)`, `(campus-admin)`, `(sys-admin)`.
- Server-side rendering (SSR) capability, static optimization, and built-in API proxy rewrites to prevent CORS issues.
- Strict TypeScript type safety matching backend schemas.

### Q6: Why choose FastAPI instead of Flask or Django?
- **Speed**: Asynchronous ASGI framework with performance comparable to Node.js and Go.
- **Data Validation**: Automatic request/response validation via Pydantic.
- **Interactive Documentation**: Auto-generated Swagger UI (`/docs`) and ReDoc (`/redoc`).
- **Python Ecosystem**: Native integration with scikit-learn, pandas, and numpy.

### Q7: Why use MySQL with SQLAlchemy ORM and Alembic?
- **Relational Integrity**: Enforces foreign keys between campuses, departments, users, faculty, and questionnaire records.
- **Alembic**: Provides version-controlled database schema migrations.
- **Standard Stack**: Seamless compatibility with institutional SUC hosting environments (e.g., standard XAMPP or Linux VPS).

### Q8: How is authentication and security handled?
- **JWT (JSON Web Tokens)**: Stateless bearer token authentication with configurable expiry (8 hours default).
- **Password Security**: Passwords salted and hashed with `bcrypt`.
- **Role-Based Access Control (RBAC)**: Enforced via FastAPI dependencies checking token roles against endpoint scopes.
- **Audit Logging**: Sensitive operations (login, recommendations, user mutations, model retraining) logged with user ID, IP address, and timestamp.

---

## 3. Multi-Campus Hierarchy & Operations

### Q9: What campuses does the system support?
- All 3 campuses of Quirino State University:
  1. **Diffun Campus** (Main Campus)
  2. **Maddela Campus**
  3. **Cabarroguis Campus**

### Q10: How does the organizational data hierarchy work?
- `Campus` (1) ──► `Department` (Many) ──► `Faculty` (Many) ──► `Questionnaire Responses` (1:1).

### Q11: What is the questionnaire status lifecycle for a faculty member?
- **`not_started`**: Account created; no questionnaire parts submitted.
- **`in_progress`**: Partially answered, missing required parts.
- **`eligible`**: All 5 mandatory parts (1, 2, 3, 5, 6) submitted; ready for AI recommendation.
- **`has_recommendation`**: Recommendation generated and saved to database.

### Q12: How are incomplete faculty handled during department recommendations?
- They are automatically excluded from department score calculations and listed in the `skipped_faculty` audit list so department chairs know who hasn't finished the assessment.

---

## 4. Questionnaire Instrument & Input Data

### Q13: What is the questionnaire based on?
- The official QSU Faculty Training Needs Assessment Tool, structured into 6 web sections:
  - **Part 1**: Demographics & Academic Profile (rank, department, tenure, degree).
  - **Part 2**: Prior Training Participation (instruction, research, extension, IT, leadership, OBE).
  - **Part 3**: Core, Functional, and Leadership Competencies (Proficiency & Importance on 1–5 Likert scale).
  - **Part 4**: Emerging Training Needs (AI, ML, Cybersecurity, IoT, Data Science) *(Optional)*.
  - **Part 5**: Training Delivery Preferences (Modality, Schedule, Duration).
  - **Part 6**: Barriers to Training Participation (workload, budget, family commitments).

### Q14: How is a competency gap calculated?
$$\text{Gap} = \max(0, \text{Importance} - \text{Proficiency})$$
- Evaluated per competency domain to identify where high job importance meets low self-rated capability.

---

## 5. Dataset & Data Cleaning Pipeline

### Q15: What dataset is used to train the machine learning model?
- Real faculty survey respondents from Quirino State University (`data/raw/Raws_Datas_named.csv` / `faculty_training.csv`), containing 166–215 raw records across 115 survey columns.

### Q16: What is the 8-Step Data Cleaning Pipeline?
- Both Google Colab and the backend trainer use the standardized `clean_training_dataframe` module:
  1. **Whitespace Trimming**: Strips trailing and leading spaces from all string columns.
  2. **Canonical Topic Mapping**: Standardizes 100+ raw respondent free-text phrases into **17 canonical categories**.
  3. **Duplicate Removal**: Eliminates identical respondent entries.
  4. **Categorical Normalization**: Replaces missing values with empty strings or default categories.
  5. **Numerical Bounding**: Enforces valid Likert ranges `[1.0, 5.0]`.
  6. **Median Imputation**: Imputes missing numerical scores using column median.
  7. **High-Missing Row Filter**: Drops records missing more than 70% of feature values.
  8. **Target Topic Validation**: Drops rows with zero valid priority topics.

### Q17: What are the 17 Canonical Training Categories?
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

### Q18: Is the dataset size of 166 (to 215) respondents acceptable for this thesis/capstone? Why?
- **Yes, it is highly acceptable and academically valid** for four direct reasons:
  1. **Institutional Census Sample**: This is not an arbitrary internet scrape; it represents an institutional census of **75%–85% of active teaching faculty** across QSU's 3 campuses (Diffun, Maddela, Cabarroguis). In provincial State Universities and Colleges (SUCs), total faculty population is naturally bounded.
  2. **High Feature-to-Sample Information Density**: With 115 survey attributes per faculty member, the dataset provides rich, fine-grained tabular features (demographics, 20 competency proficiencies, 20 importance ratings, barriers, and delivery preferences).
  3. **Mathematical Compatibility with Random Forest**: Ensemble bagging with decorrelated trees thrives on small-to-medium tabular datasets ($N \approx 150\text{--}300$), avoiding the data-hungry overfitting failure modes of deep neural networks.
  4. **Empirical Proof on Unseen Test Data**: Evaluated on a strict held-out 20% test split, the model achieves **82.4% Top-1** and **97.1% Top-3 Hit Accuracy**, proving genuine generalization rather than memorization.

---

## 6. Machine Learning Model & Feature Engineering

### Q19: What machine learning algorithm is used?
- **Random Forest Classifier wrapped in a One-vs-Rest (OvR) Multi-Label Classifier**.

### Q20: Why was Random Forest selected for this research?
- **Non-linear Relationships**: Naturally captures complex interactions between demographics, tenure, and competencies.
- **Robustness**: Resistant to overfitting on small-to-medium institutional datasets.
- **Mixed Data Handling**: Seamlessly processes both categorical and numerical features.
- **Probability Outputs**: Provides reliable continuous probabilities (`predict_proba`) per category for ranking.
- **Feature Importance**: Provides transparent feature importance weights for institutional auditability.

### Q21: Why is this formulated as a Multi-Label classification task?
- Because a faculty member does not need just one single training topic; they have multiple concurrent professional development needs (Top 5 priorities).
- Multi-label classification allows predicting multiple active labels simultaneously for each respondent.

### Q22: What are the model's core hyperparameters?
- `n_estimators = 200`: 200 decision trees per binary classifier for stable variance reduction.
- `class_weight = "balanced"`: Compensates for minority training topics.
- `random_state = 42`: Ensures deterministic reproducibility across backend and Colab.
- `test_size = 0.20`: 80% train / 20% held-out test split.

### Q23: How are features engineered before training?
- Built via a Scikit-Learn `ColumnTransformer`:
  - **Categorical Columns** (department, rank, sex, tenure, modality, past trainings) ──► `OneHotEncoder(handle_unknown='ignore')`.
  - **Numerical Columns** (competency ratings, emerging needs, barriers) ──► `StandardScaler()`.
  - Total transformed feature vector: **67 input features**.

---

## 7. Target Leakage Prevention & Ground Truth Integrity

### Q24: What is "Target Leakage" and how does this system prevent it?
- **The Issue**: Deriving the target label from the formula $\text{Gap} = \text{Importance} - \text{Proficiency}$ would mean using an input feature to calculate the answer. The model would trivially memorize the formula without learning real patterns.
- **The Solution**: Targets are strictly taken from the faculty respondent's **actual Top Five Priority Topics chosen in Part VIII**. 
- The model learns the subtle human mapping between profile, competencies, and actual training aspirations.

---

## 8. The Training Catalog: Purpose, Decoupling & Importance

### Q25: What is the Training Catalog?
- A centralized database (`training_catalog.json` / relational database table) containing all concrete, available training programs at QSU.
- Each catalog item includes: `training_id`, `title`, `description`, `categories`, `target_competencies`, `modalities` (Face-to-face/Hybrid/Webinar), `durations`, `schedules`, and `status` (`active`/`inactive`).

### Q26: Why is there a separate Training Catalog instead of training the ML model directly on course titles?
- **Decoupling ML Prediction from Administrative Logistics**:
  - The ML model predicts **stable competency categories** (e.g., "Artificial Intelligence", "Research Methodology").
  - The catalog stores **real, changing university programs** (e.g., "TRN-021: AI Tools for Academic Writing").
- **Zero-Downtime Administrative Agility**:
  - Campus directors can add new courses, update dates, change modalities, or archive outdated programs **without retraining the ML model**.
- **Avoids the Extreme Cold-Start Dilemma**:
  - If course titles were model classes, every new course added would have zero survey training samples, breaking the model until a new campus-wide survey was completed.

### Q27: What is the importance and practical use of the Training Catalog?
- **Actionability**: Abstract ML predictions (e.g., "78% need in Cybersecurity") are converted into real enrollable programs with venues, providers, and schedules.
- **Budget & Resource Optimization**: Enables administrators to see which specific catalog courses satisfy the highest proportion of faculty demand.
- **Policy Compliance**: Ensures faculty are only recommended approved institutional seminars aligned with CHED/SUC standards.

### Q28: How does the system handle "Cold Start" for newly added catalog courses?
- New courses are mapped by category tags, target competencies, and delivery modality.
- When an admin uploads a new active course, the Matching Engine immediately evaluates it for eligible faculty with **zero delay and zero retraining required**.

### Q29: What happens if a training course is inactive or unavailable?
- The backend automatically checks `status == "active"`. Any course marked `inactive` or archived is completely omitted from the recommendation pipeline.

---

## 9. Recommendation Engine & Match Scoring

### Q30: How does the system generate training recommendations?
- **Hybrid 3-Stage Pipeline**:
  1. **Stage 1 (ML Inference)**: Random Forest outputs probability scores across all 17 categories.
  2. **Stage 2 (Catalog Filtering & Matching)**: The system filters active catalog courses belonging to the high-probability categories.
  3. **Stage 3 (Match Scoring & Ranking)**: Calculates a composite `match_score` (0.0 to 1.0) and presents the **Top 3 programs**.

### Q31: How is the Match Score calculated?
$$\text{Match Score} = (0.50 \times \text{ML Category Score}) + (0.30 \times \text{Competency Gap Alignment}) + (0.20 \times \text{Preference Score})$$
- **ML Category Score (50%)**: Probability assigned by the Random Forest model.
- **Competency Gap (30%)**: Normalized individual need score in that specific competency.
- **Preference Alignment (20%)**: Match between user's preferred delivery modality (Face-to-face/Hybrid/Webinar), duration, and schedule.

### Q32: Why show Top 3 recommendations instead of 10 or 20?
- **Cognitive Load & Actionability**: Higher education faculty have heavy workloads; presenting the Top 3 highly aligned programs provides immediate, actionable choices without decision fatigue.

### Q33: How are Department Recommendations calculated?
- The backend iterates over all eligible faculty in the department:
  - Calculates average category probability: $\text{Department Score} = \frac{1}{N} \sum \text{Score}_i$.
  - Calculates **Faculty Coverage**: Proportion of department members who need this topic.
  - Matches the department priority topics against the catalog to produce the Top 3 department-wide programs.

---

## 10. Model Transparency & Explainable AI (XAI)

### Q34: How is this system "Transparent" (not a black box)?
- Every recommendation response includes a `model` metadata block:
  - Active model version ID and algorithm (`Random Forest OvR`).
  - Sample size (training vs test records).
  - Accuracy metrics (Top-1, Top-3, Top-5 hit accuracy, Micro F1).
  - Feature importance weights showing what inputs influenced the predictions most (e.g., Age, Specific Gaps, Barriers).
  - Visible breakdown of Match Score factors for each recommended program.

### Q35: What is the GeneratingProgressModal?
- A 4-step real-time animated modal in the frontend that walks the faculty through the inference stages:
  1. Loading questionnaire assessment
  2. Running ML inference pipeline
  3. Matching training catalog programs
  4. Finalizing and saving recommendations

---

## 11. Evaluation Metrics & Real Performance

### Q36: What evaluation metrics are used to measure the model?
- **Top-1 Hit Accuracy (82.4%)**: The model's single highest predicted category was among the faculty's actual top priorities 82.4% of the time.
- **Top-3 Hit Accuracy (97.1%)**: At least one of the top 3 predicted categories matched actual priorities in 97.1% of test cases.
- **Top-5 Hit Accuracy (100.0%)**: At least one of the top 5 predicted categories matched actual priorities in 100% of test cases.
- **Hamming Accuracy (81.1%)**: Proportion of correctly predicted binary labels across all 17 categories.
- **Micro F1 Score (65.6%)**: Globally aggregated F1 score balancing multi-label precision and recall.
- **Exact Match Ratio (20.6%)**: Strict subset metric requiring all 17 binary labels to match perfectly simultaneously.

### Q37: How do you explain the difference between Exact Match and Top-k Hit Accuracy?
- In multi-label settings with 17 categories, **Exact Match** is overly harsh because missing even 1 out of 17 labels counts as 0%. 
- For a recommender system, **Top-k Hit Accuracy (Top-1: 82.4%, Top-3: 97.1%)** is the primary practical metric because the system only presents the Top 3 programs to the user.

---

## 12. Model Registry & MLOps Pipeline

### Q38: How does model retraining work without restarting the server?
- The System Admin triggers retraining on the `/ml-pipeline` page:
  - The trainer runs the 8-step cleaning pipeline and trains a new model version.
  - It saves artifacts to a timestamped folder: `models/{folder}/training_recommender_v{timestamp}.joblib`.
  - It atomically updates `models/active.json`.
  - The `ModelService` reloads the active artifact on the fly with zero server downtime.

### Q39: What does the 5-step stepper on the ML Pipeline page do?
- Displays real-time training phase feedback:
  - `Step 1/5`: Loading and validating dataset
  - `Step 2/5`: Applying 8-step data cleaning & canonical topic mapping
  - `Step 3/5`: Feature engineering & preprocessor fitting
  - `Step 4/5`: Fitting OneVsRest(RandomForestClassifier) & computing test evaluation metrics
  - `Step 5/5`: Pipeline complete & model deployed to active registry

---

## 13. Limitations & Future Work

### Q40: What are the current limitations of the system?
- **Dataset Size**: Currently trained on 166–215 institutional respondents from QSU; accuracy will improve as more annual cohorts complete the questionnaire.
- **Cold-Start Problem**: Faculty who haven't completed at least Parts 1, 2, 3, 5, 6 cannot receive AI recommendations.
- **Static Catalog**: Program availability depends on what administrators upload to the catalog.

### Q41: What are the recommended future enhancements?
- **LLM Syllabus Summarization**: Using Generative AI to automatically generate personalized course syllabi for top gaps.
- **Collaborative Filtering**: Incorporating peer feedback ratings after faculty complete recommended trainings.
- **HRIS Integration**: Direct synchronization with QSU's Human Resource Information System for automatic tenure and credential updates.
