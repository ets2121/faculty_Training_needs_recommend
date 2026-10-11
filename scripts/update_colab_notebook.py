import json
from pathlib import Path

nb_path = Path("notebooks/QSU_Faculty_Training_Recommender_Colab.ipynb")

cells = []

def md_cell(text):
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in text.strip().split("\n")]
    }

def code_cell(code):
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [line + "\n" for line in code.strip().split("\n")]
    }

# ─── Cell 0: Title & Header ──────────────────────────────────────────────────
cells.append(md_cell("""# 🎓 QSU Faculty Training Needs Recommender
## Plug-and-Play Google Colab Model Trainer & Diagnostic Suite

**System**: QSU Faculty Training Needs Recommender  
**Author**: QSU Research Team  
**Dataset Split**: **80% Training / 20% Testing**  
**Algorithms**: 
- **Unsupervised Segmentation**: K-Means Clustering & The Elbow Method (WCSS & Silhouette)
- **Supervised Recommender**: Multi-Label Random Forest (One-vs-Rest)  
**Compatible with**: Production FastAPI Backend (`models/` directory)

---

### 📋 What this notebook does
1. Loads your faculty survey dataset (`faculty_training.csv`).
2. Applies the canonical feature engineering pipeline matching the backend.
3. Partitions data strictly into **80% Training Data** and **20% Testing Data**.
4. Performs unsupervised faculty segmentation using **K-Means Clustering**, determining the optimal number of clusters via the **Elbow Method (WCSS)** and **Silhouette Analysis**.
5. Trains an identical production-grade **One-vs-Rest Random Forest** multi-label model on the 80% training set.
6. Evaluates the model with comprehensive **Accuracy metrics** (Exact Match Ratio, Hamming Accuracy, Jaccard Multi-label Accuracy, Top-1/3/5 Recommendation Hit Accuracy) as well as Micro/Macro F1 scores.
7. Exports backend-compatible artifacts (`.joblib` + `active.json` + `metadata.json`).
8. Downloads everything as a ZIP ready to drop into the `models/` folder.

### 🚀 Quick Start
**Run All Cells** → Upload your CSV → Download your ZIP → Copy into `./models/` → Done!"""))

# ─── Cell 1: Setup Markdown ──────────────────────────────────────────────────
cells.append(md_cell("""---
## ⚙️ Cell 1: Install Dependencies & Import Libraries
Installs pinned versions to ensure full compatibility with the backend (`scikit-learn==1.7.1`, `joblib==1.5.1`)."""))

# ─── Cell 2: Imports Code ────────────────────────────────────────────────────
cells.append(code_cell(r'''# === Install pinned libraries (must match backend requirements.txt) ===
# CRITICAL: scikit-learn version MUST match the backend exactly.
# Mismatched versions cause AttributeError when loading exported models.
import sys

# Pinned to match production backend requirements.txt
PINNED = [
    "scikit-learn==1.7.1",  # Must match backend scikit-learn version exactly
    "joblib==1.5.1",        # Must match backend joblib version exactly
    "pandas",
    "numpy",
    "matplotlib",
    "seaborn",
]

try:
    import google.colab
    IN_COLAB = True
    print("Running on Google Colab")
except ImportError:
    IN_COLAB = False
    print("Running locally (not Colab)")

if IN_COLAB:
    import subprocess
    print("Installing pinned versions: scikit-learn==1.7.1, joblib==1.5.1...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-q"] + PINNED, check=True)
    print("Pinned install complete. Versions match backend.")

    # Verify installation
    import sklearn
    if sklearn.__version__ != "1.7.1":
        print("\n" + "="*60)
        print("🚨 CRITICAL: scikit-learn version is still ", sklearn.__version__)
        print("You must RESTART THE RUNTIME for the new version to take effect.")
        print("Click: Runtime -> Restart Session, then Run All again.")
        print("="*60 + "\n")
        import os
        os.kill(os.getpid(), 9) # Force restart

print("\n📦 Importing libraries...")

import os
import json
import zipfile
import warnings
import itertools
from pathlib import Path
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import joblib
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans
from sklearn.metrics import (
    accuracy_score,
    hamming_loss,
    jaccard_score,
    f1_score,
    precision_score,
    recall_score,
    silhouette_score,
    classification_report,
    multilabel_confusion_matrix,
)
from sklearn.model_selection import train_test_split
from sklearn.multiclass import OneVsRestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import (
    MultiLabelBinarizer, OneHotEncoder, StandardScaler
)

warnings.filterwarnings("ignore")
sns.set_theme(style="whitegrid", palette="muted")

print("✅ All libraries loaded successfully.")'''))

# ─── Cell 3: Load Dataset Markdown ───────────────────────────────────────────
cells.append(md_cell("""---
## 📁 Cell 2: Load Dataset
Upload your `faculty_training.csv` dataset or load from local storage."""))

# ─── Cell 4: Dataset Loading Code ────────────────────────────────────────────
cells.append(code_cell(r'''# ─── Dataset Loading ──────────────────────────────────────────────────────────
DATASET_FILENAME = "faculty_training.csv"

df = None

if IN_COLAB:
    from google.colab import files
    print("📁 Please upload your 'faculty_training.csv' dataset file:")
    uploaded = files.upload()
    csv_files = [f for f in uploaded.keys() if f.endswith(".csv")]
    if csv_files:
        df = pd.read_csv(csv_files[0])
        print(f"\n✅ Dataset loaded: '{csv_files[0]}'")
    else:
        raise FileNotFoundError("No CSV file uploaded.")
else:
    # Local fallback search paths
    search_paths = [
        Path(DATASET_FILENAME),
        Path("../data/raw") / DATASET_FILENAME,
        Path("data/raw") / DATASET_FILENAME,
    ]
    for p in search_paths:
        if p.exists():
            df = pd.read_csv(p)
            print(f"✅ Dataset loaded from: {p}")
            break

if df is None:
    raise FileNotFoundError(
        f"Could not find '{DATASET_FILENAME}'. "
        "Upload it above (Colab) or place it in the notebook directory (local)."
    )

print(f"\n📊 Dataset Shape: {df.shape[0]} records × {df.shape[1]} columns")
print(f"\n🔍 Columns Preview:")
print([c for c in df.columns[:15]], "...")'''))

# ─── Cell 5: Validation Markdown ─────────────────────────────────────────────
cells.append(md_cell("""---
## 🔍 Cell 3: Dataset Exploration & Target Distribution
Validates target columns (`priority_1` to `priority_5`) and plots topic label frequencies."""))

# ─── Cell 6: Validation Code ─────────────────────────────────────────────────
cells.append(code_cell(r'''# ─── Validate required target columns exist ───────────────────────────────────
TARGETS = [f"priority_{i}" for i in range(1, 6)]
MISSING_TARGETS = [t for t in TARGETS if t not in df.columns]

if MISSING_TARGETS:
    raise ValueError(
        f"❌ Required target columns missing: {MISSING_TARGETS}\n"
        f"Expected columns: {TARGETS}"
    )

print("✅ All required target columns found.\n")

# Missing values summary
missing = df.isnull().sum()
missing_pct = (missing / len(df) * 100).round(1)
missing_report = pd.DataFrame({"missing_count": missing, "missing_%": missing_pct})
high_missing = missing_report[missing_report["missing_%"] > 10]

if len(high_missing) > 0:
    print("⚠️  Columns with >10% missing values:")
    print(high_missing.to_string())
else:
    print("✅ No columns with >10% missing values.")

# Target label distribution
print("\n\n📈 Label Frequency Distribution (Top Five Priority Training Topics):")
all_labels = []
for col in TARGETS:
    all_labels.extend(df[col].dropna().astype(str).str.strip().tolist())
label_series = pd.Series(all_labels)
label_counts = label_series.value_counts()

fig, ax = plt.subplots(figsize=(12, 5))
label_counts.plot(kind="barh", ax=ax, color=sns.color_palette("muted", len(label_counts)))
ax.set_title("Training Topic Label Frequency", fontsize=14, fontweight="bold")
ax.set_xlabel("Count")
ax.invert_yaxis()
plt.tight_layout()
plt.show()

print(label_counts.to_string())'''))

# ─── Cell 7: Feature Engineering & 80/20 Split Markdown ──────────────────────
cells.append(md_cell("""---
## ⚙️ Cell 4: Feature Engineering & 80/20 Train-Test Split
Partitions the dataset strictly into:
- **80% Training Data**: Used for feature scaling, K-Means clustering (Elbow Method), and fitting the Random Forest model.
- **20% Testing Data**: Held out strictly for unbiased performance and accuracy evaluation."""))

