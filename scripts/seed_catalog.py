"""
Dedicated CLI Seed Script for QSU Training Catalog
Populates the MySQL database table 'training_catalogs' and generates 'data/raw/training_catalog.json'
aligned with the 17 canonical training needs topics and questionnaire schemas.
"""
import json
import sys
from pathlib import Path
from sqlalchemy.orm import Session

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from app.db.session import engine, SessionLocal
from app.db.models import Base, TrainingCatalog

# 17 Canonical Training Programs Aligned with the Survey Instrument
CATALOG_ITEMS = [
    {
        "training_id": "T001",
        "title": "Applied Artificial Intelligence and Prompt Engineering in Higher Education",
        "category": "Artificial Intelligence",
        "categories": ["Artificial Intelligence", "Emerging Training Needs"],
        "description": "Comprehensive workshop on leveraging modern generative AI tools, prompt engineering methodologies, and ethical AI integration in college curriculum delivery and academic productivity.",
        "target_competencies": ["Computer Literacy and Digital Technologies", "Innovative Instructional Material Development"],
        "modalities": ["Webinar", "Blended Learning", "Face-to-Face Seminar"],
        "durations": ["Two days", "Three days", "One day"],
        "schedules": ["Saturdays", "Semester break", "Anytime"],
        "status": "active"
    },
    {
        "training_id": "T002",
        "title": "Machine Learning Foundations and Predictive Modeling for Academic Research",
        "category": "Machine Learning",
        "categories": ["Machine Learning", "Emerging Training Needs"],
        "description": "Hands-on training introducing core machine learning algorithms, model training, evaluation metrics, and supervised/unsupervised learning techniques for faculty scientific investigation.",
        "target_competencies": ["Research Competency", "Computer Literacy and Digital Technologies"],
        "modalities": ["Blended Learning", "Face-to-Face Seminar", "Webinar"],
        "durations": ["Three days", "Two days", "One week"],
        "schedules": ["Semester break", "Summer", "Saturdays"],
        "status": "active"
    },
    {
        "training_id": "T003",
        "title": "Data Analytics, Visualization, and Institutional Decision Support",
        "category": "Data Analytics",
        "categories": ["Data Analytics", "Emerging Training Needs"],
        "description": "Practical training on data wrangling, exploratory data analysis, dashboard creation, and data-driven insights for program evaluation and faculty scholarly research.",
        "target_competencies": ["Computer Literacy and Digital Technologies", "Research Competency", "Critical Thinking and Problem Solving"],
        "modalities": ["Webinar", "Blended Learning", "Face-to-Face Seminar"],
        "durations": ["Two days", "Three days", "One day"],
        "schedules": ["Saturdays", "Fridays", "Semester break"],
        "status": "active"
    },
    {
        "training_id": "T004",
        "title": "Cybersecurity Awareness, Data Privacy (R.A. 10173), and Secure Digital Practices",
        "category": "Cybersecurity",
        "categories": ["Cybersecurity", "Emerging Training Needs"],
        "description": "Essential training on Philippine Data Privacy Act compliance, credential security, phishing defense, safe web practices, and institutional cyber hygiene for faculty and staff.",
        "target_competencies": ["Professionalism", "Computer Literacy and Digital Technologies"],
        "modalities": ["Webinar", "Face-to-Face Seminar"],
        "durations": ["One day", "Half day", "Two days"],
        "schedules": ["Fridays", "Saturdays", "Anytime"],
        "status": "active"
    },
    {
        "training_id": "T005",
        "title": "Cloud Computing Architectures and Collaborative Cloud Platforms",
        "category": "Cloud Computing",
        "categories": ["Cloud Computing", "Emerging Training Needs"],
        "description": "Exploration of cloud services, collaborative document management, cloud storage security, and scalable cloud tools for academic instruction and research archives.",
        "target_competencies": ["Computer Literacy and Digital Technologies"],
        "modalities": ["Webinar", "Blended Learning"],
        "durations": ["Two days", "One day"],
        "schedules": ["Saturdays", "Semester break", "Anytime"],
        "status": "active"
    },
    {
        "training_id": "T006",
        "title": "Learning Management Systems (LMS) Administration, Course Design, and Optimization",
        "category": "Learning Management Systems",
        "categories": ["Learning Management Systems", "Emerging Training Needs"],
        "description": "Mastering course setup, grading rubrics, automated assessments, and student progress tracking using platforms such as Moodle, Canvas, and Google Classroom.",
        "target_competencies": ["Effective Teaching and Classroom Management", "Computer Literacy and Digital Technologies"],
        "modalities": ["Blended Learning", "Webinar", "Face-to-Face Seminar"],
        "durations": ["Two days", "Three days", "One day"],
        "schedules": ["Semester break", "Summer", "Saturdays"],
        "status": "active"
    },
    {
        "training_id": "T007",
        "title": "Educational Technology Tools, Digital Pedagogy, and Multimedia Instruction",
        "category": "Educational Technology",
        "categories": ["Educational Technology", "Emerging Training Needs"],
        "description": "Integrating multimedia authoring, interactive polling, video lectures, and gamification to elevate student engagement in both virtual and blended college classrooms.",
        "target_competencies": ["Innovative Instructional Material Development", "Effective Teaching and Classroom Management"],
        "modalities": ["Blended Learning", "Webinar", "Face-to-Face Seminar"],
        "durations": ["Two days", "Three days", "One day"],
        "schedules": ["Saturdays", "Anytime", "Semester break"],
        "status": "active"
    },
    {
        "training_id": "T008",
        "title": "Statistical Software Mastery (SPSS, R, Python) for Quantitative Investigation",
        "category": "Statistical Software",
        "categories": ["Statistical Software", "Emerging Training Needs"],
        "description": "Hands-on parametric and non-parametric data processing, hypothesis testing, ANOVA, multivariate regression, and statistical reporting for faculty research.",
        "target_competencies": ["Research Competency", "Critical Thinking and Problem Solving"],
        "modalities": ["Face-to-Face Seminar", "Blended Learning", "Webinar"],
        "durations": ["Three days", "Two days", "One week"],
        "schedules": ["Semester break", "Summer", "Saturdays"],
        "status": "active"
    },
    {
        "training_id": "T009",
        "title": "Advanced Research Methods: Quantitative, Qualitative, and Mixed-Method Design",
        "category": "Research Methods",
        "categories": ["Research Methods", "Emerging Training Needs"],
        "description": "Methodological rigor in problem formulation, sampling techniques, survey validation, grounded theory, thematic coding, and mixed-method triangulation.",
        "target_competencies": ["Research Competency", "Critical Thinking and Problem Solving"],
        "modalities": ["Face-to-Face Seminar", "Blended Learning", "Webinar"],
        "durations": ["Three days", "Two days", "One week"],
        "schedules": ["Summer", "Semester break", "Saturdays"],
        "status": "active"
    },
    {
        "training_id": "T010",
        "title": "Effective Teaching Strategies, Pedagogy, and Classroom Management Excellence",
        "category": "Effective Teaching and Classroom Management",
        "categories": ["Effective Teaching and Classroom Management", "Functional Competency"],
        "description": "Modern pedagogical frameworks, active learning techniques, differentiated instruction, student engagement, and constructive classroom management in HEIs.",
        "target_competencies": ["Effective Teaching and Classroom Management", "Delivering Service Excellence"],
        "modalities": ["Face-to-Face Seminar", "Blended Learning", "Mentoring"],
        "durations": ["Two days", "Three days", "One day"],
        "schedules": ["Semester break", "Summer", "Fridays"],
        "status": "active"
    },
    {
        "training_id": "T011",
        "title": "Innovative Instructional Material Development, Syllabus Design, and Module Writing",
        "category": "Innovative Instructional Material Development",
        "categories": ["Innovative Instructional Material Development", "Functional Competency"],
        "description": "Workshop on authoring peer-reviewed course modules, interactive lab manuals, digital workbooks, and instructional learning kits compliant with CHED standards.",
        "target_competencies": ["Innovative Instructional Material Development", "Effective Teaching and Classroom Management"],
        "modalities": ["Face-to-Face Seminar", "Blended Learning", "Coaching"],
        "durations": ["Three days", "Two days", "One week"],
        "schedules": ["Semester break", "Summer", "Saturdays"],
        "status": "active"
    },
    {
        "training_id": "T012",
        "title": "Outcomes-Based Education (OBE): Curriculum Mapping, Assessment, and CQI",
        "category": "Outcomes-Based Education",
        "categories": ["Outcomes-Based Education", "Functional Competency"],
        "description": "Formulating Program Educational Objectives (PEO), Program Outcomes (PO), Course Learning Outcomes (CLO), and authentic rubric-based assessment alignment.",
        "target_competencies": ["Outcomes-Based Education", "Delivering Service Excellence"],
        "modalities": ["Face-to-Face Seminar", "Blended Learning", "Webinar"],
        "durations": ["Two days", "Three days", "One day"],
        "schedules": ["Semester break", "Summer", "Anytime"],
        "status": "active"
    },
    {
        "training_id": "T013",
        "title": "Research Publication Writing, Peer Review, and Scopus/WoS Indexing",
        "category": "Research and Publication Writing",
        "categories": ["Research and Publication Writing", "Functional Competency"],
        "description": "Drafting high-impact manuscript sections, selecting reputable indexed journals, responding to peer review comments, and academic grant proposal writing.",
        "target_competencies": ["Publication Writing", "Research Competency"],
        "modalities": ["Face-to-Face Seminar", "Blended Learning", "Mentoring"],
        "durations": ["Three days", "Two days", "One week"],
        "schedules": ["Summer", "Semester break", "Saturdays"],
        "status": "active"
    },
    {
        "training_id": "T014",
        "title": "Quality Assurance Management, SUC Leveling, and AACCUP Accreditation Preparation",
        "category": "Quality Assurance Management",
        "categories": ["Quality Assurance Management", "Functional Competency"],
        "description": "Comprehensive training on institutional quality assurance, Area instrument compliance, document exhibits preparation, and SUC leveling standards.",
        "target_competencies": ["Quality Assurance Management", "Delivering Service Excellence"],
        "modalities": ["Face-to-Face Seminar", "Benchmarking", "Blended Learning"],
        "durations": ["Two days", "Three days", "One day"],
        "schedules": ["Semester break", "Fridays", "Anytime"],
        "status": "active"
    },
    {
        "training_id": "T015",
        "title": "Academic Leadership, Strategic Thinking, and Higher Education Governance",
        "category": "Leadership and Strategic Management",
        "categories": ["Leadership and Strategic Management", "Leadership Competencies"],
        "description": "Developing strategic development plans, fostering change leadership, collaborative consensus building, and performance management for academic unit chairs.",
        "target_competencies": ["Strategic Thinking", "Leading Change", "Managing Performance"],
        "modalities": ["Face-to-Face Seminar", "Benchmarking", "Coaching"],
        "durations": ["Two days", "Three days", "One day"],
        "schedules": ["Semester break", "Summer", "Fridays"],
        "status": "active"
    },
    {
        "training_id": "T016",
        "title": "Critical Thinking, Problem Solving, and Analytical Decision-Making for Faculty",
        "category": "Critical Thinking and Problem Solving",
        "categories": ["Critical Thinking and Problem Solving", "Functional Competency"],
        "description": "Techniques for fostering analytical inquiry, structured problem-solving frameworks, cognitive bias mitigation, and complex academic conflict resolution.",
        "target_competencies": ["Critical Thinking and Problem Solving", "Consultancy and Advising"],
        "modalities": ["Face-to-Face Seminar", "Webinar", "Blended Learning"],
        "durations": ["One day", "Two days", "Half day"],
        "schedules": ["Saturdays", "Fridays", "Anytime"],
        "status": "active"
    },
    {
        "training_id": "T017",
        "title": "Technology Transfer, Innovation Commercialization, and Intellectual Property Rights",
        "category": "Technology Transfer and Innovation",
        "categories": ["Technology Transfer and Innovation", "Functional Competency"],
        "description": "Navigating patent applications, utility models, copyright protection, industry-academe linkages, and technology licensing for university research outputs.",
        "target_competencies": ["Technology Transfer and Innovation", "Research Competency"],
        "modalities": ["Face-to-Face Seminar", "Webinar", "Benchmarking"],
        "durations": ["Two days", "Three days", "One day"],
        "schedules": ["Semester break", "Saturdays", "Fridays"],
        "status": "active"
    }
]


