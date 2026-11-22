import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.models.models import Alert, IncidentAlert, AuditLog
from backend.app.schemas.schemas import AlertUpdate

class AlertService:
    def get_alerts(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 50,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        rule_id: Optional[str] = None,
        source_ip: Optional[str] = None,
        hostname: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Alert], int]:
        q = db.query(Alert)
        if severity:
            q = q.filter(Alert.severity == severity)
        if status:
            q = q.filter(Alert.status == status)
        if rule_id:
            q = q.filter(Alert.rule_id == rule_id)
        if source_ip:
            q = q.filter(Alert.source_ip.contains(source_ip))
        if hostname:
            q = q.filter(Alert.hostname.contains(hostname))
        if search:
            q = q.filter(
                (Alert.title.contains(search)) |
                (Alert.description.contains(search)) |
                (Alert.source_ip.contains(search)) |
                (Alert.hostname.contains(search)) |
                (Alert.alert_id.contains(search))
            )

        total = q.count()
        alerts = q.order_by(desc(Alert.created_at)).offset(skip).limit(limit).all()
        return alerts, total

    def get_alert_by_id(self, db: Session, alert_id: str) -> Optional[Alert]:
        return db.query(Alert).filter(Alert.alert_id == alert_id).first()

    def update_alert(self, db: Session, alert_id: str, update_data: AlertUpdate, actor: str = "analyst") -> Optional[Alert]:
        alert = self.get_alert_by_id(db, alert_id)
        if not alert:
            return None

        if update_data.status:
            alert.status = update_data.status
            if update_data.status == "resolved":
                alert.resolved_at = datetime.datetime.utcnow()
        if update_data.analyst_notes is not None:
            alert.analyst_notes = update_data.analyst_notes
        if update_data.assigned_to is not None:
            alert.assigned_to = update_data.assigned_to

        db.commit()
        db.refresh(alert)

        # Audit
        audit = AuditLog(
            actor=actor,
            action="UPDATE_ALERT",
            resource_type="alert",
            resource_id=alert_id,
            outcome="success",
            details=f"Alert updated: status={alert.status}, assigned_to={alert.assigned_to}"
        )
        db.add(audit)
        db.commit()

        return alert

    def acknowledge_alert(self, db: Session, alert_id: str, actor: str = "analyst") -> Optional[Alert]:
        return self.update_alert(db, alert_id, AlertUpdate(status="acknowledged"), actor=actor)

alert_service = AlertService()
