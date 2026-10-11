import sys
import pandas as pd
import collections

sys.stdout.reconfigure(encoding="utf-8")

real  = pd.read_csv("data/raw/faculty_training.csv")
dummy = pd.read_csv("data/raw/faculty_training_dummy_backup.csv")

col_match = list(dummy.columns) == list(real.columns)
dtype_mismatches = sum(1 for c in dummy.columns if c in real.columns and dummy[c].dtype != real[c].dtype)

print("=== FINAL VALIDATION REPORT ===")
print(f"  Column count  -> Dummy: {len(dummy.columns)}  Real: {len(real.columns)}  MATCH={col_match}")
print(f"  Row count     -> Dummy: {len(dummy)}  Real: {len(real)}")
print(f"  Dtype mismatches: {dtype_mismatches}")

canonical = {
    "Artificial Intelligence", "Machine Learning", "Data Analytics", "Cybersecurity",
    "Cloud Computing", "Learning Management Systems", "Educational Technology",
    "Statistical Software", "Research Methods",
    "Effective Teaching and Classroom Management",
    "Innovative Instructional Material Development", "Outcomes-Based Education",
    "Research and Publication Writing", "Quality Assurance Management",
    "Leadership and Strategic Management", "Critical Thinking and Problem Solving",
    "Technology Transfer and Innovation",
}

print()
print("=== PRIORITY COLUMNS FORMAT ===")
print(f"  Canonical topics: {len(canonical)}")
for p in ["priority_1", "priority_2", "priority_3", "priority_4", "priority_5"]:
    real_vals = set(real[p].dropna().unique())
    outside = real_vals - canonical
    null_count = real[p].isna().sum()
    ok = "OK" if not outside and null_count == 0 else "WARN"
    outside_str = str(outside) if outside else "none"
    print(f"  [{ok}] {p}: dtype={real[p].dtype}  nulls={null_count}  outside_canonical={outside_str}")

print()
print("=== SAMPLE PRIORITY ROWS (first 10) ===")
cols = ["faculty_id", "department", "priority_1", "priority_2", "priority_3", "priority_4", "priority_5"]
print(real[cols].head(10).to_string(index=False))

print()
print("=== PRIORITY TOPIC DISTRIBUTION (all 5 ranks combined) ===")
counter = collections.Counter()
for p in ["priority_1", "priority_2", "priority_3", "priority_4", "priority_5"]:
    counter.update(real[p].dropna().tolist())
for topic, count in sorted(counter.items(), key=lambda x: -x[1]):
    bar = "#" * (count // 4)
    print(f"  {count:4d}  {bar:<35s}  {topic}")

print()
print("=== FORMAT MATCH vs DUMMY (sample cols) ===")
check_cols = [
    "faculty_id", "department", "age", "sex", "employment_status",
    "years_teaching", "trainings_last_3_years",
    "delivering_service_excellence_proficiency",
    "delivering_service_excellence_importance",
    "delivering_service_excellence_gap",
    "artificial_intelligence_need",
    "modality_webinar", "schedule_anytime", "duration_three_days",
    "barrier_heavy_teaching_workload",
    "priority_1", "priority_2",
]
for col in check_cols:
    dd = dummy[col].dtype
    rd = real[col].dtype
    match = "OK" if dd == rd else "DTYPE MISMATCH"
    print(f"  [{match}] {col:<52s}  dummy_dtype={dd}  real_dtype={rd}")
