import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Index, Float
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(128), nullable=True)
    role = Column(String(32), default="analyst", nullable=False)  # admin, analyst, viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

class Endpoint(Base):
    __tablename__ = "endpoints"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String(128), unique=True, index=True, nullable=False)
    ip_address = Column(String(45), index=True, nullable=False)
    mac_address = Column(String(32), nullable=True)
    os_type = Column(String(32), default="Linux")  # Linux, Windows, macOS
    os_version = Column(String(128), default="Ubuntu 22.04 LTS")
    agent_version = Column(String(32), default="1.0.0")
    status = Column(String(32), default="online", index=True)  # online, offline, warning, under_investigation
    last_heartbeat = Column(DateTime, default=datetime.datetime.utcnow)
    risk_score = Column(Integer, default=10)
    alert_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True, nullable=False)
    source = Column(String(64), default="agent", index=True)  # agent, syslog, demo, wazuh, win_event
    hostname = Column(String(128), index=True, nullable=False)
    source_ip = Column(String(45), index=True, nullable=True)
    destination_ip = Column(String(45), index=True, nullable=True)
    source_port = Column(Integer, nullable=True)
    destination_port = Column(Integer, nullable=True)
    protocol = Column(String(16), default="TCP")
    event_type = Column(String(64), index=True, nullable=False)  # failed_login, auth_success, port_scan, etc.
    category = Column(String(64), index=True, default="authentication")  # authentication, network, process, file_integrity
    severity = Column(String(16), index=True, default="low")  # critical, high, medium, low, info
    username = Column(String(64), nullable=True)
    process_name = Column(String(128), nullable=True)
    process_id = Column(Integer, nullable=True)
    command_line = Column(Text, nullable=True)
    message = Column(Text, nullable=False)
    raw_log = Column(Text, nullable=True)
    normalized_data = Column(Text, nullable=True)  # JSON string
    is_reviewed = Column(Boolean, default=False)
    is_synthetic = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        Index("idx_events_ip_timestamp", "source_ip", "timestamp"),
        Index("idx_events_host_timestamp", "hostname", "timestamp"),
        Index("idx_events_type_cat", "event_type", "category"),
    )

class DetectionRule(Base):
    __tablename__ = "detection_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(String(32), unique=True, index=True, nullable=False)  # e.g., DET-001
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(64), default="authentication")
    severity = Column(String(16), default="medium")
    is_enabled = Column(Boolean, default=True)
    logic_type = Column(String(64), nullable=False)  # threshold_window, sequence, pattern, anomaly
    threshold = Column(Integer, default=5)
    time_window_seconds = Column(Integer, default=60)
    mitre_technique = Column(String(32), default="T1110")  # e.g. T1110 Brute Force
    mitre_tactic = Column(String(64), default="Credential Access")
    recommended_action = Column(String(128), default="Propose IP block & analyst review")
    trigger_count = Column(Integer, default=0)
    last_triggered_at = Column(DateTime, nullable=True)
    parameters = Column(Text, nullable=True)  # JSON custom params
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(32), unique=True, index=True, nullable=False)  # e.g., ALT-1001
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(16), index=True, default="high")  # critical, high, medium, low, info
    status = Column(String(32), index=True, default="new")  # new, acknowledged, investigating, resolved, false_positive
    source_ip = Column(String(45), index=True, nullable=True)
    destination_ip = Column(String(45), nullable=True)
    hostname = Column(String(128), index=True, nullable=True)
    rule_id = Column(String(32), index=True, nullable=False)
    rule_name = Column(String(128), nullable=False)
    related_event_count = Column(Integer, default=1)
    risk_score = Column(Integer, default=70)
    recommended_response = Column(String(255), nullable=True)
    analyst_notes = Column(Text, nullable=True)
    assigned_to = Column(String(64), nullable=True)
    first_detected_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_detected_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(32), unique=True, index=True, nullable=False)  # e.g. INC-2026-001
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(16), index=True, default="high")  # critical, high, medium, low
    status = Column(String(32), index=True, default="new")  # new, open, investigating, contained, resolved, closed
    source_ip = Column(String(45), index=True, nullable=True)
    affected_endpoint = Column(String(128), index=True, nullable=True)
    assigned_to = Column(String(64), nullable=True)
    investigation_notes = Column(Text, nullable=True)
    resolution_summary = Column(Text, nullable=True)
    containment_time = Column(DateTime, nullable=True)
    resolved_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(32), ForeignKey("incidents.incident_id", ondelete="CASCADE"), index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), index=True)

