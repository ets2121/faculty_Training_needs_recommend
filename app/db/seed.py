"""
Database Seed logic for initializing system roles, permissions, departments, default admin, and catalog.
"""
import json
from pathlib import Path
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.models import Department, Permission, Role, RolePermission, TrainingCatalog, User


def seed_database(db: Session) -> None:
    """Populate default system reference data, default admin, and training catalog."""
    
    # 1. Seed Roles
    roles_data = [
        ("faculty", "Normal faculty user"),
        ("department_admin", "Department administrator"),
        ("system_admin", "System-wide administrator"),
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
        ("catalog:read", "View training catalog items"),
        ("catalog:write", "Add or update training catalog items"),
        ("model:train", "Train and deploy machine learning models"),
        ("users:manage", "Manage system users and access rights"),
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

    # 4. Seed Departments
    departments_data = [
        ("BSIT", "Bachelor of Science in Information Technology"),
        ("BSED", "Bachelor of Secondary Education"),
        ("BSCE", "Bachelor of Science in Civil Engineering"),
        ("BEED", "Bachelor of Elementary Education"),
        ("BSBA", "Bachelor of Science in Business Administration"),
        ("BSCS", "Bachelor of Science in Computer Science"),
        ("BAELS", "Bachelor of Arts in English Language Studies"),
        ("BSMATH", "Bachelor of Science in Mathematics"),
        ("BSHM", "Bachelor of Science in Hospitality Management"),
        ("BSMidwifery", "Bachelor of Science in Midwifery"),
    ]
    for code, name in departments_data:
        dept = db.query(Department).filter(Department.code == code).first()
        if not dept:
            db.add(Department(code=code, name=name, status="active"))

    # 5. Seed Default System Admin User
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

    # 6. Seed Training Catalog from training_catalog.json
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
