"""
Audit Log Query API (System Admin only)
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.db.models import AuditLog, User
from app.db.session import get_db

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("")
def list_audit_logs(
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
    action: str | None = Query(default=None),
    user_id: int | None = Query(default=None),
    current_user: User = Depends(require_roles("system_admin")),
    db: Session = Depends(get_db),
):
    """Query audit logs. Restricted to System Administrator."""
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "logs": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "username": log.username,
                "role_name": log.role_name,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "old_values": log.old_values_json,
                "new_values": log.new_values_json,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ],
    }
