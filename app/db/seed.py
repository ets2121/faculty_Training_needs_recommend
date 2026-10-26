"""
Database Seed logic for initializing system roles, permissions, campuses, departments, default admins, and catalog.
"""
import json
from pathlib import Path
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.models import (
    Campus, CampusAdmin, Department, DepartmentAdmin, Faculty,
    Permission, QuestionnairePart, RecommendationHistory, Role, RolePermission,
    TrainingCatalog, TrainingRecommendationRequest, User,
)


def seed_database(db: Session) -> None:
    """Populate default system reference data, campuses, departments, default admins, and training catalog."""
    
    # 1. Seed Roles
    roles_data = [
        ("faculty", "Faculty Member"),
        ("department_admin", "Department Administrator"),
        ("campus_admin", "Campus Administrator"),
        ("system_admin", "System-wide Administrator"),
    ]
    roles_map = {}
    for name, desc in roles_data:
        role = db.query(Role).filter(Role.name == name).first()
        if not role:
            role = Role(name=name, description=desc)
            db.add(role)
            db.flush()
        roles_map[name] = role

    # 2. Seed Permissions
    permissions_data = [
        ("predict:individual", "Generate individual training recommendations"),
        ("predict:department", "Generate department-level training recommendations"),
        ("predict:campus", "Generate campus-level aggregated recommendations"),
        ("catalog:read", "View training catalog items"),
        ("catalog:write", "Add or update training catalog items"),
        ("model:train", "Train and deploy machine learning models"),
        ("users:manage", "Manage system users and access rights"),
        ("campus:manage", "Manage campus departments and department admins"),
        ("faculty:transfer", "Transfer faculty between departments or campuses"),
        ("audit:read", "View system audit logs"),
    ]
    perm_map = {}
    for code, desc in permissions_data:
        perm = db.query(Permission).filter(Permission.code == code).first()
        if not perm:
            perm = Permission(code=code, description=desc)
            db.add(perm)
            db.flush()
        perm_map[code] = perm

    # 3. Seed Role-Permissions
    role_perms = {
        "faculty": ["predict:individual", "catalog:read"],
        "department_admin": ["predict:individual", "predict:department", "catalog:read", "users:manage"],
        "campus_admin": ["predict:individual", "predict:department", "predict:campus", "catalog:read", "users:manage", "campus:manage", "faculty:transfer"],
        "system_admin": [code for code, _ in permissions_data],
    }

    for role_name, perm_codes in role_perms.items():
        role = roles_map[role_name]
        for p_code in perm_codes:
            perm = perm_map[p_code]
            rp = db.query(RolePermission).filter(
                RolePermission.role_id == role.id,
                RolePermission.permission_id == perm.id
            ).first()
            if not rp:
                db.add(RolePermission(role_id=role.id, permission_id=perm.id))

    # 4. Seed Campuses (Diffun, Maddela, Cabarroguis)
    campuses_data = [
        ("DIFFUN", "Diffun Campus (Main)", "Main University Campus located in Diffun, Quirino"),
        ("MADDELA", "Maddela Campus", "Satellite Campus located in Maddela, Quirino"),
        ("CABARROGUIS", "Cabarroguis Campus", "Satellite Campus located in Cabarroguis, Quirino"),
    ]
    campuses_map = {}
    for code, name, desc in campuses_data:
        campus = db.query(Campus).filter(Campus.code == code).first()
        if not campus:
            campus = Campus(code=code, name=name, description=desc, status="active")
            db.add(campus)
            db.flush()
        campuses_map[code] = campus

    # 5. Seed Departments per Campus
    # Notice: Each campus can have its own BSIT, BSED, etc. with campus isolation
    departments_data = [
        # Diffun Campus Departments
        ("DIFFUN", "BSIT", "Bachelor of Science in Information Technology"),
        ("DIFFUN", "BSED", "Bachelor of Secondary Education"),
        ("DIFFUN", "BSCE", "Bachelor of Science in Civil Engineering"),
        ("DIFFUN", "BEED", "Bachelor of Elementary Education"),
        ("DIFFUN", "BSBA", "Bachelor of Science in Business Administration"),
        ("DIFFUN", "BSHM", "Bachelor of Science in Hospitality Management"),
        
        # Maddela Campus Departments
        ("MADDELA", "BSIT", "Bachelor of Science in Information Technology"),
        ("MADDELA", "BSBA", "Bachelor of Science in Business Administration"),
        ("MADDELA", "BSED", "Bachelor of Secondary Education"),
        ("MADDELA", "BEED", "Bachelor of Elementary Education"),

        # Cabarroguis Campus Departments
        ("CABARROGUIS", "BSIT", "Bachelor of Science in Information Technology"),
        ("CABARROGUIS", "BSHM", "Bachelor of Science in Hospitality Management"),
        ("CABARROGUIS", "BSED", "Bachelor of Secondary Education"),
        ("CABARROGUIS", "BSMidwifery", "Bachelor of Science in Midwifery"),
    ]
    
    depts_lookup = {}  # (campus_code, dept_code) -> Department
    for c_code, d_code, name in departments_data:
        campus = campuses_map[c_code]
        dept = db.query(Department).filter(
            Department.campus_id == campus.id,
            Department.code == d_code,
        ).first()
        if not dept:
            dept = Department(
                campus_id=campus.id,
                code=d_code,
                name=name,
                status="active"
            )
            db.add(dept)
            db.flush()
        depts_lookup[(c_code, d_code)] = dept

    # 6. Seed Default System Admin User
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_role = roles_map["system_admin"]
        admin_user = User(
            username="admin",
            email="admin@qsu.edu.ph",
            hashed_password=hash_password("admin123"),
            full_name="System Administrator",
            role_id=admin_role.id,
            status="active",
        )
        db.add(admin_user)
        db.flush()

    # 7. Seed Campus Admin Accounts
    campus_admin_role = roles_map["campus_admin"]
    campus_admins_data = [
        ("admin_diffun", "diffun.admin@qsu.edu.ph", "Diffun Campus Admin", "DIFFUN", "diffun123"),
        ("admin_maddela", "maddela.admin@qsu.edu.ph", "Maddela Campus Admin", "MADDELA", "maddela123"),
        ("admin_cabarroguis", "cabarroguis.admin@qsu.edu.ph", "Cabarroguis Campus Admin", "CABARROGUIS", "cabarroguis123"),
    ]

    for username, email, full_name, c_code, pwd in campus_admins_data:
        existing = db.query(User).filter(User.username == username).first()
        if not existing and c_code in campuses_map:
            u = User(
                username=username,
                email=email,
                hashed_password=hash_password(pwd),
                full_name=full_name,
                role_id=campus_admin_role.id,
                status="active",
            )
            db.add(u)
            db.flush()
            db.add(CampusAdmin(
                user_id=u.id,
                campus_id=campuses_map[c_code].id,
                status="active",
            ))

    # 8. Seed Department Admin Accounts
    dept_admin_role = roles_map["department_admin"]
    dept_admins_data = [
        ("dept_bsit", "dept_bsit@qsu.edu.ph", "BSIT Dept Chair (Diffun)", "DIFFUN", "BSIT", "dept123"),
        ("dept_bsed", "dept_bsed@qsu.edu.ph", "BSED Dept Chair (Diffun)", "DIFFUN", "BSED", "dept123"),
        ("dept_bsit_maddela", "dept_bsit_maddela@qsu.edu.ph", "BSIT Dept Chair (Maddela)", "MADDELA", "BSIT", "dept123"),
        ("dept_bsit_cabarroguis", "dept_bsit_cab@qsu.edu.ph", "BSIT Dept Chair (Cabarroguis)", "CABARROGUIS", "BSIT", "dept123"),
    ]

    for username, email, full_name, c_code, d_code, pwd in dept_admins_data:
        existing = db.query(User).filter(User.username == username).first()
        dept_obj = depts_lookup.get((c_code, d_code))
        if not existing and dept_obj:
            u = User(
                username=username,
                email=email,
                hashed_password=hash_password(pwd),
                full_name=full_name,
                role_id=dept_admin_role.id,
                status="active",
            )
            db.add(u)
            db.flush()
            db.add(DepartmentAdmin(
                user_id=u.id,
                department_id=dept_obj.id,
                status="active",
            ))

    # 9. Seed Faculty Accounts with realistic Questionnaire Data & Statuses
    faculty_role = roles_map["faculty"]
    faculty_seed_data = [
        # (username, email, full_name, campus_code, dept_code, fac_code, target_status)
        ("prof_santos", "santos@qsu.edu.ph", "Maria Santos", "DIFFUN", "BSIT", "DIF-IT-001", "has_recommendation"),
        ("prof_reyes", "reyes@qsu.edu.ph", "Juan Reyes", "DIFFUN", "BSIT", "DIF-IT-002", "eligible"),
        ("prof_cruz", "cruz@qsu.edu.ph", "Ana Cruz", "DIFFUN", "BSIT", "DIF-IT-003", "in_progress"),
        ("prof_garcia", "garcia@qsu.edu.ph", "Mark Garcia", "DIFFUN", "BSIT", "DIF-IT-004", "not_started"),
        ("prof_torres", "torres@qsu.edu.ph", "Elena Torres", "DIFFUN", "BSED", "DIF-ED-001", "eligible"),
        ("prof_navarro", "navarro@qsu.edu.ph", "Carlos Navarro", "MADDELA", "BSIT", "MAD-IT-001", "eligible"),
        ("prof_aquino", "aquino@qsu.edu.ph", "Liza Aquino", "MADDELA", "BSBA", "MAD-BA-001", "has_recommendation"),
        ("prof_delacruz", "delacruz@qsu.edu.ph", "Ramon Dela Cruz", "CABARROGUIS", "BSIT", "CAB-IT-001", "eligible"),
        ("prof_mendoza", "mendoza@qsu.edu.ph", "Grace Mendoza", "CABARROGUIS", "BSHM", "CAB-HM-001", "not_started"),
    ]

    # Per-faculty distinct questionnaire payloads — each faculty has unique competency
    # ratings and emerging needs so the ML model produces meaningfully different outputs.
    faculty_payloads = {
        # --- prof_santos: IT/AI-focused, high AI & cybersecurity gaps, strong researcher ---
        "prof_santos": {
            1: {"department": "BSIT", "age": 38, "sex": "Female", "employment_status": "Permanent"},
            2: {"highest_educational_attainment": "Master's Degree", "field_of_specialization": "Computer Science"},
            3: {"academic_rank": "Assistant Professor", "years_teaching": "5-10 years",
                "administrative_designation": "None", "trainings_last_3_years": "3-5"},
            4: {"training_areas": ["Instruction", "Research", "Information Technology"],
                "training_modalities_attended": ["Webinar", "Self-Paced Online Course"]},
            5: {"competency": {
                "research_competency": {"proficiency": 3, "importance": 5},
                "computer_literacy_digital_technologies": {"proficiency": 4, "importance": 5},
                "outcomes_based_education": {"proficiency": 3, "importance": 4},
                "student_development": {"proficiency": 3, "importance": 3},
                "instructional_design": {"proficiency": 2, "importance": 4},
                "classroom_management": {"proficiency": 4, "importance": 3},
            }},
            6: {"emerging_training_needs": {
                "artificial_intelligence": 5,
                "machine_learning": 5,
                "data_analytics": 4,
                "cybersecurity": 4,
                "cloud_computing": 3,
                "educational_technology": 3,
                "research_methods": 2,
                "learning_management_systems": 2,
                "statistical_software": 2,
            }},
            7: {"preferred_learning_modality": ["Webinar", "Self-Paced Online Course"],
                "preferred_schedule": ["Saturdays", "Anytime"],
                "preferred_duration": ["Two days"]},
            8: {"barriers": {"heavy_teaching_workload": 4, "time_constraints": 3,
                             "internet_connectivity": 3, "lack_of_budget": 2}},
        },

        # --- prof_reyes: OBE/Pedagogy-focused, Education specialist, low tech proficiency ---
        "prof_reyes": {
            1: {"department": "BSIT", "age": 44, "sex": "Male", "employment_status": "Permanent"},
            2: {"highest_educational_attainment": "Master's Degree", "field_of_specialization": "Education"},
            3: {"academic_rank": "Associate Professor", "years_teaching": "11-20 years",
                "administrative_designation": "Program Chair", "trainings_last_3_years": "1-2"},
            4: {"training_areas": ["Instruction", "Outcomes-Based Education", "Quality Assurance"],
                "training_modalities_attended": ["Face-to-Face Seminar", "Blended Learning"]},
            5: {"competency": {
                "research_competency": {"proficiency": 3, "importance": 3},
                "computer_literacy_digital_technologies": {"proficiency": 2, "importance": 4},
                "outcomes_based_education": {"proficiency": 2, "importance": 5},
                "student_development": {"proficiency": 4, "importance": 5},
                "instructional_design": {"proficiency": 3, "importance": 5},
                "classroom_management": {"proficiency": 5, "importance": 4},
                "leadership_and_governance": {"proficiency": 3, "importance": 4},
            }},
            6: {"emerging_training_needs": {
                "artificial_intelligence": 2,
                "machine_learning": 2,
                "data_analytics": 2,
                "cybersecurity": 1,
                "educational_technology": 5,
                "learning_management_systems": 5,
                "research_methods": 3,
                "statistical_software": 3,
                "cloud_computing": 2,
            }},
            7: {"preferred_learning_modality": ["Face-to-Face Seminar", "Blended Learning"],
                "preferred_schedule": ["Semester Break", "Summer"],
                "preferred_duration": ["Three days"]},
            8: {"barriers": {"administrative_responsibilities": 5, "heavy_teaching_workload": 4,
                             "time_constraints": 4, "family_responsibilities": 2}},
        },

        # --- prof_cruz: in_progress — only parts 1 & 2 completed ---
        "prof_cruz": {
            1: {"department": "BSIT", "age": 29, "sex": "Female", "employment_status": "Contractual"},
            2: {"highest_educational_attainment": "Bachelor's Degree", "field_of_specialization": "Information Technology"},
        },

        # --- prof_garcia: not_started — no parts ---
        "prof_garcia": {},

        # --- prof_torres: BSED — Education specialist, research-focused, Leadership gaps ---
        "prof_torres": {
            1: {"department": "BSED", "age": 41, "sex": "Female", "employment_status": "Permanent"},
            2: {"highest_educational_attainment": "Master's Degree", "field_of_specialization": "Educational Management"},
            3: {"academic_rank": "Assistant Professor", "years_teaching": "5-10 years",
                "administrative_designation": "None", "trainings_last_3_years": "3-5"},
            4: {"training_areas": ["Instruction", "Outcomes-Based Education", "Extension"],
                "training_modalities_attended": ["Face-to-Face Seminar", "Blended Learning"]},
            5: {"competency": {
                "research_competency": {"proficiency": 2, "importance": 5},
                "computer_literacy_digital_technologies": {"proficiency": 2, "importance": 3},
                "outcomes_based_education": {"proficiency": 4, "importance": 5},
                "student_development": {"proficiency": 5, "importance": 5},
                "instructional_design": {"proficiency": 4, "importance": 4},
                "classroom_management": {"proficiency": 5, "importance": 4},
                "leadership_and_governance": {"proficiency": 2, "importance": 5},
                "community_extension_services": {"proficiency": 3, "importance": 5},
            }},
            6: {"emerging_training_needs": {
                "artificial_intelligence": 2,
                "machine_learning": 1,
                "data_analytics": 3,
                "cybersecurity": 1,
                "educational_technology": 4,
                "learning_management_systems": 4,
                "research_methods": 5,
                "statistical_software": 5,
                "cloud_computing": 2,
            }},
            7: {"preferred_learning_modality": ["Face-to-Face Seminar", "Coaching", "Mentoring"],
                "preferred_schedule": ["Semester Break", "Summer"],
                "preferred_duration": ["Three days", "One week"]},
            8: {"barriers": {"travel_distance": 4, "family_responsibilities": 3,
                             "heavy_teaching_workload": 3, "lack_of_budget": 3}},
        },

        # --- prof_navarro: Maddela BSIT — strong in tech, needs leadership & quality assurance ---
        "prof_navarro": {
            1: {"department": "BSIT", "age": 33, "sex": "Male", "employment_status": "Permanent"},
            2: {"highest_educational_attainment": "Master's Degree", "field_of_specialization": "Computer Science"},
            3: {"academic_rank": "Instructor I", "years_teaching": "1-4 years",
                "administrative_designation": "None", "trainings_last_3_years": "3-5"},
            4: {"training_areas": ["Information Technology", "Research", "Leadership"],
                "training_modalities_attended": ["Webinar", "Self-Paced Online Course"]},
            5: {"competency": {
                "research_competency": {"proficiency": 2, "importance": 4},
                "computer_literacy_digital_technologies": {"proficiency": 5, "importance": 5},
                "outcomes_based_education": {"proficiency": 3, "importance": 4},
                "student_development": {"proficiency": 3, "importance": 4},
                "instructional_design": {"proficiency": 2, "importance": 4},
                "leadership_and_governance": {"proficiency": 1, "importance": 5},
                "quality_assurance_and_accreditation": {"proficiency": 2, "importance": 5},
            }},
            6: {"emerging_training_needs": {
                "artificial_intelligence": 4,
                "machine_learning": 4,
                "data_analytics": 5,
                "cybersecurity": 5,
                "cloud_computing": 5,
                "educational_technology": 3,
                "research_methods": 3,
                "learning_management_systems": 3,
                "statistical_software": 3,
            }},
            7: {"preferred_learning_modality": ["Webinar", "Self-Paced Online Course", "Blended Learning"],
                "preferred_schedule": ["Saturdays", "Anytime"],
                "preferred_duration": ["Two days", "One day"]},
            8: {"barriers": {"internet_connectivity": 4, "travel_distance": 3,
                             "lack_of_budget": 3, "time_constraints": 2}},
        },

        # --- prof_aquino: Maddela BSBA — Business/Entrepreneurship, weak in research & IT ---
        "prof_aquino": {
            1: {"department": "BSBA", "age": 47, "sex": "Female", "employment_status": "Permanent"},
            2: {"highest_educational_attainment": "Master's Degree", "field_of_specialization": "Business Administration"},
            3: {"academic_rank": "Associate Professor", "years_teaching": "11-20 years",
                "administrative_designation": "Program Chair", "trainings_last_3_years": "1-2"},
            4: {"training_areas": ["Instruction", "Extension", "Quality Assurance"],
                "training_modalities_attended": ["Face-to-Face Seminar", "Benchmarking"]},
            5: {"competency": {
                "research_competency": {"proficiency": 2, "importance": 5},
                "computer_literacy_digital_technologies": {"proficiency": 2, "importance": 4},
                "outcomes_based_education": {"proficiency": 3, "importance": 4},
                "student_development": {"proficiency": 4, "importance": 4},
                "instructional_design": {"proficiency": 3, "importance": 3},
                "leadership_and_governance": {"proficiency": 4, "importance": 5},
                "quality_assurance_and_accreditation": {"proficiency": 2, "importance": 5},
                "community_extension_services": {"proficiency": 4, "importance": 5},
            }},
            6: {"emerging_training_needs": {
                "artificial_intelligence": 2,
                "machine_learning": 1,
                "data_analytics": 4,
                "cybersecurity": 2,
                "cloud_computing": 2,
                "educational_technology": 3,
                "learning_management_systems": 3,
                "research_methods": 5,
                "statistical_software": 4,
            }},
            7: {"preferred_learning_modality": ["Face-to-Face Seminar", "Benchmarking"],
                "preferred_schedule": ["Semester Break"],
                "preferred_duration": ["Three days", "One week"]},
            8: {"barriers": {"administrative_responsibilities": 5, "travel_distance": 4,
                             "family_responsibilities": 3, "lack_of_budget": 2}},
        },

        # --- prof_delacruz: Cabarroguis BSIT — junior, cybersecurity & cloud enthusiast ---
        "prof_delacruz": {
            1: {"department": "BSIT", "age": 27, "sex": "Male", "employment_status": "Contractual"},
            2: {"highest_educational_attainment": "Bachelor's Degree", "field_of_specialization": "Information Technology"},
            3: {"academic_rank": "Instructor I", "years_teaching": "1-4 years",
                "administrative_designation": "None", "trainings_last_3_years": "1-2"},
            4: {"training_areas": ["Information Technology", "Instruction"],
                "training_modalities_attended": ["Webinar", "Self-Paced Online Course"]},
            5: {"competency": {
                "research_competency": {"proficiency": 1, "importance": 4},
                "computer_literacy_digital_technologies": {"proficiency": 4, "importance": 5},
                "outcomes_based_education": {"proficiency": 2, "importance": 4},
                "student_development": {"proficiency": 2, "importance": 4},
                "instructional_design": {"proficiency": 1, "importance": 5},
                "classroom_management": {"proficiency": 3, "importance": 4},
            }},
            6: {"emerging_training_needs": {
                "artificial_intelligence": 3,
                "machine_learning": 3,
                "data_analytics": 3,
                "cybersecurity": 5,
                "cloud_computing": 5,
                "educational_technology": 4,
                "learning_management_systems": 4,
                "research_methods": 2,
                "statistical_software": 2,
            }},
            7: {"preferred_learning_modality": ["Webinar", "Self-Paced Online Course"],
                "preferred_schedule": ["Saturdays", "Anytime"],
                "preferred_duration": ["Half-day", "One day"]},
            8: {"barriers": {"internet_connectivity": 5, "travel_distance": 4,
                             "lack_of_budget": 4, "heavy_teaching_workload": 2}},
        },

        # --- prof_mendoza: not_started — no parts ---
        "prof_mendoza": {},
    }

    # 9. Seed Training Catalog from training_catalog.json first so recommendations can match real programs
    try:
        from scripts.seed_catalog import seed_training_catalog
        seed_training_catalog(db, force_reset=True)
    except Exception as e:
        print(f"Warning running seed_training_catalog: {e}")

    for username, email, full_name, c_code, d_code, fac_code, target_status in faculty_seed_data:
        user = db.query(User).filter(User.username == username).first()
        dept_obj = depts_lookup.get((c_code, d_code))
        if not user and dept_obj:
            user = User(
                username=username,
                email=email,
                hashed_password=hash_password("faculty123"),
                full_name=full_name,
                role_id=faculty_role.id,
                status="active",
            )
            db.add(user)
            db.flush()

            # Resolve this faculty's specific academic rank and specialization
            fac_payloads = faculty_payloads.get(username, {})
            p1 = fac_payloads.get(1, {})
            p2 = fac_payloads.get(2, {})
            p3 = fac_payloads.get(3, {})
            academic_rank = p3.get("academic_rank", "Instructor I")
            highest_degree = p2.get("highest_educational_attainment", "Bachelor's Degree")
            specialization = p2.get("field_of_specialization",
                "Computer Science" if d_code == "BSIT" else "Education" if d_code == "BSED" else "Business")

            fac = Faculty(
                user_id=user.id,
                department_id=dept_obj.id,
                faculty_code=fac_code,
                academic_rank=academic_rank,
                highest_degree=highest_degree,
                specialization=specialization,
                questionnaire_status=target_status,
                status="active",
            )
            db.add(fac)
            db.flush()

            # Determine which part numbers to seed based on status
            if target_status == "has_recommendation":
                parts_to_add = [p for p in range(1, 9) if p in fac_payloads]
            elif target_status == "eligible":
                parts_to_add = [p for p in [1, 2, 3, 5, 6] if p in fac_payloads]
            elif target_status == "in_progress":
                parts_to_add = [p for p in [1, 2] if p in fac_payloads]
            else:
                parts_to_add = []

            for p_num in parts_to_add:
                payload = dict(fac_payloads[p_num])
                db.add(QuestionnairePart(
                    faculty_id=fac.id,
                    part_number=p_num,
                    is_complete=True,
                    data_json=json.dumps(payload),
                ))

    # 10. Generate live model recommendations for 'has_recommendation' faculty & departments
    try:
        from app.ml.predictor import ModelService
        from app.core.config import get_settings
        from app.services.recommendation import individual, department as dept_recommendation
        from app.api.questionnaire import build_faculty_record
        from datetime import datetime
        import zoneinfo

        settings = get_settings()
        model = ModelService(settings.model_dir)
        model.ensure_active()
        manila_tz = zoneinfo.ZoneInfo("Asia/Manila")

        # Generate accurate live individual recommendations for seeded 'has_recommendation' faculty
        for username, _, _, _, _, _, target_status in faculty_seed_data:
            if target_status == "has_recommendation":
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    continue
                fac = db.query(Faculty).filter(Faculty.user_id == user.id).first()
                if not fac:
                    continue

                rec_record = build_faculty_record(fac.id, fac, db)
                now_str = datetime.now(manila_tz).isoformat()
                live_res = individual(model, rec_record, db=None, generated_at=now_str)

                fac.last_recommendation_json = json.dumps(live_res)
                fac.last_recommendation_at = datetime.fromisoformat(live_res["generated_at"]).replace(tzinfo=None)

                db.add(TrainingRecommendationRequest(
                    faculty_id=fac.id,
                    requested_by_user_id=user.id,
                    recommendation_type="individual",
                    model_version=live_res.get("model", {}).get("version"),
                    recommendation_json=json.dumps(live_res),
                ))

        # Also pre-generate initial department recommendations for key departments (BSIT, BSED)
        for dept_code_seed in ["BSIT", "BSED"]:
            dept_obj = db.query(Department).filter(Department.code == dept_code_seed).first()
            if dept_obj:
                dept_fac = db.query(Faculty).filter(
                    Faculty.department_id == dept_obj.id,
                    Faculty.questionnaire_status.in_(["eligible", "has_recommendation"])
                ).all()
                if dept_fac:
                    records = [build_faculty_record(f.id, f, db) for f in dept_fac]
                    now_str = datetime.now(manila_tz).isoformat()
                    dept_res = dept_recommendation(model, records, dept_name=dept_obj.code, db=None, generated_at=now_str)
                    dept_res["department_id"] = dept_obj.id
                    dept_res["department_name"] = dept_obj.name
                    dept_res["campus_id"] = dept_obj.campus_id
                    dept_res["campus_code"] = dept_obj.campus.code if dept_obj.campus else None
                    dept_res["campus_name"] = dept_obj.campus.name if dept_obj.campus else None
                    dept_res["total_faculty_in_dept"] = len(dept_fac)
                    dept_res["eligible_faculty_count"] = len(dept_fac)

                    db.add(RecommendationHistory(
                        campus_id=dept_obj.campus_id,
                        department_id=dept_obj.id,
                        recommendation_type="department",
                        model_version=dept_res.get("model", {}).get("version"),
                        response_json=json.dumps(dept_res),
                    ))

    except Exception as exc:
        print(f"Warning generating live seeded recommendations: {exc}")

    db.commit()
    print("Database seeding completed successfully.")