from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    role: str = "analyst"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True

# --- Event Ingest & Query Schemas ---
class EventIngest(BaseModel):
    timestamp: Optional[datetime] = None
    source: str = Field(default="agent", description="Source of event: agent, linux-auth, win-event, demo, wazuh")
    hostname: str = Field(..., description="Hostname of machine generating event")
    source_ip: Optional[str] = Field(None, description="Source IP address")
    destination_ip: Optional[str] = Field(None, description="Destination IP address")
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    protocol: Optional[str] = "TCP"
    event_type: str = Field(..., description="e.g. failed_login, port_scan, priv_escalation, suspicious_process")
    category: Optional[str] = "authentication"
    severity: Optional[str] = "low"
    username: Optional[str] = None
    process_name: Optional[str] = None
    process_id: Optional[int] = None
    command_line: Optional[str] = None
    message: str = Field(..., description="Human readable summary of event")
    raw_log: Optional[str] = None
    normalized_data: Optional[Dict[str, Any]] = None
    is_synthetic: Optional[bool] = False

class EventResponse(BaseModel):
    id: int
    timestamp: datetime
    source: str
    hostname: str
    source_ip: Optional[str]
    destination_ip: Optional[str]
    source_port: Optional[int]
    destination_port: Optional[int]
    protocol: str
    event_type: str
    category: str
    severity: str
    username: Optional[str]
    process_name: Optional[str]
    process_id: Optional[int]
    command_line: Optional[str]
    message: str
    raw_log: Optional[str]
    is_reviewed: bool
    is_synthetic: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Alert Schemas ---
class AlertResponse(BaseModel):
    id: int
    alert_id: str
    title: str
    description: str
    severity: str
    status: str
    source_ip: Optional[str]
    destination_ip: Optional[str]
    hostname: Optional[str]
    rule_id: str
    rule_name: str
    related_event_count: int
    risk_score: int
    recommended_response: Optional[str]
    analyst_notes: Optional[str]
    assigned_to: Optional[str]
    first_detected_at: datetime
    last_detected_at: datetime
    resolved_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    status: Optional[str] = None  # new, acknowledged, investigating, resolved, false_positive
    analyst_notes: Optional[str] = None
    assigned_to: Optional[str] = None

# --- Incident Schemas ---
class IncidentResponse(BaseModel):
    id: int
    incident_id: str
    title: str
    description: str
    severity: str
    status: str
    source_ip: Optional[str]
    affected_endpoint: Optional[str]
    assigned_to: Optional[str]
    investigation_notes: Optional[str]
    resolution_summary: Optional[str]
    containment_time: Optional[datetime]
    resolved_time: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    alerts: Optional[List[AlertResponse]] = []

    class Config:
        from_attributes = True

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    investigation_notes: Optional[str] = None
    resolution_summary: Optional[str] = None

class IncidentNoteCreate(BaseModel):
    note: str

# --- Endpoint Schemas ---
class EndpointHeartbeat(BaseModel):
    hostname: str
    ip_address: str
    mac_address: Optional[str] = None
    os_type: Optional[str] = "Linux"
    os_version: Optional[str] = "Ubuntu 22.04 LTS"
    agent_version: Optional[str] = "1.0.0"

class EndpointResponse(BaseModel):
    id: int
    hostname: str
    ip_address: str
    mac_address: Optional[str]
    os_type: str
    os_version: str
    agent_version: str
    status: str
    last_heartbeat: datetime
    risk_score: int
    alert_count: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Detection Rule Schemas ---
class DetectionRuleResponse(BaseModel):
    id: int
    rule_id: str
    name: str
    description: str
    category: str
    severity: str
    is_enabled: bool
    logic_type: str
    threshold: int
    time_window_seconds: int
    mitre_technique: str
    mitre_tactic: str
    recommended_action: str
    trigger_count: int
    last_triggered_at: Optional[datetime]
    parameters: Optional[str]

    class Config:
        from_attributes = True

class DetectionRuleUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    threshold: Optional[int] = None
    time_window_seconds: Optional[int] = None
    severity: Optional[str] = None
    recommended_action: Optional[str] = None

class RuleTestRequest(BaseModel):
    sample_event: EventIngest

# --- Automated Response Schemas ---
class ResponseActionResponse(BaseModel):
    id: int
    action_id: str
    action_type: str
    target: str
    execution_mode: str
    status: str
    triggering_alert_id: Optional[str]
    triggering_incident_id: Optional[str]
    proposed_by: str
    executed_by: Optional[str]
    executed_at: Optional[datetime]
    expires_at: Optional[datetime]
    is_reversed: bool
    output_details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ResponseApprovalAction(BaseModel):
    notes: Optional[str] = None

# --- Audit Log Schemas ---
class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    actor: str
    action: str
    resource_type: str
    resource_id: Optional[str]
    outcome: str
    ip_address: Optional[str]
    details: Optional[str]

    class Config:
        from_attributes = True

# --- Settings & Wazuh Schemas ---
class WazuhConfig(BaseModel):
    enabled: bool
    api_url: str
    username: str
    password: Optional[str] = None

class ResponseModeConfig(BaseModel):
    mode: str  # simulation, approval_required, lab_enforcement

# --- Dashboard & Metrics Schemas ---
class DashboardSummary(BaseModel):
    total_events: int
    total_alerts: int
    critical_alerts: int
    high_alerts: int
    active_incidents: int
    monitored_endpoints: int
    online_endpoints: int
    threats_today: int
    responses_executed: int
    pending_approvals: int
    system_health: Dict[str, Any]