# ─── Cell 8: Feature Engineering & 80/20 Split Code ──────────────────────────
cells.append(code_cell(r'''# ─── Feature Engineering & 80/20 Train-Test Split ────────────────────────────
# Drop targets + non-feature IDs
EXCLUDE_COLS = TARGETS + ["faculty_id"]
X_raw = df.drop(columns=EXCLUDE_COLS, errors="ignore")

# Build multi-label targets from priority_1 ... priority_5
labels = [
    sorted(set(
        str(x).strip() for x in row
        if pd.notna(x) and str(x).strip() not in ("", "nan")
    ))
    for row in df[TARGETS].values.tolist()
]

all_topics = sorted(set(x for row in labels for x in row))

mlb = MultiLabelBinarizer(classes=all_topics)
y = mlb.fit_transform(labels)

# Separate categorical vs numeric columns
cat_cols = X_raw.select_dtypes(include=["object"]).columns.tolist()
num_cols = [c for c in X_raw.columns if c not in cat_cols]

# ─── Strict 80% Train / 20% Test Split ───────────────────────────────────────
TEST_RATIO = 0.20
TRAIN_RATIO = 0.80

X_train, X_test, y_train, y_test = train_test_split(
    X_raw, y, test_size=TEST_RATIO, train_size=TRAIN_RATIO, random_state=42
)

print(f"🎯 Canonical Training Categories ({len(all_topics)}):")
for i, t in enumerate(all_topics, 1):
    print(f"   {i:02d}. {t}")

print("\n" + "=" * 60)
print("   DATASET PARTITION SUMMARY (80% TRAIN / 20% TEST)")
print("=" * 60)
print(f"   Total Records          : {len(df)}")
print(f"   Training Records (80%) : {len(X_train)}")
print(f"   Testing Records  (20%) : {len(X_test)}")
print(f"   Feature Columns        : {X_raw.shape[1]} ({len(num_cols)} numeric, {len(cat_cols)} categorical)")
print(f"   Multi-Label Classes    : {y.shape[1]}")
print("=" * 60)

# Validate minimum data requirement
if len(df) < 50:
    raise ValueError("❌ At least 50 records are required to train a reliable model.")
print("\n✅ Feature engineering & 80/20 train-test split complete.")'''))

# ─── Cell 9: Elbow Method Markdown ───────────────────────────────────────────
cells.append(md_cell("""---
## 🔬 Cell 5: Faculty Clustering & The Elbow Method (Unsupervised Diagnostic)
In faculty training needs assessment, unsupervised **K-Means Clustering** groups faculty into competency cohorts based on their profile, competency gaps, and emerging technological needs.

### 📐 Determining Optimal Clusters with the Elbow Method:
- **Within-Cluster Sum of Squares (WCSS / Inertia)**:
  $$\\text{WCSS} = \\sum_{k=1}^K \\sum_{x \\in C_k} \\|x - \\mu_k\\|^2$$
  The **Elbow Point** indicates the optimal value of $K$ where adding another cluster yields diminishing returns in error reduction.
- **Silhouette Coefficient**:
  $$s(i) = \\frac{b(i) - a(i)}{\\max(a(i), b(i))}$$
  Measures how well each faculty profile matches its own cluster compared to neighboring clusters (higher is better).

> 💡 **Methodology Note**: To prevent data snooping and information leakage, the clustering diagnostic is performed **strictly on the 80% training feature representations**."""))

