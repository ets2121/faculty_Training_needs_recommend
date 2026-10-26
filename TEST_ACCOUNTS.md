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

### Notes on Recommendation Diversity

Each faculty account produces **distinct probability scores and match scores** per category. The probability values, match scores, and ranked program recommendations differ per person based on their unique competency gaps and emerging needs.

Observed differences per account (verified against active model v20261025180418):

| Faculty | Top Category Score | Notable 4th/5th Rank | Match Score #1 |
| :--- | :--- | :--- | :--- |
| `prof_santos` | AI: 0.899 | Cybersecurity 4th | 0.97 (Webinar-aligned) |
| `prof_reyes` | AI: 0.840 | Leadership 4th | 0.84 |
| `prof_torres` | AI: 0.809 | Leadership 4th, Research 5th | 0.81 |
| `prof_navarro` | AI: 0.842, **ML: 0.825** | Cybersecurity 4th | 0.86 (ML program #1) |
| `prof_aquino` | AI: 0.855 | **Leadership 4th** | 0.92 |
| `prof_delacruz` | AI: 0.825 | **Cybersecurity 4th** | 0.82 |

> **Why do top-3 category names look similar?** The current model was trained on a dataset where AI/ML/Data Analytics were the dominant emerging needs across nearly all respondents. This creates a prediction bias toward those categories for any input. To get more divergent top-category rankings for Education/Leadership/Research-focused faculty, **retrain the model with a more balanced dataset** that includes respondents whose primary needs are in OBE, Research Methods, or Leadership domains.

---

## 5. Quick-Fill Feature on Login Page

The system login page (`/login`) includes an interactive **"Quick-Fill Test Accounts"** drawer. Clicking any test account button automatically populates the username and password fields for rapid testing without manual typing.
