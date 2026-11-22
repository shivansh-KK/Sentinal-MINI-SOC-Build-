import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.models.models import Incident, IncidentAlert, Alert, IncidentEvent, Event, AuditLog
from backend.app.schemas.schemas import IncidentUpdate

class IncidentService:
    def get_incidents(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 50,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        source_ip: Optional[str] = None,
        affected_endpoint: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Incident], int]:
        q = db.query(Incident)
        if severity:
            q = q.filter(Incident.severity == severity)
        if status:
            q = q.filter(Incident.status == status)
        if source_ip:
            q = q.filter(Incident.source_ip.contains(source_ip))
        if affected_endpoint:
            q = q.filter(Incident.affected_endpoint.contains(affected_endpoint))
        if search:
            q = q.filter(
                (Incident.title.contains(search)) |
                (Incident.description.contains(search)) |
                (Incident.incident_id.contains(search)) |
                (Incident.source_ip.contains(search)) |
                (Incident.affected_endpoint.contains(search))
            )

        total = q.count()
        incidents = q.order_by(desc(Incident.updated_at)).offset(skip).limit(limit).all()
        return incidents, total

    def get_incident_by_id(self, db: Session, incident_id: str) -> Optional[Incident]:
        return db.query(Incident).filter(Incident.incident_id == incident_id).first()

    def get_incident_details(self, db: Session, incident_id: str):
        incident = self.get_incident_by_id(db, incident_id)
        if not incident:
            return None

        # Get linked alerts
        linked_alert_ids = [r.alert_id for r in db.query(IncidentAlert).filter(IncidentAlert.incident_id == incident_id).all()]
        alerts = db.query(Alert).filter(Alert.alert_id.in_(linked_alert_ids)).all() if linked_alert_ids else []

        # Get linked events
        linked_event_ids = [r.event_id for r in db.query(IncidentEvent).filter(IncidentEvent.incident_id == incident_id).all()]
        events = db.query(Event).filter(Event.id.in_(linked_event_ids)).all() if linked_event_ids else []

        return {
            "incident": incident,
            "alerts": alerts,
            "events": events
        }

    def update_incident(self, db: Session, incident_id: str, update_data: IncidentUpdate, actor: str = "analyst") -> Optional[Incident]:
        incident = self.get_incident_by_id(db, incident_id)
        if not incident:
            return None

        if update_data.status:
            incident.status = update_data.status
            if update_data.status == "contained" and not incident.containment_time:
                incident.containment_time = datetime.datetime.utcnow()
            elif update_data.status in ["resolved", "closed"]:
                incident.resolved_time = datetime.datetime.utcnow()
        if update_data.assigned_to is not None:
            incident.assigned_to = update_data.assigned_to
        if update_data.investigation_notes is not None:
            incident.investigation_notes = update_data.investigation_notes
        if update_data.resolution_summary is not None:
            incident.resolution_summary = update_data.resolution_summary

        incident.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(incident)

        audit = AuditLog(
            actor=actor,
            action="UPDATE_INCIDENT",
            resource_type="incident",
            resource_id=incident_id,
            outcome="success",
            details=f"Incident {incident_id} updated: status={incident.status}, assigned_to={incident.assigned_to}"
        )
        db.add(audit)
        db.commit()

        return incident

    def add_note(self, db: Session, incident_id: str, note_text: str, actor: str = "analyst") -> Optional[Incident]:
        incident = self.get_incident_by_id(db, incident_id)
        if not incident:
            return None

        timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        new_entry = f"[{timestamp}] {actor}: {note_text}"
        if incident.investigation_notes:
            incident.investigation_notes = f"{incident.investigation_notes}\n{new_entry}"
        else:
            incident.investigation_notes = new_entry

        incident.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(incident)

        audit = AuditLog(
            actor=actor,
            action="ADD_INCIDENT_NOTE",
            resource_type="incident",
            resource_id=incident_id,
            outcome="success",
            details=f"Analyst note added to incident {incident_id}"
        )
        db.add(audit)
        db.commit()

        return incident

incident_service = IncidentService()