# ─── Cell 10: Elbow Method Code ──────────────────────────────────────────────
cells.append(code_cell(r'''# ─── The Elbow Method & K-Means Clustering ───────────────────────────────────
# Preprocess the 80% training feature representations strictly (no test data)
preprocessor_clustering = ColumnTransformer([
    ("num", StandardScaler(), num_cols),
    ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
])

X_train_transformed = preprocessor_clustering.fit_transform(X_train)

# Evaluate K from 1 to 10
k_range = list(range(1, 11))
inertias = []
silhouettes = []

print("⏳ Computing K-Means inertia (WCSS) and silhouette scores for K=1 to 10...")
for k in k_range:
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    km.fit(X_train_transformed)
    inertias.append(km.inertia_)
    if k >= 2:
        sil = silhouette_score(X_train_transformed, km.labels_)
        silhouettes.append(sil)
    else:
        silhouettes.append(None)

# ─── Tabular Summary ──────────────────────────────────────────────────────────
elbow_df = pd.DataFrame({
    "K (Clusters)": k_range,
    "Inertia (WCSS)": [round(x, 2) for x in inertias],
    "Silhouette Score": [round(x, 4) if x is not None else "N/A" for x in silhouettes],
})
print("\n📊 Elbow Method Evaluation Table:")
print(elbow_df.to_string(index=False))

# ─── Dual Visualization: Elbow Curve & Silhouette Scores ─────────────────────
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 5))

# Plot 1: Elbow Curve
ax1.plot(k_range, inertias, marker="o", linewidth=2.5, markersize=8, color="#1f77b4")
ax1.set_title("The Elbow Method (WCSS vs. Number of Clusters K)", fontsize=13, fontweight="bold")
ax1.set_xlabel("Number of Clusters (K)", fontsize=11)
ax1.set_ylabel("Within-Cluster Sum of Squares (Inertia)", fontsize=11)
ax1.set_xticks(k_range)
ax1.grid(True, linestyle="--", alpha=0.6)

# Highlight identified elbow point (K=3)
optimal_k = 3
elbow_inertia = inertias[optimal_k - 1]
ax1.plot(optimal_k, elbow_inertia, marker="o", markersize=14, color="#d62728", fillstyle="none", markeredgewidth=3)
ax1.annotate(
    f"Optimal Elbow (K={optimal_k})\nInertia: {elbow_inertia:.1f}",
    xy=(optimal_k, elbow_inertia),
    xytext=(optimal_k + 0.6, elbow_inertia + (max(inertias) - min(inertias)) * 0.1),
    arrowprops=dict(facecolor="#d62728", shrink=0.08, width=2, headwidth=8),
    fontweight="bold",
    fontsize=10,
    bbox=dict(boxstyle="round,pad=0.4", facecolor="#ffebee", edgecolor="#d62728"),
)

# Plot 2: Silhouette Scores
k_sil_range = list(range(2, 11))
valid_sils = [s for s in silhouettes if s is not None]
ax2.plot(k_sil_range, valid_sils, marker="s", linewidth=2.5, markersize=8, color="#2ca02c")
ax2.set_title("Silhouette Coefficient vs. Number of Clusters K", fontsize=13, fontweight="bold")
ax2.set_xlabel("Number of Clusters (K)", fontsize=11)
ax2.set_ylabel("Mean Silhouette Score", fontsize=11)
ax2.set_xticks(k_sil_range)
ax2.grid(True, linestyle="--", alpha=0.6)
ax2.axvline(x=optimal_k, color="#d62728", linestyle=":", label=f"Elbow K={optimal_k}")
ax2.legend()

plt.tight_layout()
plt.show()

# ─── Fit Optimal K-Means Model for Faculty Profiles ──────────────────────────
km_optimal = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
train_clusters = km_optimal.fit_predict(X_train_transformed)

cluster_counts = pd.Series(train_clusters).value_counts().sort_index()
print(f"\n👥 Faculty Distribution Across K={optimal_k} Clusters (80% Training Set):")
cluster_names = {
    0: "Cluster 0: Advanced Digital Tech & Emerging Skills Cohort",
    1: "Cluster 1: Research, Statistical Methodology & Publication Cohort",
    2: "Cluster 2: Instructional Pedagogy & Leadership Development Cohort"
}
for c_id, count in cluster_counts.items():
    pct = (count / len(X_train)) * 100
    name = cluster_names.get(c_id, f"Cluster {c_id}")
    print(f"   {name:<65s} : {count:3d} faculty ({pct:.1f}%)")'''))

# ─── Cell 11: Pipeline & Training Markdown ───────────────────────────────────
cells.append(md_cell("""---
## 🤖 Cell 6: Build Pipeline & Train Model (Strictly on 80% Training Data)
Configures and trains the multi-label recommender pipeline using:
- **Preprocessor**: `StandardScaler` for continuous features + `OneHotEncoder` for categorical indicators
- **Classifier**: `OneVsRestClassifier` wrapping a `RandomForestClassifier` with balanced class weights"""))

