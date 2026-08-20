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

Faculty accounts represent instructors across different assessment stages and campuses.

| Username | Password | Campus | Department | Questionnaire State | Capabilities / Testing Flow |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `prof_santos` | `faculty123` | Diffun | BSIT | `has_recommendation` | Full recommendation active; view top matched training programs & radar charts. |
| `prof_reyes` | `faculty123` | Diffun | BSIT | `eligible` | All 5 required parts completed; trigger personal AI recommendation request. |
| `prof_cruz` | `faculty123` | Diffun | BSIT | `in_progress` | Completed Parts 1-2; test resuming assessment flow at Part 3. |
| `prof_garcia` | `faculty123` | Diffun | BSIT | `not_started` | Fresh account onboarding; test starting questionnaire from Part 1. |
| `prof_torres` | `faculty123` | Diffun | BSED | `eligible` | Test department-specific recommendations in BSED. |
| `prof_navarro` | `faculty123` | Maddela | BSIT | `eligible` | Test Maddela Campus isolated faculty assessment. |
| `prof_aquino` | `faculty123` | Maddela | BSBA | `has_recommendation` | Test Maddela BSBA active recommendations. |
| `prof_delacruz` | `faculty123` | Cabarroguis | BSIT | `eligible` | Test Cabarroguis Campus isolated faculty assessment. |
| `prof_mendoza` | `faculty123` | Cabarroguis | BSHM | `not_started` | Test Cabarroguis BSHM fresh onboarding. |

---

## 5. Quick-Fill Feature on Login Page

The system login page (`/login`) includes an interactive **"Quick-Fill Test Accounts"** drawer. Clicking any test account button automatically populates the username and password fields for rapid testing without manual typing.
