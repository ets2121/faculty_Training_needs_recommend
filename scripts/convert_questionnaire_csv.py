import sys, re, collections
import numpy as np
import pandas as pd
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

RAW = Path("data/raw/Raws Datas.xlsx")
OUT = Path("data/raw/faculty_training.csv")
REF = pd.read_csv(OUT)

CANONICAL = [
    "Artificial Intelligence", "Machine Learning", "Data Analytics", "Cybersecurity",
    "Cloud Computing", "Learning Management Systems", "Educational Technology",
    "Statistical Software", "Research Methods",
    "Effective Teaching and Classroom Management",
    "Innovative Instructional Material Development", "Outcomes-Based Education",
    "Research and Publication Writing", "Quality Assurance Management",
    "Leadership and Strategic Management", "Critical Thinking and Problem Solving",
    "Technology Transfer and Innovation",
]

PATTERNS = [
    ("Machine Learning",           [r"\bmachine learning\b", r"\bdeep learning\b"]),
    ("Artificial Intelligence",    [r"\bartificial intelligence\b", r"\bai\b", r"\bai[-\s]"]),
    ("Statistical Software",       [r"\bstatistic", r"\bspss\b", r"\bnvivo\b", r"\bgis\b"]),
    ("Data Analytics",             [r"\bdata analy", r"\banalytics\b"]),
    ("Cybersecurity",              [r"\bcyber", r"\bforensic science\b"]),
    ("Cloud Computing",            [r"\bcloud\b"]),
    ("Learning Management Systems",[r"\blearning management\b", r"\blms\b", r"\blns\b"]),
    ("Outcomes-Based Education",   [r"\boutcomes?[-\s]*based\b", r"\bobe\b", r"\boobe\b", r"\boutcone"]),
    ("Research and Publication Writing", [r"\bpublication\b", r"\bgrant writing\b", r"\bacademic writ", r"\bwriting books\b"]),
    ("Research Methods",           [r"\bresearch method", r"\bmethodology\b", r"\bmixed method\b", r"\bresearch\b", r"\breseach\b"]),
    ("Innovative Instructional Material Development", [r"\binstructional material", r"\bmodule\b", r"\bims\b", r"\bsyllabus\b"]),
    ("Effective Teaching and Classroom Management",   [r"\bclassroom management\b", r"\bteaching method", r"\bpedagog", r"\binstruction\b", r"\bassessment\b", r"\bcurriculum\b"]),
    ("Quality Assurance Management",   [r"\bquality assurance\b", r"\baccreditation\b"]),
    ("Leadership and Strategic Management",   [r"\bleadership\b", r"\bstrategic\b", r"\bmentorship\b", r"\bmanagement\b"]),
    ("Technology Transfer and Innovation",    [r"\btechnology transfer\b", r"\butility model\b", r"\binnovation\b", r"\bproduct development\b"]),
    ("Critical Thinking and Problem Solving", [r"\bcritical thinking\b", r"\bproblem solving\b", r"\bdecision making\b"]),
    ("Educational Technology",     [r"\beducational technology\b", r"\bedtech\b", r"\bict\b", r"\bdigital tool", r"\bdigitiz", r"\btechnology\b"]),
]


def parse_topics(text):
    if not isinstance(text, str) or not text.strip():
        return []
    found = []
    segs = re.split(r"[,;\n/]+", text)
    for seg in segs:
        s = seg.strip().lower()
        if not s:
            continue
        for topic, pats in PATTERNS:
            if topic in found:
                continue
            if any(re.search(p, s) for p in pats):
                found.append(topic)
                break
    full = text.lower()
    for topic, pats in PATTERNS:
        if topic not in found:
            if any(re.search(p, full) for p in pats):
                found.append(topic)
    return found


def norm_years(v):
    s = str(v).lower() if pd.notna(v) else ""
    if "below 5" in s or "less" in s:
        return "Below 5 years"
    if "16" in s:
        return "16-20 years"
    if "11" in s:
        return "11-15 years"
    if "5" in s and "10" in s:
        return "5-10 years"
    if "more than 20" in s or ("20" in s and "more" in s):
        return "More than 20 years"
    return "5-10 years"


def norm_train_count(v):
    if pd.isna(v):
        return "1-2"
    s = str(v).lower()
    if "more than 5" in s:
        return "More than 5"
    if "3" in s:
        return "3-5"
    return "1-2"


