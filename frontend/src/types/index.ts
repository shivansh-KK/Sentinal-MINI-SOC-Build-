export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'analyst' | 'viewer';
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface SecurityEvent {
  id: number;
  timestamp: string;
  source: string;
  hostname: string;
  source_ip?: string;
  destination_ip?: string;
  source_port?: number;
  destination_port?: number;
  protocol: string;
  event_type: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  username?: string;
  process_name?: string;
  process_id?: number;
  command_line?: string;
  message: string;
  raw_log?: string;
  is_reviewed: boolean;
  is_synthetic: boolean;
  created_at: string;
}

export interface Alert {
  id: number;
  alert_id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'false_positive';
  source_ip?: string;
  destination_ip?: string;
  hostname?: string;
  rule_id: string;
  rule_name: string;
  related_event_count: number;
  risk_score: number;
  recommended_response?: string;
  analyst_notes?: string;
  assigned_to?: string;
  first_detected_at: string;
  last_detected_at: string;
  resolved_at?: string;
  created_at: string;
}

export interface Incident {
  id: number;
  incident_id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  source_ip?: string;
  affected_endpoint?: string;
  assigned_to?: string;
  investigation_notes?: string;
  resolution_summary?: string;
  containment_time?: string;
  resolved_time?: string;
  created_at: string;
  updated_at: string;
}

export interface Endpoint {
  id: number;
  hostname: string;
  ip_address: string;
  mac_address?: string;
  os_type: string;
  os_version: string;
  agent_version: string;
  status: 'online' | 'offline' | 'warning' | 'under_investigation';
  last_heartbeat: string;
  risk_score: number;
  alert_count: number;
  created_at: string;
}

export interface DetectionRule {
  id: number;
  rule_id: string;
  name: string;
  description: string;
  category: string;
  severity: string;
  is_enabled: boolean;
  logic_type: string;
  threshold: number;
  time_window_seconds: number;
  mitre_technique: string;
  mitre_tactic: string;
  recommended_action: string;
  trigger_count: number;
  last_triggered_at?: string;
  parameters?: string;
}

export interface ResponseAction {
  id: number;
  action_id: string;
  action_type: string;
  target: string;
  execution_mode: 'simulation' | 'approval_required' | 'lab_enforcement';
  status: 'pending_approval' | 'approved' | 'rejected' | 'executed' | 'failed' | 'rolled_back';
  triggering_alert_id?: string;
  triggering_incident_id?: string;
  proposed_by: string;
  executed_by?: string;
  executed_at?: string;
  expires_at?: string;
  is_reversed: boolean;
  output_details?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  outcome: string;
  ip_address?: string;
  details?: string;
}

export interface DashboardSummary {
  total_events: number;
  total_alerts: number;
  critical_alerts: number;
  high_alerts: number;
  active_incidents: number;
  monitored_endpoints: number;
  online_endpoints: number;
  threats_today: number;
  responses_executed: number;
  pending_approvals: number;
  health_score: number;
  data_integrity: number;
  system_health: {
    backend: string;
    database: string;
    detection_engine: string;
    ingestion_engine: string;
    websocket: string;
    wazuh_integration: string;
  };
}
