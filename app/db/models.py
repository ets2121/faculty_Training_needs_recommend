from datetime import datetime
from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, String, Text, func,
    UniqueConstraint, Index,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# ─── Roles & Permissions ──────────────────────────────────────────────────────

class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="role")
    permissions: Mapped[list["RolePermission"]] = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    roles: Mapped[list["RolePermission"]] = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    permission_id: Mapped[int] = mapped_column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),
    )

    role: Mapped["Role"] = relationship("Role", back_populates="permissions")
    permission: Mapped["Permission"] = relationship("Permission", back_populates="roles")


# ─── Campus ──────────────────────────────────────────────────────────────────

class Campus(Base):
    __tablename__ = "campuses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)  # e.g., "DIFFUN", "MADDELA", "CABARROGUIS"
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    departments: Mapped[list["Department"]] = relationship("Department", back_populates="campus", cascade="all, delete-orphan")
    campus_admins: Mapped[list["CampusAdmin"]] = relationship("CampusAdmin", back_populates="campus", cascade="all, delete-orphan")


# ─── Department ──────────────────────────────────────────────────────────────

class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_id: Mapped[int] = mapped_column(Integer, ForeignKey("campuses.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("campus_id", "code", name="uq_campus_dept_code"),
    )

    campus: Mapped["Campus"] = relationship("Campus", back_populates="departments")
    faculty_members: Mapped[list["Faculty"]] = relationship("Faculty", back_populates="department")
    department_admins: Mapped[list["DepartmentAdmin"]] = relationship("DepartmentAdmin", back_populates="department")


# ─── User (Unified Auth) ─────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    role: Mapped["Role"] = relationship("Role", back_populates="users")
    faculty_profile: Mapped["Faculty | None"] = relationship("Faculty", back_populates="user", uselist=False)
    campus_admin_profile: Mapped["CampusAdmin | None"] = relationship("CampusAdmin", back_populates="user", uselist=False)
    department_admin_profile: Mapped["DepartmentAdmin | None"] = relationship("DepartmentAdmin", back_populates="user", uselist=False)


# ─── Campus Admin ────────────────────────────────────────────────────────────

class CampusAdmin(Base):
    __tablename__ = "campus_admins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    campus_id: Mapped[int] = mapped_column(Integer, ForeignKey("campuses.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="campus_admin_profile")
    campus: Mapped["Campus"] = relationship("Campus", back_populates="campus_admins")


# ─── Department Admin ─────────────────────────────────────────────────────────

class DepartmentAdmin(Base):
    __tablename__ = "department_admins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    department_id: Mapped[int] = mapped_column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="department_admin_profile")
    department: Mapped["Department"] = relationship("Department", back_populates="department_admins")


# ─── Faculty ─────────────────────────────────────────────────────────────────

class Faculty(Base):
    __tablename__ = "faculty"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    department_id: Mapped[int] = mapped_column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    faculty_code: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    academic_rank: Mapped[str | None] = mapped_column(String(100), nullable=True)
    highest_degree: Mapped[str | None] = mapped_column(String(100), nullable=True)
    specialization: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    
    # Questionnaire lifecycle status:
    #   not_started     - no parts submitted yet
    #   in_progress     - at least one part saved but required parts incomplete
    #   eligible        - all required parts (1,2,3,5,6) complete, no recommendation yet
    #   has_recommendation - recommendation has been generated and stored
    questionnaire_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="not_started", index=True
    )
    last_recommendation_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_recommendation_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="faculty_profile")
    department: Mapped["Department"] = relationship("Department", back_populates="faculty_members")
    training_responses: Mapped[list["TrainingResponse"]] = relationship("TrainingResponse", back_populates="faculty")
    questionnaire_parts: Mapped[list["QuestionnairePart"]] = relationship("QuestionnairePart", back_populates="faculty", cascade="all, delete-orphan")
    recommendation_requests: Mapped[list["TrainingRecommendationRequest"]] = relationship("TrainingRecommendationRequest", back_populates="faculty", cascade="all, delete-orphan")


# ─── Training Catalog ─────────────────────────────────────────────────────────

class TrainingCatalog(Base):
    __tablename__ = "training_catalog"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    training_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    categories_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_competencies_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    modalities_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    durations_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    schedules_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ─── Training Response (Survey Submission) ───────────────────────────────────

class TrainingResponse(Base):
    __tablename__ = "training_responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    faculty_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("faculty.id"), nullable=True, index=True)
    department_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    submitted_by_user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    faculty: Mapped["Faculty | None"] = relationship("Faculty", back_populates="training_responses")


# ─── Recommendation History ───────────────────────────────────────────────────

class RecommendationHistory(Base):
    __tablename__ = "recommendation_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("campuses.id"), nullable=True, index=True)
    faculty_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("faculty.id"), nullable=True, index=True)
    department_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    recommendation_type: Mapped[str] = mapped_column(String(30), nullable=False)  # "individual", "department", or "campus"
    model_version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    request_payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    response_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


# ─── Model Registry ──────────────────────────────────────────────────────────

class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    version: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    artifact_path: Mapped[str] = mapped_column(String(500), nullable=False)
    metrics_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


# ─── Audit Log ────────────────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    role_name: Mapped[str | None] = mapped_column(String(50), nullable=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    entity_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    old_values_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_values_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)


# ─── Questionnaire Parts ─────────────────────────────────────────────────────

class QuestionnairePart(Base):
    """
    Stores each faculty member's per-part questionnaire data and completion status.
    Parts 1-8 correspond to the questionnaire sections.
    Required for recommendation: Parts 1, 2, 3, 5, 6.
    """
    __tablename__ = "questionnaire_parts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    faculty_id: Mapped[int] = mapped_column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False, index=True)
    part_number: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 through 8
    is_complete: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    data_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # validated JSON for this part
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("faculty_id", "part_number", name="uq_faculty_part"),
    )

    faculty: Mapped["Faculty"] = relationship("Faculty", back_populates="questionnaire_parts")


# ─── Training Recommendation Requests ────────────────────────────────────────

class TrainingRecommendationRequest(Base):
    """Records each recommendation request made by or for a faculty member."""
    __tablename__ = "training_recommendation_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    faculty_id: Mapped[int] = mapped_column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_by_user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    recommendation_type: Mapped[str] = mapped_column(String(20), nullable=False, default="individual")
    model_version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    recommendation_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)

    faculty: Mapped["Faculty"] = relationship("Faculty", back_populates="recommendation_requests")