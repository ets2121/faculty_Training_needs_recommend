# Data Dictionary: QSU Faculty Training Needs Dataset (`faculty_training.csv`)

This document outlines the schema, column definitions, data types, and value distributions for the canonical dataset `data/raw/faculty_training.csv` (166 rows × 115 columns), which matches the machine learning training pipeline schema.

---

## 1. Overview & Dataset Summary

- **Target File**: `data/raw/faculty_training.csv`
- **Total Rows**: 166 (Real faculty survey respondents from Quirino State University)
- **Total Columns**: 115 columns
- **Structure**: Grouped according to the 8 parts of the Training Needs Assessment (TNA) Instrument.
- **Competency Gap Formula**:
  $$\text{Gap} = \max(0, \text{Importance} - \text{Proficiency})$$

---

## 2. Part I: Faculty Demographics & Profile (Columns 0–10)

| Column Index | Column Name | Data Type | Null Count | Valid / Example Values | Description |
|---|---|---|---|---|---|
| `[0]` | `faculty_id` | `object` | 0 | `QSU-0001` to `QSU-0166` | Unique anonymized faculty identifier. |
| `[1]` | `department` | `object` | 0 | `BTLED`, `BSA`, `BSHM`, `BSCS`, `BSIT`, `BEED`, `BSBA`, `BSCE`, `BSCrim`, `BSOA`, `BSTM`, `General` | Academic program or department assignment. |
| `[2]` | `age` | `int64` | 0 | `20` to `61` | Age of respondent in years. |
| `[3]` | `sex` | `object` | 0 | `'Female'`, `'Male'` | Biological sex. |
| `[4]` | `employment_status` | `object` | 0 | `'Permanent'`, `'Contract of Service'`, `'Part-time'` | Employment appointment status. |
| `[5]` | `academic_rank` | `object` | 0 | `Instructor I-III`, `Assistant Professor I-IV`, `Associate Professor I-V`, `Professor I-IV` | Formal CHED/SUC academic rank. |
| `[6]` | `highest_educational_attainment` | `object` | 0 | `Bachelor's Degree`, `Master's Degree`, `Master's Degree (On-going)`, `Doctorate Degree` | Highest academic degree completed or pursued. |
| `[7]` | `field_of_specialization` | `object` | 0 | e.g. `Educational Management`, `Information Technology`, `Animal Science`, `Agribusiness` | Area of primary academic expertise. |
| `[8]` | `years_teaching` | `object` | 0 | `'Below 5 years'`, `'5-10 years'`, `'11-15 years'`, `'16-20 years'`, `'More than 20 years'` | Total teaching tenure experience category. |
| `[9]` | `administrative_designation` | `object` | 135 | Text string (e.g., `'College Secretary'`, `'Program Chairperson'`) or `NaN` | Concurrent administrative office designation. |
| `[10]` | `trainings_last_3_years` | `object` | 0 | `'1-2'`, `'3-5'`, `'More than 5'` | Number of training programs attended in the past 3 years. |

---

## 3. Part II: Prior Training Participation Areas (Columns 11–17)

Binary indicator variables ($1 = \text{Attended}$, $0 = \text{Did not attend}$) representing past training domains attended over the last 3 years:

| Column Index | Column Name | Data Type | Values | Description |
|---|---|---|---|---|
| `[11]` | `trained_instruction` | `int64` | `0`, `1` | Attended trainings related to Instruction / Pedagogy |
| `[12]` | `trained_research` | `int64` | `0`, `1` | Attended trainings in Research / Research Methodology |
| `[13]` | `trained_extension` | `int64` | `0`, `1` | Attended trainings in Extension & Community Services |
| `[14]` | `trained_quality_assurance` | `int64` | `0`, `1` | Attended trainings in QA / Accreditation |
| `[15]` | `trained_information_technology` | `int64` | `0`, `1` | Attended trainings in IT / EdTech / ICT |
| `[16]` | `trained_leadership` | `int64` | `0`, `1` | Attended trainings in Leadership & Supervisory Management |
| `[17]` | `trained_outcomes_based_education` | `int64` | `0`, `1` | Attended trainings in Outcomes-Based Education (OBE) |

---

## 4. Part III: Core, Functional & Leadership Competencies (Columns 18–74)

Each competency domain includes three metrics evaluated on a 5-point Likert scale (1 = Lowest, 5 = Highest):
- **Proficiency**: Current self-rated capability level (1–5)
- **Importance**: Perceived importance to faculty duties (1–5)
- **Gap**: Calculated competency deficiency ($\max(0, \text{Importance} - \text{Proficiency})$, range: 0–4)

### A. Core Competencies (Columns 18–29)
| Competency Domain | Proficiency Column | Importance Column | Gap Column | Values Scale |
|---|---|---|---|---|
| Delivering Service Excellence | `delivering_service_excellence_proficiency` `[18]` | `delivering_service_excellence_importance` `[19]` | `delivering_service_excellence_gap` `[20]` | 1–5 (Gap: 0–3) |
| Interpersonal Relationship | `interpersonal_relationship_proficiency` `[21]` | `interpersonal_relationship_importance` `[22]` | `interpersonal_relationship_gap` `[23]` | 1–5 (Gap: 0–2) |
| Professionalism | `professionalism_proficiency` `[24]` | `professionalism_importance` `[25]` | `professionalism_gap` `[26]` | 1–5 (Gap: 0–4) |
| Achievement Orientation | `achievement_orientation_proficiency` `[27]` | `achievement_orientation_importance` `[28]` | `achievement_orientation_gap` `[29]` | 1–5 (Gap: 0–4) |

### B. Functional Competencies (Columns 30–59)
| Competency Domain | Proficiency Column | Importance Column | Gap Column | Values Scale |
|---|---|---|---|---|
| Consultancy & Advising | `consultancy_advising_proficiency` `[30]` | `consultancy_advising_importance` `[31]` | `consultancy_advising_gap` `[32]` | 1–5 (Gap: 0–3) |
| Critical Thinking & Problem Solving | `critical_thinking_problem_solving_proficiency` `[33]` | `critical_thinking_problem_solving_importance` `[34]` | `critical_thinking_problem_solving_gap` `[35]` | 1–5 (Gap: 0–3) |
| Effective Teaching & Classroom Management | `effective_teaching_classroom_management_proficiency` `[36]` | `effective_teaching_classroom_management_importance` `[37]` | `effective_teaching_classroom_management_gap` `[38]` | 1–5 (Gap: 0–3) |
| Innovative Instructional Material Development | `innovative_instructional_material_development_proficiency` `[39]` | `innovative_instructional_material_development_importance` `[40]` | `innovative_instructional_material_development_gap` `[41]` | 1–5 (Gap: 0–3) |
| Computer Literacy & Digital Technologies | `computer_literacy_digital_technologies_proficiency` `[42]` | `computer_literacy_digital_technologies_importance` `[43]` | `computer_literacy_digital_technologies_gap` `[44]` | 1–5 (Gap: 0–3) |
| Research Competency | `research_competency_proficiency` `[45]` | `research_competency_importance` `[46]` | `research_competency_gap` `[47]` | 1–5 (Gap: 0–4) |
| Publication Writing | `publication_writing_proficiency` `[48]` | `publication_writing_importance` `[49]` | `publication_writing_gap` `[50]` | 1–5 (Gap: 0–4) |
| Quality Assurance Management | `quality_assurance_management_proficiency` `[51]` | `quality_assurance_management_importance` `[52]` | `quality_assurance_management_gap` `[53]` | 1–5 (Gap: 0–4) |
| Technology Transfer & Innovation | `technology_transfer_innovation_proficiency` `[54]` | `technology_transfer_innovation_importance` `[55]` | `technology_transfer_innovation_gap` `[56]` | 1–5 (Gap: 0–4) |
| Outcomes-Based Education | `outcomes_based_education_proficiency` `[57]` | `outcomes_based_education_importance` `[58]` | `outcomes_based_education_gap` `[59]` | 1–5 (Gap: 0–3) |