class IncidentAlert(Base):
    __tablename__ = "incident_alerts"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(32), ForeignKey("incidents.incident_id", ondelete="CASCADE"), index=True)
    alert_id = Column(String(32), ForeignKey("alerts.alert_id", ondelete="CASCADE"), index=True)

class ResponsePlaybook(Base):
    __tablename__ = "response_playbooks"

    id = Column(Integer, primary_key=True, index=True)
    playbook_id = Column(String(32), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    trigger_rule_type = Column(String(64), nullable=False)  # ssh_brute_force, port_scan, suspicious_endpoint, etc.
    action_type = Column(String(64), nullable=False)  # block_ip, isolate_endpoint, terminate_process
    default_mode = Column(String(32), default="simulation")  # simulation, approval_required, lab_enforcement
    is_enabled = Column(Boolean, default=True)
    cooldown_seconds = Column(Integer, default=300)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ResponseAction(Base):
    __tablename__ = "response_actions"

    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(String(32), unique=True, index=True, nullable=False)  # e.g. ACT-901
    action_type = Column(String(64), nullable=False)  # block_ip, unblock_ip, isolate_endpoint, etc.
    target = Column(String(128), nullable=False)  # IP address or hostname
    execution_mode = Column(String(32), default="simulation")  # simulation, approval_required, lab_enforcement
    status = Column(String(32), default="pending_approval", index=True)  # pending_approval, approved, rejected, executed, failed, rolled_back
    triggering_alert_id = Column(String(32), nullable=True)
    triggering_incident_id = Column(String(32), nullable=True)
    proposed_by = Column(String(64), default="system")
    executed_by = Column(String(64), nullable=True)
    executed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    is_reversed = Column(Boolean, default=False)
    output_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ResponseApproval(Base):
    __tablename__ = "response_approvals"

    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(String(32), ForeignKey("response_actions.action_id", ondelete="CASCADE"), index=True)
    requested_by = Column(String(64), default="system")
    approved_by = Column(String(64), nullable=True)
    status = Column(String(32), default="pending")  # pending, approved, rejected
    notes = Column(Text, nullable=True)
    decided_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    actor = Column(String(64), index=True, default="system")
    action = Column(String(64), index=True, nullable=False)
    resource_type = Column(String(64), nullable=False)
    resource_id = Column(String(128), nullable=True)
    outcome = Column(String(32), default="success")  # success, failure, denied
    ip_address = Column(String(45), nullable=True)
    details = Column(Text, nullable=True)  # JSON string

class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    key_id = Column(String(32), unique=True, index=True, nullable=False)
    name = Column(String(64), nullable=False)
    key_hash = Column(String(255), nullable=False)
    prefix = Column(String(12), nullable=False)
    role = Column(String(32), default="agent")  # agent, ingest, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    last_used_at = Column(DateTime, nullable=True)

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(64), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    updated_by = Column(String(64), default="system")

class FileIntegrityRecord(Base):
    __tablename__ = "file_integrity_records"

    id = Column(Integer, primary_key=True, index=True)
    file_path = Column(String(255), index=True, nullable=False)
    hostname = Column(String(128), index=True, nullable=False)
    baseline_hash = Column(String(128), nullable=False)
    current_hash = Column(String(128), nullable=False)
    algorithm = Column(String(16), default="SHA256")
    status = Column(String(32), default="verified")  # verified, modified, deleted, untracked
    last_checked_at = Column(DateTime, default=datetime.datetime.utcnow)
    modified_at = Column(DateTime, nullable=True)
