"""
Database Seed logic for initializing system roles, permissions, campuses, departments, default admins, and catalog.
"""
import json
from pathlib import Path
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.models import (
    Campus, CampusAdmin, Department, DepartmentAdmin, Faculty,
    Permission, QuestionnairePart, Role, RolePermission,
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

    # Pre-defined questionnaire part payloads for testing
    part_payloads = {
        1: {
            "department": "BSIT",
            "age": 35,
            "sex": "Female",
            "employment_status": "Permanent",
        },
        2: {
            "highest_educational_attainment": "Master's Degree",
            "field_of_specialization": "Computer Science",
        },
        3: {
            "academic_rank": "Assistant Professor",
            "years_teaching": "5-10 years",
            "administrative_designation": "None",
            "trainings_last_3_years": "3-5",
        },
        4: {
            "training_areas": ["Instruction", "Research", "Technology Integration"],
            "training_modalities_attended": ["Webinar", "Face-to-Face"],
        },
        5: {
            "competency": {
                "research_competency": {"proficiency": 2, "importance": 5},
                "computer_literacy_digital_technologies": {"proficiency": 3, "importance": 5},
                "outcomes_based_education": {"proficiency": 2, "importance": 4},
                "student_development": {"proficiency": 3, "importance": 4},
            }
        },
        6: {
            "emerging_training_needs": {
                "artificial_intelligence": 5,
                "machine_learning": 4,
                "data_analytics": 4,
                "educational_technology": 5,
                "research_methods": 4,
            }
        },
        7: {
            "preferred_learning_modality": ["Webinar", "Blended Learning"],
            "preferred_schedule": ["Saturdays"],
            "preferred_duration": ["Two days"],
        },
        8: {
            "barriers": {
                "heavy_teaching_workload": 4,
                "time_constraints": 3,
                "lack_of_budget": 2,
            }
        },
    }

    demo_recommendation_result = {
        "status": "success",
        "model": {"status": "ready", "version": "20260812055414"},
        "prediction": {
            "top_predictions": [
                {"rank": 1, "training_category": "Artificial Intelligence", "probability": 0.87},
                {"rank": 2, "training_category": "Educational Technology", "probability": 0.82},
                {"rank": 3, "training_category": "Research Methods", "probability": 0.74},
            ],
            "all_predictions": [
                {"training_category": "Artificial Intelligence", "probability": 0.87},
                {"training_category": "Educational Technology", "probability": 0.82},
                {"training_category": "Research Methods", "probability": 0.74},
            ]
        },
        "recommendations": [
            {
                "training_id": "TRN-001",
                "title": "AI in Higher Education: Tools and Applications",
                "category": "Artificial Intelligence",
                "match_score": 0.92,
                "reason": "Matches predicted Artificial Intelligence need. Aligns with preferred modality (Webinar).",
                "description": "An introductory workshop on integrating generative AI tools into higher ed instruction."
            },
            {
                "training_id": "TRN-002",
                "title": "Educational Technology Integration & LMS Optimization",
                "category": "Educational Technology",
                "match_score": 0.85,
                "reason": "Matches predicted Educational Technology need.",
                "description": "Practical guide to designing interactive online courses using modern LMS platforms."
            }
        ]
    }

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

            fac = Faculty(
                user_id=user.id,
                department_id=dept_obj.id,
                faculty_code=fac_code,
                academic_rank="Assistant Professor" if "santos" in username or "reyes" in username else "Instructor I",
                highest_degree="Master's Degree",
                specialization="Computer Science" if d_code == "BSIT" else "Education" if d_code == "BSED" else "Business",
                questionnaire_status=target_status,
                status="active",
            )
            if target_status == "has_recommendation":
                fac.last_recommendation_json = json.dumps(demo_recommendation_result)
                from datetime import datetime, timezone
                fac.last_recommendation_at = datetime.now(timezone.utc)

            db.add(fac)
            db.flush()

            # Create questionnaire parts based on status level
            parts_to_add = []
            if target_status in ("has_recommendation", "eligible"):
                parts_to_add = range(1, 9) if target_status == "has_recommendation" else [1, 2, 3, 5, 6]
            elif target_status == "in_progress":
                parts_to_add = [1, 2]

            for p_num in parts_to_add:
                payload = dict(part_payloads[p_num])
                if p_num == 1:
                    payload["department"] = d_code
                db.add(QuestionnairePart(
                    faculty_id=fac.id,
                    part_number=p_num,
                    is_complete=True,
                    data_json=json.dumps(payload),
                ))

            if target_status == "has_recommendation":
                db.add(TrainingRecommendationRequest(
                    faculty_id=fac.id,
                    requested_by_user_id=user.id,
                    recommendation_type="individual",
                    model_version="20260812055414",
                    recommendation_json=json.dumps(demo_recommendation_result),
                ))

    # 10. Seed Training Catalog from training_catalog.json
    json_path = Path("./data/raw/training_catalog.json")
    if json_path.exists():
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                items = json.load(f)
            for item in items:
                tid = item.get("training_id")
                if not tid:
                    continue
                existing = db.query(TrainingCatalog).filter(TrainingCatalog.training_id == tid).first()
                if not existing:
                    db.add(TrainingCatalog(
                        training_id=tid,
                        title=item.get("title", ""),
                        description=item.get("description", ""),
                        categories_json=json.dumps(item.get("categories", [])),
                        target_competencies_json=json.dumps(item.get("target_competencies", [])),
                        modalities_json=json.dumps(item.get("modalities", [])),
                        durations_json=json.dumps(item.get("durations", [])),
                        schedules_json=json.dumps(item.get("schedules", [])),
                        status=item.get("status", "active"),
                    ))
        except Exception as e:
            print(f"Warning seeding catalog: {e}")

    db.commit()
    print("Database seeding completed successfully.")