def safe_int(v, default=3, lo=1, hi=5):
    try:
        r = int(float(v))
        return max(lo, min(hi, r))
    except Exception:
        return default


print("Reading Excel...")
df_raw = pd.read_excel(RAW, header=None)
data = df_raw.iloc[3:].reset_index(drop=True)
print(f"Respondent rows: {len(data)}")

rows = []
for i, r in data.iterrows():
    rec = {}
    rec["faculty_id"] = f"QSU-{i + 1:04d}"
    rec["department"] = str(r[1]).strip() if pd.notna(r[1]) else "General"
    rec["age"] = safe_int(r[3], 35, 18, 90)

    sex = str(r[4]).strip().capitalize() if pd.notna(r[4]) else "Female"
    rec["sex"] = sex if sex in ("Female", "Male") else "Female"

    rec["employment_status"] = str(r[5]).strip() if pd.notna(r[5]) else "Permanent"
    rec["academic_rank"] = str(r[6]).strip() if pd.notna(r[6]) else "Instructor I"
    rec["highest_educational_attainment"] = str(r[7]).strip() if pd.notna(r[7]) else "Master's Degree"
    rec["field_of_specialization"] = str(r[8]).strip() if pd.notna(r[8]) else "General"
    rec["years_teaching"] = norm_years(r[9])
    rec["administrative_designation"] = str(r[10]).strip() if (pd.notna(r[10]) and str(r[10]).strip()) else np.nan
    rec["trainings_last_3_years"] = norm_train_count(r[11])

    at = str(r[12]).lower() if pd.notna(r[12]) else ""
    rec["trained_instruction"] = int("instruction" in at)
    rec["trained_research"] = int("research" in at or "reseach" in at)
    rec["trained_extension"] = int("extension" in at)
    rec["trained_quality_assurance"] = int("quality" in at)
    rec["trained_information_technology"] = int("information technolog" in at or "ict" in at)
    rec["trained_leadership"] = int("leadership" in at or "ledearship" in at)
    rec["trained_outcomes_based_education"] = int("outcome" in at or "obe" in at)

    comp_map = [
        ("delivering_service_excellence",                 13, 17),
        ("interpersonal_relationship",                    14, 18),
        ("professionalism",                               15, 19),
        ("achievement_orientation",                       16, 20),
        ("consultancy_advising",                          21, 31),
        ("critical_thinking_problem_solving",             22, 32),
        ("effective_teaching_classroom_management",       23, 33),
        ("innovative_instructional_material_development", 24, 34),
        ("computer_literacy_digital_technologies",        25, 35),
        ("research_competency",                           26, 36),
        ("publication_writing",                           27, 37),
        ("quality_assurance_management",                  28, 38),
        ("technology_transfer_innovation",                29, 39),
        ("outcomes_based_education",                      30, 40),
        ("strategic_thinking",                            41, 46),
        ("leading_change",                                42, 47),
        ("building_collaborative_relationships",          43, 48),
        ("coaching_mentoring",                            44, 49),
        ("managing_performance",                          45, 50),
    ]
    comp_gaps = {}
    for name, pc, ic in comp_map:
        p = safe_int(r[pc])
        iv = safe_int(r[ic])
        g = max(0, iv - p)
        rec[f"{name}_proficiency"] = p
        rec[f"{name}_importance"] = iv
        rec[f"{name}_gap"] = g
        comp_gaps[name] = g

    em_map = [
        ("artificial_intelligence", 51), ("machine_learning", 52), ("data_analytics", 53),
        ("cybersecurity", 54), ("cloud_computing", 55), ("learning_management_systems", 56),
        ("educational_technology", 57), ("statistical_software", 58), ("research_methods", 59),
    ]
    em_scores = {}
    for name, col in em_map:
        v = safe_int(r[col])
        rec[f"{name}_need"] = v
        em_scores[name] = v

    mt = str(r[60]).lower() if pd.notna(r[60]) else ""
    rec["modality_face_to_face_seminar"] = int("face" in mt)
    rec["modality_webinar"] = int("webinar" in mt)
    rec["modality_blended_learning"] = int("blended" in mt)
    rec["modality_coaching"] = int("coach" in mt)
    rec["modality_mentoring"] = int("mentor" in mt)
    rec["modality_benchmarking"] = int("benchmarking" in mt or "bechmarking" in mt)
    rec["modality_project_immersion"] = int("immersion" in mt)
    rec["modality_formal_schooling"] = int("formal" in mt)
    rec["modality_self_paced_online_course"] = int("self" in mt and ("paced" in mt or "online" in mt or "placed" in mt))

    sc = str(r[61]).lower() if pd.notna(r[61]) else ""
    rec["schedule_semester break"] = int("semester" in sc)
    rec["schedule_summer"] = int("summer" in sc)
    rec["schedule_saturdays"] = int("saturday" in sc)
    rec["schedule_fridays"] = int("friday" in sc)
    rec["schedule_anytime"] = int("anytime" in sc)

    dc = str(r[62]).lower() if pd.notna(r[62]) else ""
    rec["duration_half_day"] = int("half" in dc)
    rec["duration_one_day"] = int("one day" in dc)
    rec["duration_two_days"] = int("two day" in dc)
    rec["duration_three_days"] = int("three day" in dc)
    rec["duration_one_week"] = int("week" in dc)

    bar_map = [
        ("heavy_teaching_workload", 63), ("administrative_responsibilities", 64),
        ("lack_of_budget", 65), ("time_constraints", 66),
        ("travel_distance", 67), ("family_responsibilities", 68), ("internet_connectivity", 69),
    ]
    for name, col in bar_map:
        rec[f"barrier_{name}"] = safe_int(r[col])

    pt = str(r[70]) if pd.notna(r[70]) else ""
    topics = parse_topics(pt)

    em_topic_map = {
        "artificial_intelligence": "Artificial Intelligence",
        "machine_learning": "Machine Learning",
        "data_analytics": "Data Analytics",
        "cybersecurity": "Cybersecurity",
        "cloud_computing": "Cloud Computing",
        "learning_management_systems": "Learning Management Systems",
        "educational_technology": "Educational Technology",
        "statistical_software": "Statistical Software",
        "research_methods": "Research Methods",
    }
    for k, _ in sorted(em_scores.items(), key=lambda x: -x[1]):
        if len(topics) >= 5:
            break
        t = em_topic_map[k]
        if t not in topics:
            topics.append(t)

    comp_topic_map = {
        "computer_literacy_digital_technologies": "Educational Technology",
        "research_competency": "Research Methods",
        "publication_writing": "Research and Publication Writing",
        "effective_teaching_classroom_management": "Effective Teaching and Classroom Management",
        "innovative_instructional_material_development": "Innovative Instructional Material Development",
        "outcomes_based_education": "Outcomes-Based Education",
        "quality_assurance_management": "Quality Assurance Management",
        "technology_transfer_innovation": "Technology Transfer and Innovation",
        "critical_thinking_problem_solving": "Critical Thinking and Problem Solving",
        "strategic_thinking": "Leadership and Strategic Management",
    }
    for k, _ in sorted(comp_gaps.items(), key=lambda x: -x[1]):
        if len(topics) >= 5:
            break
        t = comp_topic_map.get(k)
        if t and t not in topics:
            topics.append(t)

    for t in CANONICAL:
        if len(topics) >= 5:
            break
        if t not in topics:
            topics.append(t)

    rec["priority_1"] = topics[0]
    rec["priority_2"] = topics[1]
    rec["priority_3"] = topics[2]
    rec["priority_4"] = topics[3]
    rec["priority_5"] = topics[4]

    rows.append(rec)

df_out = pd.DataFrame(rows)

ref_cols = list(REF.columns)
missing = [c for c in ref_cols if c not in df_out.columns]
extra = [c for c in df_out.columns if c not in ref_cols]
if missing:
    print(f"MISSING cols: {missing}")
if extra:
    print(f"EXTRA cols: {extra}")

df_out = df_out[ref_cols]

backup = Path("data/raw/faculty_training_dummy_backup.csv")
if not backup.exists():
    REF.to_csv(backup, index=False)
    print(f"Dummy backup saved -> {backup}")

df_out.to_csv(OUT, index=False)
print(f"Written: {OUT}  ->  {df_out.shape[0]} rows x {df_out.shape[1]} cols")

print("\nPriority topic distribution (all 5 ranks combined):")
counter = collections.Counter()
for i in range(1, 6):
    counter.update(df_out[f"priority_{i}"].tolist())
for t, c in sorted(counter.items(), key=lambda x: -x[1]):
    print(f"  {c:4d}  {t}")