def seed_training_catalog(db: Session) -> int:
    """Seeds the training catalog items into the database and syncs the JSON file."""
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    inserted_count = 0
    updated_count = 0

    for item in CATALOG_ITEMS:
        tid = item["training_id"]
        existing = db.query(TrainingCatalog).filter(TrainingCatalog.training_id == tid).first()

        cat_list = item.get("categories", [item.get("category", "")])
        target_comp = item.get("target_competencies", [])
        modalities = item.get("modalities", [])
        durations = item.get("durations", [])
        schedules = item.get("schedules", [])

        if existing:
            existing.title = item["title"]
            existing.description = item.get("description", "")
            existing.categories_json = json.dumps(cat_list)
            existing.target_competencies_json = json.dumps(target_comp)
            existing.modalities_json = json.dumps(modalities)
            existing.durations_json = json.dumps(durations)
            existing.schedules_json = json.dumps(schedules)
            existing.status = item.get("status", "active")
            updated_count += 1
        else:
            db.add(TrainingCatalog(
                training_id=tid,
                title=item["title"],
                description=item.get("description", ""),
                categories_json=json.dumps(cat_list),
                target_competencies_json=json.dumps(target_comp),
                modalities_json=json.dumps(modalities),
                durations_json=json.dumps(durations),
                schedules_json=json.dumps(schedules),
                status=item.get("status", "active"),
            ))
            inserted_count += 1

    db.commit()

    # Also synchronize data/raw/training_catalog.json for file-based fallback
    json_path = ROOT_DIR / "data" / "raw" / "training_catalog.json"
    json_path.parent.mkdir(parents=True, exist_ok=True)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(CATALOG_ITEMS, f, indent=2, ensure_ascii=False)

    print(f"Catalog JSON synced at: {json_path}")
    print(f"Catalog DB Seed Complete: {inserted_count} added, {updated_count} updated (Total: {len(CATALOG_ITEMS)}).")
    return len(CATALOG_ITEMS)


if __name__ == "__main__":
    print("=" * 60)
    print("Seeding QSU Training Catalog...")
    print("=" * 60)
    db = SessionLocal()
    try:
        count = seed_training_catalog(db)
        print("=" * 60)
        print(f"Successfully seeded {count} canonical training catalog programs!")
        print("=" * 60)
    finally:
        db.close()
