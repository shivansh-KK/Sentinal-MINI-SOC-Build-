from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Dict, Any, List

from backend.app.api.deps import get_db
from backend.app.models.models import Incident, Alert, Event, IncidentAlert, IncidentEvent

router = APIRouter(prefix="/investigation", tags=["Investigation Workspace"])

@router.get("/evidence")
def get_investigation_evidence(incident_id: str = Query(...), db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Fetch alerts
    alert_links = db.query(IncidentAlert).filter(IncidentAlert.incident_id == incident_id).all()
    alert_ids = [l.alert_id for l in alert_links]
    alerts = db.query(Alert).filter(Alert.alert_id.in_(alert_ids)).all() if alert_ids else []

    # Fetch events
    event_links = db.query(IncidentEvent).filter(IncidentEvent.incident_id == incident_id).all()
    event_ids = [l.event_id for l in event_links]
    events = db.query(Event).filter(Event.id.in_(event_ids)).all() if event_ids else []

    # Timeline construction
    timeline = []
    for e in events:
        timeline.append({
            "timestamp": e.timestamp.isoformat(),
            "type": "event",
            "title": f"Event: {e.event_type}",
            "description": e.message,
            "severity": e.severity,
            "source_ip": e.source_ip,
            "hostname": e.hostname
        })
    for a in alerts:
        timeline.append({
            "timestamp": a.created_at.isoformat(),
            "type": "alert",
            "title": f"Detection: {a.rule_name}",
            "description": a.description,
            "severity": a.severity,
            "source_ip": a.source_ip,
            "hostname": a.hostname
        })

    timeline.sort(key=lambda x: x["timestamp"])

    return {
        "incident": incident,
        "alerts": alerts,
        "events": events,
        "timeline": timeline,
        "mitre_mappings": [
            {"technique": "T1110", "name": "Brute Force", "tactic": "Credential Access"},
            {"technique": "T1046", "name": "Network Service Discovery", "tactic": "Discovery"},
            {"technique": "T1068", "name": "Exploitation for Privilege Escalation", "tactic": "Privilege Escalation"},
            {"technique": "T1059", "name": "Command and Scripting Interpreter", "tactic": "Execution"}
        ]
    }
