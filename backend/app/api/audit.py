from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional

from backend.app.api.deps import get_db
from backend.app.schemas.schemas import AuditLogResponse
from backend.app.models.models import AuditLog

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    actor: Optional[str] = None,
    outcome: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action == action)
    if actor:
        q = q.filter(AuditLog.actor == actor)
    if outcome:
        q = q.filter(AuditLog.outcome == outcome)
    if search:
        q = q.filter(
            (AuditLog.action.contains(search)) |
            (AuditLog.actor.contains(search)) |
            (AuditLog.resource_type.contains(search)) |
            (AuditLog.details.contains(search))
        )
    return q.order_by(desc(AuditLog.timestamp)).offset(skip).limit(limit).all()
