import uuid
import datetime
import json
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.models import (
    Event, Alert, Incident, IncidentEvent, IncidentAlert, DetectionRule, Endpoint, ResponsePlaybook
)
from backend.app.response.engine import response_engine
from backend.app.websocket.manager import ws_manager

class DetectionEngine:
    def __init__(self):
        pass

    def evaluate_event(self, db: Session, event: Event) -> List[Alert]:
        """Evaluate an ingested event against all active detection rules."""
        generated_alerts: List[Alert] = []

        active_rules = db.query(DetectionRule).filter(DetectionRule.is_enabled == True).all()
        rule_map = {r.rule_id: r for r in active_rules}

        # Rule 1: SSH Brute Force (DET-001)
        if "DET-001" in rule_map and event.event_type == "failed_login" and event.source_ip:
            alert = self._detect_ssh_brute_force(db, event, rule_map["DET-001"])
            if alert:
                generated_alerts.append(alert)

        # Rule 2: Successful Login After Failed Attempts (DET-002)
        if "DET-002" in rule_map and event.event_type in ["auth_success", "successful_login"] and event.source_ip:
            alert = self._detect_login_after_failures(db, event, rule_map["DET-002"])
            if alert:
                generated_alerts.append(alert)

        # Rule 3: Port Scanning (DET-003)
        if "DET-003" in rule_map and event.event_type in ["port_scan", "network_connection"] and event.source_ip:
            alert = self._detect_port_scan(db, event, rule_map["DET-003"])
            if alert:
                generated_alerts.append(alert)

        # Rule 4: Privilege Escalation (DET-004)
        if "DET-004" in rule_map and (event.event_type in ["privilege_escalation", "sudo_elevation"] or
                                      (event.category == "process" and "sudo" in (event.command_line or "").lower())):
            alert = self._detect_privilege_escalation(db, event, rule_map["DET-004"])
            if alert:
                generated_alerts.append(alert)

        # Rule 5: Suspicious Process Execution (DET-005)
        if "DET-005" in rule_map and (event.category == "process" or event.event_type == "suspicious_process"):
            alert = self._detect_suspicious_process(db, event, rule_map["DET-005"])
            if alert:
                generated_alerts.append(alert)

        # Rule 6: File Integrity Monitoring (DET-006)
        if "DET-006" in rule_map and (event.category == "file_integrity" or event.event_type in ["file_modified", "fim_alert"]):
            alert = self._detect_fim(db, event, rule_map["DET-006"])
            if alert:
                generated_alerts.append(alert)

        # Rule 7: Multiple Accounts Targeted (DET-007)
        if "DET-007" in rule_map and event.event_type == "failed_login" and event.source_ip:
            alert = self._detect_multiple_accounts_targeted(db, event, rule_map["DET-007"])
            if alert:
                generated_alerts.append(alert)

        # Rule 8: Unusual Endpoint Activity (DET-008)
        if "DET-008" in rule_map and event.category in ["endpoint", "system", "anomaly"]:
            alert = self._detect_unusual_endpoint_activity(db, event, rule_map["DET-008"])
            if alert:
                generated_alerts.append(alert)

        # Process each generated alert: correlate into Incident, trigger automated response, update endpoint
        for alert in generated_alerts:
            incident = self._correlate_incident(db, alert, event)
            self._trigger_response_playbook(db, alert, incident, event)
            self._update_endpoint_stats(db, alert)

        return generated_alerts

    def _is_in_cooldown(self, db: Session, rule_id: str, source_ip: Optional[str], hostname: Optional[str], cooldown_seconds: int = 120) -> bool:
        """Check if an identical alert was generated recently to prevent duplicate spamming."""
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(seconds=cooldown_seconds)
        q = db.query(Alert).filter(Alert.rule_id == rule_id, Alert.created_at >= cutoff)
        if source_ip:
            q = q.filter(Alert.source_ip == source_ip)
        if hostname:
            q = q.filter(Alert.hostname == hostname)
        return q.first() is not None

    def _create_alert(self, db: Session, rule: DetectionRule, title: str, description: str,
                      source_ip: Optional[str], destination_ip: Optional[str], hostname: Optional[str],
                      related_event_count: int, risk_score: int) -> Alert:
        alert_id = f"ALT-{uuid.uuid4().hex[:8].upper()}"
        alert = Alert(
            alert_id=alert_id,
            title=title,
            description=description,
            severity=rule.severity,
            status="new",
            source_ip=source_ip,
            destination_ip=destination_ip,
            hostname=hostname,
            rule_id=rule.rule_id,
            rule_name=rule.name,
            related_event_count=related_event_count,
            risk_score=risk_score,
            recommended_response=rule.recommended_action,
            first_detected_at=datetime.datetime.utcnow(),
            last_detected_at=datetime.datetime.utcnow()
        )
        db.add(alert)
        rule.trigger_count += 1
        rule.last_triggered_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(alert)
        return alert

    # --- Detections ---

    def _detect_ssh_brute_force(self, db: Session, event: Event, rule: DetectionRule) -> Optional[Alert]:
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(seconds=rule.time_window_seconds)
        count = db.query(Event).filter(
            Event.source_ip == event.source_ip,
            Event.event_type == "failed_login",
            Event.timestamp >= cutoff
        ).count()

        if count >= rule.threshold:
            if self._is_in_cooldown(db, rule.rule_id, event.source_ip, event.hostname, cooldown_seconds=60):
                return None
            return self._create_alert(
                db, rule,
                title=f"SSH Brute-Force Attack Detected from {event.source_ip}",
                description=f"Observed {count} failed login attempts from source IP {event.source_ip} targeting {event.hostname} within {rule.time_window_seconds}s.",
                source_ip=event.source_ip,
                destination_ip=event.destination_ip,
                hostname=event.hostname,
                related_event_count=count,
                risk_score=85
            )
        return None

    def _detect_login_after_failures(self, db: Session, event: Event, rule: DetectionRule) -> Optional[Alert]:
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(seconds=180)
        recent_failures = db.query(Event).filter(
            Event.source_ip == event.source_ip,
            Event.event_type == "failed_login",
            Event.timestamp >= cutoff
        ).count()

        if recent_failures >= 3:
            if self._is_in_cooldown(db, rule.rule_id, event.source_ip, event.hostname, cooldown_seconds=90):
                return None
            return self._create_alert(
                db, rule,
                title=f"Compromised Account: Successful Login After Repeated Failures",
                description=f"Successful authentication for user '{event.username or 'unknown'}' on {event.hostname} following {recent_failures} failed attempts from IP {event.source_ip}.",
                source_ip=event.source_ip,
                destination_ip=event.destination_ip,
                hostname=event.hostname,
                related_event_count=recent_failures + 1,
                risk_score=95
            )
        return None

    def _detect_port_scan(self, db: Session, event: Event, rule: DetectionRule) -> Optional[Alert]:
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(seconds=rule.time_window_seconds)
        # Count distinct destination ports targeted
        ports = db.query(Event.destination_port).filter(
            Event.source_ip == event.source_ip,
            Event.timestamp >= cutoff,
            Event.destination_port.isnot(None)
        ).distinct().all()

        distinct_port_count = len(ports)
        if distinct_port_count >= rule.threshold or event.event_type == "port_scan":
            effective_count = max(distinct_port_count, rule.threshold)
            if self._is_in_cooldown(db, rule.rule_id, event.source_ip, event.hostname, cooldown_seconds=60):
                return None
            return self._create_alert(
                db, rule,
                title=f"Port Reconnaissance Scan Detected from {event.source_ip}",
                description=f"Source IP {event.source_ip} probed {effective_count} distinct ports on host {event.hostname} within {rule.time_window_seconds}s.",
                source_ip=event.source_ip,
                destination_ip=event.destination_ip,
                hostname=event.hostname,
                related_event_count=effective_count,
                risk_score=75
            )
        return None

    def _detect_privilege_escalation(self, db: Session, event: Event, rule: DetectionRule) -> Optional[Alert]:
        if self._is_in_cooldown(db, rule.rule_id, event.source_ip, event.hostname, cooldown_seconds=60):
            return None
        return self._create_alert(
            db, rule,
            title=f"Privilege Escalation Activity on {event.hostname}",
            description=f"Unauthorized privilege elevation or administrative token execution by user '{event.username or 'system'}': {event.message}",
            source_ip=event.source_ip,
            destination_ip=event.destination_ip,
            hostname=event.hostname,
            related_event_count=1,
            risk_score=90
        )

    def _detect_suspicious_process(self, db: Session, event: Event, rule: DetectionRule) -> Optional[Alert]:
        suspicious_signatures = ["mimikatz", "powershell -enc", "nc -e", "bash -i", "certutil -urlcache", "whoami /all", "nmap"]
        cmd = (event.command_line or event.process_name or event.message or "").lower()
        matched = any(sig in cmd for sig in suspicious_signatures) or event.event_type == "suspicious_process"
        if matched:
            if self._is_in_cooldown(db, rule.rule_id, event.source_ip, event.hostname, cooldown_seconds=60):
                return None
            return self._create_alert(
                db, rule,
                title=f"Suspicious Process Execution on {event.hostname}",
                description=f"Process '{event.process_name or 'unknown'}' executed with anomalous command line pattern: {event.command_line or event.message}",
                source_ip=event.source_ip,
                destination_ip=event.destination_ip,
                hostname=event.hostname,
                related_event_count=1,
                risk_score=85
            )
        return None

    def _detect_fim(self, db: Session, event: Event, rule: DetectionRule) -> Optional[Alert]:
        if self._is_in_cooldown(db, rule.rule_id, None, event.hostname, cooldown_seconds=60):
            return None
        return self._create_alert(
            db, rule,
            title=f"Critical File Integrity Breach on {event.hostname}",
            description=f"Cryptographic hash mismatch or unauthorized file alteration detected: {event.message}",
            source_ip=event.source_ip,
            destination_ip=event.destination_ip,
            hostname=event.hostname,
            related_event_count=1,
            risk_score=80
        )

    def _detect_multiple_accounts_targeted(self, db: Session, event: Event, rule: DetectionRule) -> Optional[Alert]:
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(seconds=120)
        users = db.query(Event.username).filter(
            Event.source_ip == event.source_ip,
            Event.event_type == "failed_login",
            Event.timestamp >= cutoff,
            Event.username.isnot(None)
        ).distinct().all()

        if len(users) >= 3:
            if self._is_in_cooldown(db, rule.rule_id, event.source_ip, event.hostname, cooldown_seconds=60):
                return None
            user_list = ", ".join([u[0] for u in users[:5]])
            return self._create_alert(
                db, rule,
                title=f"Password Spraying Campaign from {event.source_ip}",
                description=f"Source IP {event.source_ip} attempted unauthorized authentication across multiple accounts ({user_list}) on {event.hostname}.",
                source_ip=event.source_ip,
                destination_ip=event.destination_ip,
                hostname=event.hostname,
                related_event_count=len(users),
                risk_score=88
            )
        return None

    def _detect_unusual_endpoint_activity(self, db: Session, event: Event, rule: DetectionRule) -> Optional[Alert]:
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(seconds=60)
        event_burst = db.query(Event).filter(
            Event.hostname == event.hostname,
            Event.timestamp >= cutoff
        ).count()

        if event_burst >= 25 or event.event_type == "unusual_endpoint_activity":
            if self._is_in_cooldown(db, rule.rule_id, None, event.hostname, cooldown_seconds=120):
                return None
            return self._create_alert(
                db, rule,
                title=f"Anomalous Activity Spike on {event.hostname}",
                description=f"High event frequency burst ({event_burst} events in 60s) indicating anomalous endpoint behavior.",
                source_ip=event.source_ip,
                destination_ip=event.destination_ip,
                hostname=event.hostname,
                related_event_count=event_burst,
                risk_score=70
            )
        return None

    # --- Correlation & Response ---

    def _correlate_incident(self, db: Session, alert: Alert, event: Event) -> Incident:
        """Find active incident matching source_ip or endpoint within past 1 hour, or create new."""
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=1)
        incident = db.query(Incident).filter(
            Incident.status.in_(["new", "open", "investigating"]),
            Incident.updated_at >= cutoff
        )

        if alert.source_ip:
            matched = incident.filter(Incident.source_ip == alert.source_ip).first()
        else:
            matched = incident.filter(Incident.affected_endpoint == alert.hostname).first()

        if not matched:
            incident_id = f"INC-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
            matched = Incident(
                incident_id=incident_id,
                title=f"Security Incident: {alert.title}",
                description=f"Automated incident generated following {alert.rule_name} trigger. Initial threat: {alert.description}",
                severity=alert.severity,
                status="new",
                source_ip=alert.source_ip,
                affected_endpoint=alert.hostname,
                investigation_notes=f"[{datetime.datetime.utcnow().strftime('%H:%M:%S')}] Incident opened automatically by correlation engine."
            )
            db.add(matched)
            db.commit()
            db.refresh(matched)

        # Link alert and event to incident
        db.add(IncidentAlert(incident_id=matched.incident_id, alert_id=alert.alert_id))
        db.add(IncidentEvent(incident_id=matched.incident_id, event_id=event.id))
        matched.updated_at = datetime.datetime.utcnow()
        if alert.severity == "critical":
            matched.severity = "critical"
        db.commit()
        return matched

    def _trigger_response_playbook(self, db: Session, alert: Alert, incident: Incident, event: Event):
        """Dispatch incident response playbook based on threat type."""
        target_ip = alert.source_ip
        target_host = alert.hostname

        if alert.rule_id in ["DET-001", "DET-002", "DET-007"] and target_ip:
            # Playbook 1: Brute Force containment
            response_engine.propose_or_execute_action(
                db,
                action_type="block_ip",
                target=target_ip,
                alert_id=alert.alert_id,
                incident_id=incident.incident_id,
                actor="SENTINEL Playbook-01"
            )
        elif alert.rule_id == "DET-003" and target_ip:
            # Playbook 2: Port Scanning containment
            response_engine.propose_or_execute_action(
                db,
                action_type="block_ip",
                target=target_ip,
                alert_id=alert.alert_id,
                incident_id=incident.incident_id,
                actor="SENTINEL Playbook-02"
            )
        elif alert.rule_id in ["DET-004", "DET-005", "DET-006", "DET-008"] and target_host:
            # Playbook 3: Endpoint Isolation / Investigation
            response_engine.propose_or_execute_action(
                db,
                action_type="isolate_endpoint",
                target=target_host,
                alert_id=alert.alert_id,
                incident_id=incident.incident_id,
                actor="SENTINEL Playbook-03"
            )

    def _update_endpoint_stats(self, db: Session, alert: Alert):
        if not alert.hostname:
            return
        ep = db.query(Endpoint).filter(Endpoint.hostname == alert.hostname).first()
        if ep:
            ep.alert_count += 1
            if alert.severity == "critical":
                ep.risk_score = min(100, ep.risk_score + 30)
                ep.status = "warning"
            elif alert.severity == "high":
                ep.risk_score = min(100, ep.risk_score + 15)
                ep.status = "warning"
            db.commit()

detection_engine = DetectionEngine()