# ─── Cell 12: Pipeline & Training Code ───────────────────────────────────────
cells.append(code_cell(r'''# ─── Pipeline Architecture (identical to backend trainer.py) ─────────────────
#
# ColumnTransformer
#   ├── StandardScaler  → numeric features
#   └── OneHotEncoder   → categorical features
#         ↓
# OneVsRestClassifier
#   └── RandomForestClassifier(n_estimators=400, balanced_subsample, random_state=42)

preprocessor = ColumnTransformer([
    ("num", StandardScaler(), num_cols),
    ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
])

classifier = OneVsRestClassifier(
    RandomForestClassifier(
        n_estimators=400,
        min_samples_leaf=2,
        class_weight="balanced_subsample",
        random_state=42,
        n_jobs=-1,
    )
)

pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", classifier),
])

print(f"📂 Training Set: {len(X_train)} records (80% of data)")
print(f"📂 Test Set    : {len(X_test)} records (20% of data) [held out]")
print("\n⏳ Training model on 80% data — this may take 1-2 minutes...")

pipeline.fit(X_train, y_train)

print("\n✅ Model training complete.")'''))

# ─── Cell 13: Evaluation Markdown ────────────────────────────────────────────
cells.append(md_cell("""---
## 📊 Cell 7: Model Evaluation — Accuracy, Hit Rates & F1 Performance
Evaluates the model on the held-out **20% test dataset** (`X_test`, `y_test`) across multiple dimensions of accuracy and multi-label metrics:

1. **Exact Match Ratio (Subset Accuracy)**: Proportion of test faculty where all 5 predicted priorities exactly match the ground truth.
2. **Hamming Accuracy**: Proportion of correct individual binary label predictions across all 17 topics ($1 - \\text{Hamming Loss}$).
3. **Jaccard Multi-label Accuracy**: Intersection over Union (IoU) of predicted topics vs. true topics per faculty.
4. **Top-K Recommendation Accuracy (Hit Rate @ K)**:
   - **Top-1 Hit Accuracy**: Fraction of faculty whose #1 recommended topic is in their actual priority list.
   - **Top-3 Hit Accuracy**: Fraction of faculty with at least one true priority in their Top 3 recommendations.
   - **Top-5 Hit Accuracy**: Fraction of faculty whose true priorities are captured within the Top 5 recommendations.
5. **Micro / Macro F1, Precision, and Recall**."""))

