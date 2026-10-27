# QSU Training Needs Recommender System — Seeded Test Accounts Documentation

This document provides a reference of all pre-seeded test accounts across all roles and campuses in the QSU Faculty Training Needs Recommender System.

---

## 1. System Administrator Account

| Username | Password | Role | Scope | Email | Purpose / Capabilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `system_admin` | System-wide | `admin@qsu.edu.ph` | Full access across all 3 campuses, user RBAC management, audit log inspection, ML pipeline retraining, and catalog maintenance. |

---

## 2. Campus Administrator Accounts

Each Campus Admin manages their specific campus, department chairs, faculty transfers, and campus-wide AI recommendation synthesis.

| Username | Password | Role | Campus Scope | Email | Purpose / Capabilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `admin_diffun` | `diffun123` | `campus_admin` | **Diffun Campus (Main)** | `diffun.admin@qsu.edu.ph` | Manages Diffun departments, provisions Diffun Dept Chairs, synthesizes campus AI priorities, transfers faculty. |
| `admin_maddela` | `maddela123` | `campus_admin` | **Maddela Campus** | `maddela.admin@qsu.edu.ph` | Manages Maddela departments, provisions Maddela Dept Chairs, synthesizes campus AI priorities, transfers faculty. |
| `admin_cabarroguis` | `cabarroguis123` | `campus_admin` | **Cabarroguis Campus** | `cabarroguis.admin@qsu.edu.ph` | Manages Cabarroguis departments, provisions Cabarroguis Dept Chairs, synthesizes campus AI priorities, transfers faculty. |

---

## 3. Department Administrator Accounts (Department Chairs)

Department Chairs manage faculty within their assigned department program under their respective campus.

| Username | Password | Role | Campus | Department Program | Email |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `dept_bsit` | `dept123` | `department_admin` | Diffun | BSIT (Info Tech) | `dept_bsit@qsu.edu.ph` |
| `dept_bsed` | `dept123` | `department_admin` | Diffun | BSED (Education) | `dept_bsed@qsu.edu.ph` |
| `dept_bsit_maddela` | `dept123` | `department_admin` | Maddela | BSIT (Info Tech) | `dept_bsit_maddela@qsu.edu.ph` |
| `dept_bsit_cabarroguis` | `dept123` | `department_admin` | Cabarroguis | BSIT (Info Tech) | `dept_bsit_cab@qsu.edu.ph` |

---

## 4. Faculty Test Accounts

Faculty accounts each have **distinct and realistic questionnaire profiles** — different competency gaps, emerging training needs, specializations, and preferences — so the ML model produces meaningfully differentiated predictions per person.

| Username | Password | Campus | Department | Profile Focus | Questionnaire State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `prof_santos` | `faculty123` | Diffun | BSIT | **IT / AI & Cybersecurity** — High AI & ML gaps, Webinar preferred | `has_recommendation` |
| `prof_reyes` | `faculty123` | Diffun | BSIT | **OBE / Pedagogy** — Low tech, high OBE & LMS gaps, Admin Chair | `eligible` |
| `prof_cruz` | `faculty123` | Diffun | BSIT | **Junior / IT** — Contractual, early stage (Parts 1-2 only) | `in_progress` |
| `prof_garcia` | `faculty123` | Diffun | BSIT | **Fresh Onboard** — No questionnaire data yet | `not_started` |
| `prof_torres` | `faculty123` | Diffun | BSED | **Education / Research** — Leadership & Research Methods gaps | `eligible` |
| `prof_navarro` | `faculty123` | Maddela | BSIT | **Tech + Leadership** — Strong IT, high Cybersecurity & Cloud needs | `eligible` |
| `prof_aquino` | `faculty123` | Maddela | BSBA | **Business / Governance** — QA & Research gaps, Program Chair | `has_recommendation` |
| `prof_delacruz` | `faculty123` | Cabarroguis | BSIT | **Cybersecurity / Cloud** — Junior, strong Cyber & Cloud interest | `eligible` |
| `prof_mendoza` | `faculty123` | Cabarroguis | BSHM | **Hospitality (Fresh)** — No questionnaire data yet | `not_started` |

### Verified Distinct Recommendation Results

The recommender engine synthesizes both the machine learning model's demographic pattern recognition and the faculty member's explicitly filled questionnaire assessments (Part 5 Competency Assessment gaps and Part 6 Emerging Needs ratings). As a result, each faculty profile produces **distinct top competency gaps and corresponding matched catalog programs**:

| Faculty | Specialization / Profile Focus | Top 3 ML Competency Gap Predictions | Top 3 Recommended Training Programs |
| :--- | :--- | :--- | :--- |
| `prof_santos` | Computer Science (Diffun BSIT) | **#1 Artificial Intelligence (96.0%)**<br>**#2 Machine Learning (89.1%)**<br>**#3 Data Analytics (73.9%)** | `T001` Applied AI & Prompt Engineering (0.99)<br>`T002` Machine Learning Foundations (0.99)<br>`TRN-018` AI Tools for Academic Writing (0.99) |
| `prof_reyes` | Education & Pedagogy (Diffun BSIT) | **#1 Learning Management Systems (74.7%)**<br>**#2 Educational Technology (69.8%)**<br>**#3 Artificial Intelligence (57.6%)** | `T006` LMS Administration & Course Design (0.75)<br>`T007` Educational Tech & Digital Pedagogy (0.70)<br>`T001` Applied AI & Prompt Engineering (0.58) |
| `prof_torres` | Educational Management (Diffun BSED) | **#1 Research Methods (78.4%)**<br>**#2 Statistical Software (73.0%)**<br>**#3 Data Analytics (62.2%)** | `T009` Advanced Research Methods (0.81)<br>`TRN-018` AI Tools for Academic Writing (0.78)<br>`T008` Statistical Software Mastery (0.76) |
| `prof_delacruz` | Cybersecurity & Cloud (Cabarroguis BSIT) | **#1 Cybersecurity (81.9%)**<br>**#2 Cloud Computing (73.5%)**<br>**#3 Artificial Intelligence (69.0%)** | `T004` Cybersecurity Awareness & Data Privacy (0.82)<br>`T005` Cloud Computing Architectures (0.73)<br>`T001` Applied AI & Prompt Engineering (0.69) |
| `prof_aquino` | Business & Governance (Maddela BSBA) | **#1 Research Methods (77.7%)**<br>**#2 Data Analytics (74.3%)**<br>**#3 Artificial Intelligence (58.2%)** | `T009` Advanced Research Methods (0.88)<br>`T003` Data Analytics & Visualization (0.84)<br>`TRN-018` AI Tools for Academic Writing (0.78) |
| `prof_navarro` | IT & Tech Leadership (Maddela BSIT) | **#1 Data Analytics (89.2%)**<br>**#2 Cybersecurity (82.7%)**<br>**#3 Artificial Intelligence (81.7%)** | `T003` Data Analytics & Visualization (0.92)<br>`T002` Machine Learning Foundations (0.84)<br>`T004` Cybersecurity Awareness (0.83) |

---

## 5. Quick-Fill Feature on Login Page

The system login page (`/login`) includes an interactive **"Quick-Fill Test Accounts"** drawer. Clicking any test account button automatically populates the username and password fields for rapid testing without manual typing.