### C. Leadership Competencies (Columns 60–74)
| Competency Domain | Proficiency Column | Importance Column | Gap Column | Values Scale |
|---|---|---|---|---|
| Strategic Thinking | `strategic_thinking_proficiency` `[60]` | `strategic_thinking_importance` `[61]` | `strategic_thinking_gap` `[62]` | 1–5 (Gap: 0–4) |
| Leading Change | `leading_change_proficiency` `[63]` | `leading_change_importance` `[64]` | `leading_change_gap` `[65]` | 1–5 (Gap: 0–3) |
| Building Collaborative Relationships | `building_collaborative_relationships_proficiency` `[66]` | `building_collaborative_relationships_importance` `[67]` | `building_collaborative_relationships_gap` `[68]` | 1–5 (Gap: 0–3) |
| Coaching & Mentoring | `coaching_mentoring_proficiency` `[69]` | `coaching_mentoring_importance` `[70]` | `coaching_mentoring_gap` `[71]` | 1–5 (Gap: 0–3) |
| Managing Performance | `managing_performance_proficiency` `[72]` | `managing_performance_importance` `[73]` | `managing_performance_gap` `[74]` | 1–5 (Gap: 0–3) |

---

## 5. Part IV: Emerging Skills & Technologies Need (Columns 75–83)

Assessed need rating on a 5-point Likert scale (1 = Not Needed, 5 = Urgently Needed):

| Column Index | Column Name | Data Type | Range | Description |
|---|---|---|---|---|
| `[75]` | `artificial_intelligence_need` | `int64` | `1`–`5` | Need for Generative AI, AI prompt engineering, AI applications |
| `[76]` | `machine_learning_need` | `int64` | `2`–`5` | Need for ML algorithms, predictive modeling |
| `[77]` | `data_analytics_need` | `int64` | `2`–`5` | Need for data visualization, dashboarding, business analytics |
| `[78]` | `cybersecurity_need` | `int64` | `1`–`5` | Need for data privacy, network protection, secure coding |
| `[79]` | `cloud_computing_need` | `int64` | `1`–`5` | Need for cloud hosting, storage, SaaS/PaaS platforms |
| `[80]` | `learning_management_systems_need`| `int64` | `1`–`5` | Need for LMS management (e.g., Moodle, Canvas, Google Classroom) |
| `[81]` | `educational_technology_need` | `int64` | `1`–`5` | Need for multimedia learning tools, digital classrooms |
| `[82]` | `statistical_software_need` | `int64` | `1`–`5` | Need for tools like SPSS, R, Python, NVivo, GIS |
| `[83]` | `research_methods_need` | `int64` | `1`–`5` | Need for quantitative, qualitative, and mixed methods research |

---

## 6. Part V & VI: Preferred Modality, Schedule & Duration (Columns 84–102)

Binary one-hot encoded indicator variables ($1 = \text{Preferred}, 0 = \text{Not Preferred}$):

### Preferred Learning Modality (Columns 84–92)
| Column Index | Column Name | Data Type | Values | Description |
|---|---|---|---|---|
| `[84]` | `modality_face_to_face_seminar` | `int64` | `0`, `1` | On-site, in-person workshops or conferences |
| `[85]` | `modality_webinar` | `int64` | `0`, `1` | Online synchronous webinars or virtual seminars |
| `[86]` | `modality_blended_learning` | `int64` | `0`, `1` | Hybrid mix of in-person sessions and online activities |
| `[87]` | `modality_coaching` | `int64` | `0`, `1` | 1-on-1 practical coaching sessions |
| `[88]` | `modality_mentoring` | `int64` | `0`, `1` | Long-term peer or senior faculty mentorship |
| `[89]` | `modality_benchmarking` | `int64` | `0`, `1` | Institutional visits to best-practice HEIs |
| `[90]` | `modality_project_immersion` | `int64` | `0`, `1` | Industry immersion or project-based training |
| `[91]` | `modality_formal_schooling` | `int64` | `0`, `1` | Graduate studies (Masters/Doctorate programs) |
| `[92]` | `modality_self_paced_online_course` | `int64` | `0`, `1` | Asynchronous self-paced modules (e.g., Coursera) |

### Preferred Schedule (Columns 93–97)
| Column Index | Column Name | Data Type | Values | Description |
|---|---|---|---|---|
| `[93]` | `schedule_semester break` | `int64` | `0`, `1` | During semestral academic breaks |
| `[94]` | `schedule_summer` | `int64` | `0`, `1` | During midyear / summer break |
| `[95]` | `schedule_saturdays` | `int64` | `0`, `1` | Weekend classes (Saturdays) |
| `[96]` | `schedule_fridays` | `int64` | `0`, `1` | End-of-week sessions (Fridays) |
| `[97]` | `schedule_anytime` | `int64` | `0`, `1` | Flexible schedule anytime |