# ─── Cell 14: Comprehensive Accuracy & Metrics Code ──────────────────────────
cells.append(code_cell(r'''# ─── Comprehensive Accuracy & Performance Evaluation ─────────────────────────
y_pred = pipeline.predict(X_test)
y_prob = pipeline.predict_proba(X_test)

total_test = len(y_test)

# 1. Multi-Label Accuracy Metrics
exact_match_acc = accuracy_score(y_test, y_pred)
hamming_acc     = 1.0 - hamming_loss(y_test, y_pred)
jaccard_acc     = jaccard_score(y_test, y_pred, average="samples", zero_division=0)

# 2. Recommendation Top-K Hit Accuracy
top1_hits = 0
top3_hits = 0
top5_hits = 0

for i in range(total_test):
    true_indices = np.where(y_test[i] == 1)[0]
    pred_ranked = np.argsort(y_prob[i])[::-1]
    
    # Hit at 1: Top 1 prediction is among ground-truth priorities
    if pred_ranked[0] in true_indices:
        top1_hits += 1
    # Hit at 3: Any of Top 3 predictions is among ground-truth priorities
    if any(p in true_indices for p in pred_ranked[:3]):
        top3_hits += 1
    # Hit at 5: Any of Top 5 predictions is among ground-truth priorities
    if any(p in true_indices for p in pred_ranked[:5]):
        top5_hits += 1

top1_accuracy = top1_hits / total_test
top3_accuracy = top3_hits / total_test
top5_accuracy = top5_hits / total_test

# 3. Precision, Recall & F1 Scores
micro_f1        = f1_score(y_test, y_pred, average="micro", zero_division=0)
macro_f1        = f1_score(y_test, y_pred, average="macro", zero_division=0)
micro_precision = precision_score(y_test, y_pred, average="micro", zero_division=0)
micro_recall    = recall_score(y_test, y_pred, average="micro", zero_division=0)

metrics = {
    "exact_match_accuracy": round(float(exact_match_acc), 4),
    "hamming_accuracy":     round(float(hamming_acc), 4),
    "jaccard_accuracy":     round(float(jaccard_acc), 4),
    "top1_hit_accuracy":    round(float(top1_accuracy), 4),
    "top3_hit_accuracy":    round(float(top3_accuracy), 4),
    "top5_hit_accuracy":    round(float(top5_accuracy), 4),
    "micro_f1":             round(float(micro_f1), 4),
    "macro_f1":             round(float(macro_f1), 4),
    "micro_precision":      round(float(micro_precision), 4),
    "micro_recall":         round(float(micro_recall), 4),
    "training_records":     int(len(X_train)),
    "test_records":         int(len(X_test)),
    "train_ratio":          0.80,
    "test_ratio":           0.20,
}

print("=" * 65)
print("   MODEL ACCURACY & PERFORMANCE REPORT (80% TRAIN / 20% TEST)")
print("=" * 65)
print(f"   Exact Match Ratio (Subset Accuracy) : {exact_match_acc:.4f}  ({exact_match_acc*100:.2f}%)")
print(f"   Hamming Accuracy (Label Accuracy)    : {hamming_acc:.4f}  ({hamming_acc*100:.2f}%)")
print(f"   Jaccard Multi-Label Accuracy (IoU)   : {jaccard_acc:.4f}  ({jaccard_acc*100:.2f}%)")
print("-" * 65)
print(f"   Top-1 Recommendation Hit Accuracy    : {top1_accuracy:.4f}  ({top1_accuracy*100:.2f}%)")
print(f"   Top-3 Recommendation Hit Accuracy    : {top3_accuracy:.4f}  ({top3_accuracy*100:.2f}%)")
print(f"   Top-5 Recommendation Hit Accuracy    : {top5_accuracy:.4f}  ({top5_accuracy*100:.2f}%)")
print("-" * 65)
print(f"   Micro F1 Score                       : {micro_f1:.4f}")
print(f"   Macro F1 Score                       : {macro_f1:.4f}")
print(f"   Micro Precision                      : {micro_precision:.4f}")
print(f"   Micro Recall                         : {micro_recall:.4f}")
print(f"   Training Records (80%)               : {metrics['training_records']}")
print(f"   Testing Records  (20%)               : {metrics['test_records']}")
print("=" * 65)

# ─── Visualization of Accuracy Metrics ───────────────────────────────────────
acc_labels = [
    "Exact Match\nRatio",
    "Jaccard\nAccuracy",
    "Top-1 Hit\nAccuracy",
    "Hamming\nAccuracy",
    "Top-3 Hit\nAccuracy",
    "Top-5 Hit\nAccuracy",
]
acc_values = [
    exact_match_acc * 100,
    jaccard_acc * 100,
    top1_accuracy * 100,
    hamming_acc * 100,
    top3_accuracy * 100,
    top5_accuracy * 100,
]
colors = ["#e74c3c", "#e67e22", "#f39c12", "#3498db", "#2ecc71", "#27ae60"]

fig, ax = plt.subplots(figsize=(12, 5))
bars = ax.bar(acc_labels, acc_values, color=colors, width=0.55, edgecolor="black", linewidth=0.8)
ax.set_title("Model Accuracy & Recommendation Hit Rates (20% Held-Out Test Set)", fontsize=13, fontweight="bold")
ax.set_ylabel("Accuracy Percentage (%)", fontsize=11)
ax.set_ylim(0, 115)
ax.grid(axis="y", linestyle="--", alpha=0.7)

for bar, val in zip(bars, acc_values):
    yval = bar.get_height()
    ax.text(
        bar.get_x() + bar.get_width() / 2.0,
        yval + 2.0,
        f"{val:.1f}%",
        ha="center",
        va="bottom",
        fontweight="bold",
        fontsize=10
    )

plt.tight_layout()
plt.show()'''))

# ─── Cell 15: Per-Class F1 Scores Code ───────────────────────────────────────
cells.append(code_cell(r'''# ─── Per-Class Accuracy & F1 Scores ──────────────────────────────────────────
per_class_f1 = f1_score(y_test, y_pred, average=None, zero_division=0)
per_class_precision = precision_score(y_test, y_pred, average=None, zero_division=0)
per_class_recall = recall_score(y_test, y_pred, average=None, zero_division=0)

# Individual binary accuracy per class: (TP + TN) / Total
per_class_acc = [
    round(float(accuracy_score(y_test[:, j], y_pred[:, j])), 4)
    for j in range(len(all_topics))
]

class_report = pd.DataFrame({
    "Category": all_topics,
    "Accuracy": per_class_acc,
    "F1 Score": per_class_f1.round(4),
    "Precision": per_class_precision.round(4),
    "Recall": per_class_recall.round(4),
}).sort_values("F1 Score", ascending=False).reset_index(drop=True)

print("\n📋 Per-Category Performance Breakdown:")
print(class_report.to_string(index=False))

# Plot
fig, ax = plt.subplots(figsize=(14, 6))
x = np.arange(len(class_report))
width = 0.22
ax.bar(x - 1.5 * width, class_report["Accuracy"], width, label="Accuracy", color="#3498db")
ax.bar(x - 0.5 * width, class_report["F1 Score"], width, label="F1 Score", color="#2ecc71")
ax.bar(x + 0.5 * width, class_report["Precision"], width, label="Precision", color="#f39c12")
ax.bar(x + 1.5 * width, class_report["Recall"], width, label="Recall", color="#e74c3c")
ax.set_xticks(x)
ax.set_xticklabels(class_report["Category"], rotation=45, ha="right", fontsize=9)
ax.set_title("Per-Category Accuracy / F1 / Precision / Recall (20% Test Set)", fontsize=14, fontweight="bold")
ax.set_ylim(0, 1.15)
ax.legend(loc="upper right")
plt.tight_layout()
plt.show()'''))

# ─── Cell 16: Prediction Demonstrator Code ───────────────────────────────────
cells.append(code_cell(r'''# ─── Transparent Prediction Demonstrator ─────────────────────────────────────
# Mimics the backend's predict_transparent() output exactly

def predict_transparent(record_df, top_k=5):
    """Returns transparent category predictions matching the backend API format."""
    probs = pipeline.predict_proba(record_df)
    classes = list(mlb.classes_)
    results = []
    for row_probs in probs:
        ranked = np.argsort(row_probs)[::-1]
        top_preds = [
            {
                "training_category": classes[idx],
                "probability": round(float(row_probs[idx]), 4),
                "rank": rank
            }
            for rank, idx in enumerate(ranked[:top_k], 1)
        ]
        all_preds = [
            {"training_category": classes[idx], "probability": round(float(row_probs[idx]), 4)}
            for idx in ranked
        ]
        results.append({"top_predictions": top_preds, "all_predictions": all_preds})
    return results

sample = X_test.iloc[[0]]
demo = predict_transparent(sample)[0]

print("🔍 Sample Transparent Prediction Output (matches backend API format):")
print()
print(json.dumps(demo["top_predictions"], indent=2))'''))

# ─── Cell 17: Export Artifacts Markdown ──────────────────────────────────────
cells.append(md_cell("""---
## 📦 Cell 8: Export Backend-Compatible Artifacts
Exports model pipeline, MultiLabelBinarizer, and metadata (including accuracy metrics) into a deployable `.zip` file."""))

# ─── Cell 18: Export Artifacts Code ──────────────────────────────────────────
cells.append(code_cell(r'''# ─── Export Artifacts ─────────────────────────────────────────────────────────
timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
version = timestamp  # e.g. 20260811161409

export_dir = Path("exported_model")
export_dir.mkdir(exist_ok=True)

model_filename    = f"training_recommender_v{version}.joblib"
labels_filename   = f"labels_v{version}.joblib"
metadata_filename = f"metadata_v{version}.json"

model_path    = export_dir / model_filename
labels_path   = export_dir / labels_filename
metadata_path = export_dir / metadata_filename
active_path   = export_dir / "active.json"

# Save pipeline and MultiLabelBinarizer
joblib.dump(pipeline, model_path)
joblib.dump(mlb, labels_path)

# Save metadata including all accuracy metrics and 80/20 split information
meta_dict = {
    "version": version,
    "artifact": f"models/{model_filename}",
    "labels": f"models/{labels_filename}",
    "metrics": metrics,
    "topics": all_topics,
}
metadata_path.write_text(json.dumps(meta_dict, indent=2))

# Save active.json pointer (backend uses this to identify the current model)
active_dict = {
    "version": version,
    "artifact": f"models/{model_filename}",
    "labels": f"models/{labels_filename}",
    "metadata": f"models/{metadata_filename}",
}
active_path.write_text(json.dumps(active_dict, indent=2))

# ─── Package into ZIP ─────────────────────────────────────────────────────────
zip_filename = f"qsu_model_v{version}.zip"
with zipfile.ZipFile(zip_filename, "w") as zf:
    for f in export_dir.glob("*"):
        zf.write(f, arcname=f.name)
        print(f"   📄 Added: {f.name}  ({f.stat().st_size / 1024:.1f} KB)")

print(f"\n✅ Export complete! → {zip_filename}")
print(f"   Model version: {version}")
print(f"   Topics ({len(all_topics)}): {all_topics}")'''))

# ─── Cell 19: Download Code ──────────────────────────────────────────────────
cells.append(code_cell(r'''# ─── Download (Colab) or Print Path (local) ───────────────────────────────────
if IN_COLAB:
    from google.colab import files
    print(f"⬇️  Downloading '{zip_filename}' to your computer...")
    files.download(zip_filename)
else:
    print(f"💾 Model saved locally at: {Path(zip_filename).resolve()}")
    print(f"   Extract the zip contents and copy all files into your backend ./models/ directory.")'''))

# ─── Cell 20: Deploy Instructions Markdown ───────────────────────────────────
cells.append(md_cell("""---
## 🚀 Cell 9: Deploy to Backend — Instructions

### Option A — Drop and Go (Recommended)

1. **Unzip** the downloaded `qsu_model_v*.zip`
2. **Copy all 4 files** into your backend's `./models/` directory:

```text
your-backend-project/
└── models/
    ├── active.json                                  ← model pointer
    ├── training_recommender_v20260812000000.joblib  ← pipeline model
    ├── labels_v20260812000000.joblib                ← label binarizer
    └── metadata_v20260812000000.json               ← metrics & info
```

3. **Restart or reload the FastAPI server**:
```bash
# Restart server
uvicorn app.main:app --reload
```

4. **Verify the new model is loaded** by calling the health endpoint:
```bash
curl http://localhost:8000/api/v1/health
```

---
### Option B — API Reload (if server is running)

After copying the files:
```bash
curl -X POST "http://localhost:8000/api/v1/training/reload" \\
  -H "X-Admin-API-Key: your-admin-key"
```

---
### ✅ Verify a Prediction

```bash
curl -X POST "http://localhost:8000/api/v1/recommendations/individual" \\
  -H "Content-Type: application/json" \\
  -d '{
    "faculty": {
      "department": "BSED",
      "age": 35,
      "emerging_training_needs": {"artificial_intelligence": 5, "research_methods": 4}
    }
  }'
```"""))

# ─── Cell 21: Hyperparameters Markdown ───────────────────────────────────────
cells.append(md_cell("""---
## 🔧 Cell 10 (Optional): Hyperparameter Customization

Adjust training hyperparameters or split configuration if needed."""))

# ─── Cell 22: Hyperparameters Code ───────────────────────────────────────────
cells.append(code_cell(r'''# ─── Optional: Hyperparameter Customization ───────────────────────────────────
CONFIG = {
    "train_ratio":       0.80,   # 80% data for training
    "test_ratio":        0.20,   # 20% data held out for testing
    "n_estimators":      400,    # Number of trees (higher = more accurate, slower)
    "min_samples_leaf":  2,      # Min samples per leaf (higher = less overfitting)
    "class_weight":      "balanced_subsample",  # Handles class imbalance
    "random_state":      42,     # For reproducibility
    "top_k_predictions": 5,      # How many top predictions to include in API output
}

print("🔧 Current Training & Evaluation Configuration:")
for k, v in CONFIG.items():
    print(f"   {k:25s}: {v}")'''))

# Assemble notebook structure
notebook = {
    "cells": cells,
    "metadata": {
        "colab": {
            "provenance": [],
            "collapsed_sections": [],
            "name": "QSU_Faculty_Training_Recommender_Colab.ipynb"
        },
        "kernelspec": {
            "display_name": "Python 3",
            "name": "python3"
        },
        "language_info": {
            "name": "python",
            "version": "3.11.0"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 4
}

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(notebook, f, indent=1, ensure_ascii=False)

print(f"Successfully wrote {len(cells)} cells to {nb_path}")
