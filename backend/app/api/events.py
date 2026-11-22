from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.api.deps import get_db, require_viewer
from backend.app.schemas.schemas import EventIngest, EventResponse
from backend.app.services.event_service import event_service
from backend.app.models.models import Event

router = APIRouter(prefix="/events", tags=["Security Events"])

@router.post("/ingest")
def ingest_event(payload: EventIngest, db: Session = Depends(get_db)):
    event, alerts = event_service.ingest_event(db, payload)
    return {
        "status": "success",
        "event_id": event.id,
        "alerts_generated": len(alerts),
        "alerts": [{"alert_id": a.alert_id, "title": a.title, "severity": a.severity} for a in alerts]
    }

@router.get("", response_model=List[EventResponse])
def list_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    category: Optional[str] = None,
    severity: Optional[str] = None,
    source_ip: Optional[str] = None,
    hostname: Optional[str] = None,
    event_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    events, total = event_service.get_events(
        db, skip=skip, limit=limit, category=category, severity=severity,
        source_ip=source_ip, hostname=hostname, event_type=event_type, search=search
    )
    return events

@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev
