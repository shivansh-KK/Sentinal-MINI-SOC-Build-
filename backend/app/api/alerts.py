from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.api.deps import get_db, get_current_user
from backend.app.schemas.schemas import AlertResponse, AlertUpdate
from backend.app.services.alert_service import alert_service
from backend.app.models.models import User

router = APIRouter(prefix="/alerts", tags=["Alert Management"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    severity: Optional[str] = None,
    status: Optional[str] = None,
    rule_id: Optional[str] = None,
    source_ip: Optional[str] = None,
    hostname: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    alerts, _ = alert_service.get_alerts(
        db, skip=skip, limit=limit, severity=severity, status=status,
        rule_id=rule_id, source_ip=source_ip, hostname=hostname, search=search
    )
    return alerts

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = alert_service.get_alert_by_id(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.patch("/{alert_id}", response_model=AlertResponse)
def update_alert(
    alert_id: str,
    update_data: AlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    actor = current_user.username if current_user else "analyst"
    alert = alert_service.update_alert(db, alert_id, update_data, actor=actor)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    actor = current_user.username if current_user else "analyst"
    alert = alert_service.acknowledge_alert(db, alert_id, actor=actor)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert
