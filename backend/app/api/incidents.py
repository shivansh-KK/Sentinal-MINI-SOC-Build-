from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from backend.app.api.deps import get_db, get_current_user
from backend.app.schemas.schemas import IncidentResponse, IncidentUpdate, IncidentNoteCreate
from backend.app.services.incident_service import incident_service
from backend.app.models.models import User

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    severity: Optional[str] = None,
    status: Optional[str] = None,
    source_ip: Optional[str] = None,
    affected_endpoint: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    incidents, _ = incident_service.get_incidents(
        db, skip=skip, limit=limit, severity=severity, status=status,
        source_ip=source_ip, affected_endpoint=affected_endpoint, search=search
    )
    return incidents

@router.get("/{incident_id}")
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    details = incident_service.get_incident_details(db, incident_id)
    if not details:
        raise HTTPException(status_code=404, detail="Incident not found")
    return details

@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: str,
    update_data: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    actor = current_user.username if current_user else "analyst"
    incident = incident_service.update_incident(db, incident_id, update_data, actor=actor)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.post("/{incident_id}/notes", response_model=IncidentResponse)
def add_incident_note(
    incident_id: str,
    payload: IncidentNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    actor = current_user.username if current_user else "analyst"
    incident = incident_service.add_note(db, incident_id, payload.note, actor=actor)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident
