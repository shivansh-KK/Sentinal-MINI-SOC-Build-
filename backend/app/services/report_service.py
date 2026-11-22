import datetime
import io
import csv
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.app.models.models import Event, Alert, Incident, Endpoint, ResponseAction, DetectionRule

class ReportService:
    def generate_report(self, db: Session, report_type: str = "daily_summary") -> Dict[str, Any]:
        now = datetime.datetime.utcnow()
        if report_type == "weekly":
            cutoff = now - datetime.timedelta(days=7)
            title = "Weekly Threat & Incident Summary Report"
        elif report_type == "monthly":
            cutoff = now - datetime.timedelta(days=30)
            title = "Monthly Security Operations Report"
        elif report_type == "critical_incidents":
            cutoff = now - datetime.timedelta(days=14)
            title = "Critical Incident Analysis Report"
        elif report_type == "endpoint_health":
            cutoff = now - datetime.timedelta(days=7)
            title = "Endpoint Telemetry & Posture Report"
        elif report_type == "responses":
            cutoff = now - datetime.timedelta(days=14)
            title = "Automated Incident Response Effectiveness Report"
        else: # daily
            cutoff = now - datetime.timedelta(days=1)
            title = "Daily SOC Security Operations Summary"

        # Query metrics within timeframe
        events_count = db.query(Event).filter(Event.timestamp >= cutoff).count()
        alerts_count = db.query(Alert).filter(Alert.created_at >= cutoff).count()
        incidents_count = db.query(Incident).filter(Incident.created_at >= cutoff).count()
        responses_count = db.query(ResponseAction).filter(ResponseAction.created_at >= cutoff).count()

        # Severity breakdown
        severities = db.query(Alert.severity, func.count(Alert.id)).filter(Alert.created_at >= cutoff).group_by(Alert.severity).all()
        sev_dict = {s: c for s, c in severities}

        # Top Rules triggered
        top_rules = db.query(Alert.rule_name, func.count(Alert.id)).filter(Alert.created_at >= cutoff)\
            .group_by(Alert.rule_name).order_by(desc(func.count(Alert.id))).limit(5).all()

        # Top Attackers
        top_attackers = db.query(Alert.source_ip, func.count(Alert.id)).filter(Alert.created_at >= cutoff, Alert.source_ip.isnot(None))\
            .group_by(Alert.source_ip).order_by(desc(func.count(Alert.id))).limit(5).all()

        # Recent Incidents
        recent_incidents = db.query(Incident).filter(Incident.created_at >= cutoff).order_by(desc(Incident.created_at)).limit(10).all()
        incident_list = [{
            "id": inc.incident_id,
            "title": inc.title,
            "severity": inc.severity,
            "status": inc.status,
            "source_ip": inc.source_ip,
            "endpoint": inc.affected_endpoint,
            "created_at": inc.created_at.strftime("%Y-%m-%d %H:%M")
        } for inc in recent_incidents]

        return {
            "title": title,
            "report_type": report_type,
            "generated_at": now.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "time_window": f"{cutoff.strftime('%Y-%m-%d %H:%M')} to {now.strftime('%Y-%m-%d %H:%M')}",
            "summary": {
                "total_events": events_count,
                "total_alerts": alerts_count,
                "total_incidents": incidents_count,
                "total_responses": responses_count,
                "critical_threats": sev_dict.get("critical", 0),
                "high_threats": sev_dict.get("high", 0),
                "medium_threats": sev_dict.get("medium", 0),
                "low_threats": sev_dict.get("low", 0),
            },
            "top_detection_rules": [{"rule": r, "count": c} for r, c in top_rules],
            "top_threat_sources": [{"ip": ip, "count": c} for ip, c in top_attackers],
            "incidents": incident_list,
            "analyst_assessment": "Threat detection algorithms operating normally. High mitigation efficiency observed through automated containment playbooks."
        }

    def export_csv(self, db: Session, data_type: str = "alerts") -> str:
        output = io.StringIO()
        writer = csv.writer(output)

        if data_type == "alerts":
            writer.writerow(["Alert ID", "Title", "Severity", "Status", "Source IP", "Hostname", "Rule Name", "Risk Score", "Detected At"])
            alerts = db.query(Alert).order_by(desc(Alert.created_at)).limit(500).all()
            for a in alerts:
                writer.writerow([a.alert_id, a.title, a.severity, a.status, a.source_ip or "", a.hostname or "", a.rule_name, a.risk_score, a.created_at.isoformat()])
        elif data_type == "incidents":
            writer.writerow(["Incident ID", "Title", "Severity", "Status", "Source IP", "Affected Host", "Assigned To", "Created At"])
            incidents = db.query(Incident).order_by(desc(Incident.created_at)).limit(500).all()
            for i in incidents:
                writer.writerow([i.incident_id, i.title, i.severity, i.status, i.source_ip or "", i.affected_endpoint or "", i.assigned_to or "Unassigned", i.created_at.isoformat()])
        elif data_type == "events":
            writer.writerow(["ID", "Timestamp", "Source", "Hostname", "Source IP", "Destination IP", "Event Type", "Severity", "Message"])
            events = db.query(Event).order_by(desc(Event.timestamp)).limit(500).all()
            for e in events:
                writer.writerow([e.id, e.timestamp.isoformat(), e.source, e.hostname, e.source_ip or "", e.destination_ip or "", e.event_type, e.severity, e.message])
        elif data_type == "responses":
            writer.writerow(["Action ID", "Action Type", "Target", "Execution Mode", "Status", "Triggered By Alert", "Executed At", "Details"])
            responses = db.query(ResponseAction).order_by(desc(ResponseAction.created_at)).limit(500).all()
            for r in responses:
                writer.writerow([r.action_id, r.action_type, r.target, r.execution_mode, r.status, r.triggering_alert_id or "", r.executed_at.isoformat() if r.executed_at else "", r.output_details or ""])

        return output.getvalue()

report_service = ReportService()
