# SENTINEL SOC — Database Architecture Specification

## 1. Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ audit_logs : generates
    endpoints ||--o{ events : hosts
    endpoints ||--o{ alerts : affects
    events ||--o{ incident_events : links
    alerts ||--o{ incident_alerts : links
    incidents ||--o{ incident_events : contains
    incidents ||--o{ incident_alerts : contains
    incidents ||--o{ response_actions : triggers
    response_actions ||--o{ response_approvals : requires
    detection_rules ||--o{ alerts : generates

    users {
        int id PK
        string username UK
        string email UK
        string hashed_password
        string role
        boolean is_active
        datetime last_login
    }

    endpoints {
        int id PK
        string hostname UK
        string ip_address
        string os_type
        string os_version
        string agent_version
        string status
        datetime last_heartbeat
        int risk_score
        int alert_count
    }

    events {
        int id PK
        datetime timestamp
        string source
        string hostname
        string source_ip
        string destination_ip
        int source_port
        int destination_port
        string protocol
        string event_type
        string category
        string severity
        string message
        text raw_log
    }

    detection_rules {
        int id PK
        string rule_id UK
        string name
        string category
        string severity
        boolean is_enabled
        string logic_type
        int threshold
        int time_window_seconds
        string mitre_technique
        string mitre_tactic
        string recommended_action
        int trigger_count
    }

    alerts {
        int id PK
        string alert_id UK
        string title
        text description
        string severity
        string status
        string source_ip
        string hostname
        string rule_id
        string rule_name
        int risk_score
        string recommended_response
        text analyst_notes
    }

    incidents {
        int id PK
        string incident_id UK
        string title
        text description
        string severity
        string status
        string source_ip
        string affected_endpoint
        string assigned_to
        text investigation_notes
        text resolution_summary
        datetime containment_time
        datetime resolved_time
    }

    response_actions {
        int id PK
        string action_id UK
        string action_type
        string target
        string execution_mode
        string status
        string triggering_alert_id
        string triggering_incident_id
        string proposed_by
        string executed_by
        boolean is_reversed
        text output_details
    }
```

---

## 2. Table Specifications

### 1. `users`
Stores analyst, administrator, and auditor credentials, roles, and status. Passwords are cryptographically salted using bcrypt.

### 2. `endpoints`
Maintains hardware, networking, and OS telemetry for all monitored endpoints. Updated via periodic heartbeats.

### 3. `events`
Stores normalized log telemetry. Indexed on `(source_ip, timestamp)` and `(hostname, timestamp)` for high-throughput sub-millisecond query evaluation.

### 4. `detection_rules`
Defines the 8 detection algorithms, MITRE ATT&CK mappings, thresholds, and time windows.

### 5. `alerts`
Security alert cases created when detection criteria are satisfied. Includes risk scoring (0-100) and lifecycle statuses (`new`, `acknowledged`, `investigating`, `resolved`, `false_positive`).

### 6. `incidents`
Correlated incidents clustering related alerts and events by attacker IP, target host, and time proximity.

### 7. `incident_events` & 8. `incident_alerts`
Junction tables maintaining relational integrity between incidents, raw telemetry events, and alerts.

### 9. `response_playbooks`
Configuration templates for automated SOAR containment playbooks (`PB-001`, `PB-002`, `PB-003`).

### 10. `response_actions`
Log of every proposed, approved, executed, and rolled-back containment action.

### 11. `response_approvals`
Authorizations and rejection decisions recorded during Approval-Required mode.

### 12. `audit_logs`
Append-only immutable audit trail recording user logins, rule updates, response actions, and system changes.

### 13. `api_keys`
Hashed API tokens for endpoint agents.

### 14. `system_settings`
Dynamic key-value storage for global response modes (`simulation`, `approval_required`, `lab_enforcement`), retention policies, and Wazuh connector parameters.

### 15. `file_integrity_records`
Monitored system configuration baselines and SHA-256 cryptographic checksums.
