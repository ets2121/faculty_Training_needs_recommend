# Google Colab Model Training Notebook

This directory contains the plug-and-play **Google Colab Notebook** for training, evaluating, and exporting the ML model for the **QSU Faculty Training Needs Recommender System**.

---

## Files

| File | Description |
| :--- | :--- |
| [QSU_Faculty_Training_Recommender_Colab.ipynb](file:///e:/Traiing%20recomender%20system/qsu_training_recommender_production/notebooks/QSU_Faculty_Training_Recommender_Colab.ipynb) | Full plug-and-play Colab training notebook |
| [README.md](file:///e:/Traiing%20recomender%20system/qsu_training_recommender_production/notebooks/README.md) | This file |

---

## Quick Start — Google Colab

1. Open [colab.research.google.com](https://colab.research.google.com)
2. **File → Upload Notebook** → Select `QSU_Faculty_Training_Recommender_Colab.ipynb`
3. Click **Runtime → Run All**
4. When prompted, upload your `faculty_training.csv` dataset file
5. Download the generated `qsu_model_v*.zip` when it appears

---

## Notebook Cells Overview

| Cell | Purpose |
| :--- | :--- |
| **Cell 1** | Install and import all required libraries |
| **Cell 2** | Load dataset — upload in Colab or auto-detects locally |
| **Cell 3** | Dataset exploration — label distribution chart, missing values |
| **Cell 4** | Feature engineering identical to backend (`features.py`) |
| **Cell 5** | Build pipeline and train Random Forest model |
| **Cell 6** | Evaluate — Micro F1, Macro F1, Precision, Recall + per-class bar chart |
| **Cell 6b** | Transparent prediction demonstrator matching backend API output |
| **Cell 7** | Export backend-compatible model artifacts to ZIP |
| **Cell 8** | Step-by-step deployment instructions (drop-and-go + API reload) |
| **Cell 9** | Optional hyperparameter configuration guide |

---

## Model Artifact Compatibility

Artifacts produced by this notebook are **100% structurally identical** to artifacts produced by `train.py` in the backend:

| Output File | Backend Target | Description |
| :--- | :--- | :--- |
| `training_recommender_v*.joblib` | `./models/` | Scikit-learn Pipeline (preprocessor + RandomForest) |
| `labels_v*.joblib` | `./models/` | Fitted `MultiLabelBinarizer` with all topic classes |
| `metadata_v*.json` | `./models/` | Training metrics, version, and topic list |
| `active.json` | `./models/active.json` | Model registry pointer used by the API |

---

## Training vs Colab — Where to Train?

| | `train.py` (Built-in) | Colab Notebook |
| :--- | :--- | :--- |
| **Where** | Local machine / server | Google Colab cloud |
| **Trigger** | `python train.py` or Admin API | Run All Cells |
| **CSV Source** | `data/raw/faculty_training.csv` | Upload prompt or local |
| **Model output** | `./models/` auto-placed | Download ZIP, copy to `./models/` |
| **Best for** | Production CI/CD & automation | Experimentation, shared training, offline server |
| **GPU/CPU** | Your machine | Free Colab CPU/GPU |
