# Architectural and Methodological Design
## QSU Faculty Training Needs Recommender System

This document provides a formal, thesis-ready explanation of the core architectural decisions, machine learning methodologies, and system design patterns utilized in the QSU Faculty Training Needs Recommender System.

---

## 1. Introduction

The QSU Faculty Training Needs Recommender is an intelligent backend system designed to bridge the gap between faculty survey data and actionable professional development programs. The system is engineered to handle dynamic university requirements where faculty profiles continuously evolve and the catalog of available training programs changes frequently. To address these challenges, the system employs a decoupled, multi-layer architecture integrating a machine learning classification engine with a rule-based recommendation matching system.

## 2. Machine Learning Methodology: Multi-Label Classification

### 2.1 The Problem Context
Faculty training needs are not mutually exclusive. A single faculty member may require development in multiple areas simultaneously (e.g., "Artificial Intelligence", "Research Methods", and "Effective Teaching"). Therefore, framing this as a standard multi-class classification problem (where only one outcome is predicted) would result in significant information loss. The system must predict an arbitrary subset of relevant training topics for each faculty profile.

### 2.2 Algorithm Selection: One-vs-Rest Random Forest
The system utilizes a **Random Forest Classifier** wrapped in a **One-vs-Rest (OvR)** meta-estimator. 

**Why Random Forest?**
1. **Non-linear Relationships**: Faculty profiles consist of diverse categorical (e.g., Academic Rank, Department) and numerical features (e.g., Age). Random Forests inherently capture complex, non-linear interactions between these features without requiring extensive manual feature engineering.
2. **Robustness to Overfitting**: By aggregating the predictions of multiple decision trees (ensemble learning), Random Forests reduce the variance of the model and prevent overfitting on smaller institutional datasets.
3. **Interpretability via Probabilities**: Unlike black-box neural networks, tree-based models can output reliable probability estimates for each class, which is critical for ranking recommendations.

**Why One-vs-Rest (OvR)?**
To solve the multi-label challenge, the OvR strategy trains a separate, independent Random Forest model for each possible training category (e.g., one model predicts "Needs AI training vs. Doesn't need AI training", another predicts "Needs Research Methods vs Doesn't"). This allows the system to output independent probability scores for every training category simultaneously, enabling the system to rank a faculty member's needs objectively from highest to lowest priority.

## 3. System Architecture: Separation of Concerns

A major architectural challenge in recommender systems is maintaining system stability when the inventory (the available training programs) changes. 

### 3.1 The Flaw of Tightly-Coupled Models
In traditional systems, the machine learning model is trained directly on the inventory items (e.g., predicting exactly which seminar a faculty member should attend). If the university replaces an old seminar with a new one, the entire ML model breaks and must be retrained from scratch because its output classes are now invalid.

### 3.2 The Decoupled Solution
This system solves the inventory problem by separating the **Prediction Engine** from the **Catalog Service**:

1. **The Machine Learning Layer**: Predicts *abstract competency categories* (e.g., "Data Analytics", "Leadership"). It does not know about specific seminars. 
2. **The Catalog Matching Layer**: Acts as a bridge. It takes the predicted categories and searches a dynamic JSON database (`training_catalog.json`) of currently active seminars. 

**Why use this approach?**
This decoupling ensures high system longevity. The university administration can add, remove, or modify specific training programs (e.g., changing "Intro to ChatGPT" to "Advanced AI in Education") at any time via the Catalog API without ever needing to retrain the machine learning model. The ML model only needs retraining when the fundamental demographic patterns of the faculty change.

## 4. Transparent API Design

The application exposes a "Transparent API" architecture. Instead of simply returning a black-box list of recommended seminars, the API returns a deeply structured JSON response containing:

1. **Top Predictions**: The abstract ML predictions alongside their raw mathematical probability scores.
2. **Rankings**: The ordinal ranking of the faculty member's needs.
3. **Match Scores**: When a specific catalog program is recommended, the API calculates and returns a `match_score`, explaining *why* the seminar was chosen based on the faculty member's predicted needs.

**Why use this approach?**
In institutional decision-making, AI transparency is vital. Administrators and faculty must trust the system's output. By providing the raw probabilities and match scores, the system provides an audit trail that explains its internal logic, transforming the AI from an unexplainable "black box" into a transparent decision-support tool.

## 5. Deployment and Model Portability

The system utilizes an automated deployment pipeline designed around standard Python serialization (`joblib`). 

### 5.1 Artifact Synchronization
When the model is trained, the pipeline exports not just the predictive model, but also the data preprocessors (e.g., `MultiLabelBinarizer`, `StandardScaler`, `OneHotEncoder`) into strict, version-controlled artifacts (e.g., `v20260812055414`). This guarantees that the exact mathematical transformations applied during training are identically applied during live production inference, preventing data drift.

### 5.2 The Google Colab Integration
To democratize model training and allow leveraging cloud GPUs, the system includes a fully functional Google Colab equivalent. The Colab notebook is mathematically and structurally identical to the backend's `train.py`. 
By rigorously pinning dependency versions (e.g., `scikit-learn==1.7.1`), the architecture allows data scientists to experiment, train, and export models in the cloud, and inject those models into the live FastAPI backend with zero code changes—a true plug-and-play architecture.