### Preferred Duration (Columns 98–102)
| Column Index | Column Name | Data Type | Values | Description |
|---|---|---|---|---|
| `[98]` | `duration_half_day` | `int64` | `0`, `1` | Half-day sessions (3–4 hours) |
| `[99]` | `duration_one_day` | `int64` | `0`, `1` | 1-day workshop (8 hours) |
| `[100]` | `duration_two_days` | `int64` | `0`, `1` | 2-day seminar |
| `[101]` | `duration_three_days` | `int64` | `0`, `1` | 3-day training program |
| `[102]` | `duration_one_week` | `int64` | `0`, `1` | 1-week intensive boot camp |

---

## 7. Part VII: Institutional & Personal Barriers (Columns 103–109)

Assessed constraint level on a 5-point Likert scale (1 = Not a Barrier, 5 = Severe Barrier):

| Column Index | Column Name | Data Type | Range | Description |
|---|---|---|---|---|
| `[103]` | `barrier_heavy_teaching_workload` | `int64` | `1`–`5` | Teaching unit load constraints |
| `[104]` | `barrier_administrative_responsibilities` | `int64` | `1`–`5` | Committee or administrative designations |
| `[105]` | `barrier_lack_of_budget` | `int64` | `1`–`5` | Institutional or personal funding limitations |
| `[106]` | `barrier_time_constraints` | `int64` | `1`–`5` | Conflict in schedules or tight deadlines |
| `[107]` | `barrier_travel_distance` | `int64` | `1`–`5` | Distance from training venues |
| `[108]` | `barrier_family_responsibilities` | `int64` | `1`–`5` | Domestic or family obligations |
| `[109]` | `barrier_internet_connectivity` | `int64` | `1`–`5` | Unstable internet connection during online sessions |

---

## 8. Part VIII: Target Recommendations / Training Priorities (Columns 110–114)

These 5 columns represent the multi-output ground-truth target ranking for each faculty member.

| Column Index | Column Name | Data Type | Null Count | Description |
|---|---|---|---|---|
| `[110]` | `priority_1` | `object` | 0 | Top 1 primary recommended training topic |
| `[111]` | `priority_2` | `object` | 0 | Top 2 recommended training topic |
| `[112]` | `priority_3` | `object` | 0 | Top 3 recommended training topic |
| `[113]` | `priority_4` | `object` | 0 | Top 4 recommended training topic |
| `[114]` | `priority_5` | `object` | 0 | Top 5 recommended training topic |

### The 17 Canonical Training Topics

All values in `priority_1` through `priority_5` belong exclusively to these 17 canonical topics:

1. **Artificial Intelligence**
2. **Machine Learning**
3. **Data Analytics**
4. **Cybersecurity**
5. **Cloud Computing**
6. **Learning Management Systems**
7. **Educational Technology**
8. **Statistical Software**
9. **Research Methods**
10. **Effective Teaching and Classroom Management**
11. **Innovative Instructional Material Development**
12. **Outcomes-Based Education**
13. **Research and Publication Writing**
14. **Quality Assurance Management**
15. **Leadership and Strategic Management**
16. **Critical Thinking and Problem Solving**
17. **Technology Transfer and Innovation**

### Topic Frequency in Real Data (Aggregated Across Top 5 Priorities)

| Rank | Canonical Topic | Total Frequency Count (out of $166 \times 5 = 830$) |
|---|---|---|
| 1 | Artificial Intelligence | 127 |
| 2 | Data Analytics | 117 |
| 3 | Machine Learning | 107 |
| 4 | Cybersecurity | 96 |
| 5 | Research Methods | 81 |
| 6 | Cloud Computing | 74 |
| 7 | Educational Technology | 49 |
| 8 | Learning Management Systems | 48 |
| 9 | Statistical Software | 35 |
| 10 | Effective Teaching and Classroom Management | 23 |
| 11 | Leadership and Strategic Management | 22 |
| 12 | Research and Publication Writing | 18 |
| 13 | Innovative Instructional Material Development | 12 |
| 14 | Outcomes-Based Education | 10 |
| 15 | Quality Assurance Management | 5 |
| 16 | Technology Transfer and Innovation | 4 |
| 17 | Critical Thinking and Problem Solving | 2 |
