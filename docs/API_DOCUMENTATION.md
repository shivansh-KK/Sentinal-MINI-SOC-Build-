# SENTINEL SOC — REST API & WebSocket Documentation
## Security Operations and Automated Incident Response Platform

**Base URL**: `http://localhost:8000`  
**Interactive Swagger UI**: `http://localhost:8000/docs`  
**OpenAPI Specification**: `http://localhost:8000/openapi.json`  
**Real-Time WebSocket**: `ws://localhost:8000/ws`

---

## 🔐 Authentication & Headers

SENTINEL SOC implements stateless JSON Web Token (JWT) Bearer authentication for all secured routes.

### Authorization Header Format
```http
Authorization: Bearer <your_access_token>
```

### Role-Based Access Control (RBAC) Matrix
- **`admin`**: Full access to all endpoints, configuration, playbook execution, and rule testing.
- **`analyst`**: Access to alerts triage, incident investigation, notes, response approvals, and reporting.
- **`viewer`**: Read-only observability on dashboards, events, network views, and audit logs.

---

## 1. Authentication Router (`/api/auth`)

### 1.1 Authenticate & Obtain JWT Token
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth Required**: None

#### Request Body (JSON)
```json
{
  "username": "admin",
  "password": "SentinelAdmin2026!"
}
```

#### Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "usr-01",
    "username": "admin",
    "email": "admin@sentinel.internal",
    "role": "admin",
    "full_name": "Chief Security Architect"
  }
}
```

### 1.2 Get Current User Profile
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth Required**: Yes (`admin`, `analyst`, `viewer`)

---

## 2. Dashboard Router (`/api/dashboard`)

### 2.1 Get Situation Room Summary Metrics
- **Method**: `GET`
- **Path**: `/api/dashboard/summary`
- **Auth Required**: Yes

#### Response (200 OK)
```json
{
  "total_events": 14280,
  "active_alerts": 7,
  "open_incidents": 2,
  "critical_threats": 1,
  "monitored_endpoints": 4,
  "system_health_score": 94,
  "response_mode": "simulation",
  "mitre_coverage_percentage": 87.5
}
```

### 2.2 Get Time-Series Event & Threat Trends
- **Method**: `GET`
- **Path**: `/api/dashboard/trends?hours=24`
- **Auth Required**: Yes

#### Response (200 OK)
```json
[
  { "timestamp": "2026-11-21T00:00:00Z", "events": 450, "threats": 2 },
  { "timestamp": "2026-11-21T01:00:00Z", "events": 620, "threats": 5 }
]
```

---

## 3. Security Events Router (`/api/events`)

### 3.1 Ingest Normalized Security Event
- **Method**: `POST`
- **Path**: `/api/events/`
- **Auth Required**: Yes (or valid Agent API Key)

#### Request Body (JSON)
```json
{
  "timestamp": "2026-11-21T12:00:00Z",
  "source": "auth_daemon",
  "event_type": "auth_failure",
  "severity": "medium",
  "source_ip": "192.168.1.105",
  "destination_ip": "192.168.1.50",
  "destination_port": 22,
  "user": "root",
  "endpoint_id": "ep-ubuntu-01",
  "raw_data": "Failed password for invalid user root from 192.168.1.105 port 54322 ssh2",
  "tags": ["authentication", "ssh"]
}
```

#### Response (201 Created)
```json
{
  "id": "evt-7721",
  "status": "ingested",
  "processed_at": "2026-11-21T12:00:00.120Z",
  "detection_triggered": true,
  "alert_generated_id": "alt-8812"
}
```

### 3.2 Query & Paginate Ingested Events
- **Method**: `GET`
- **Path**: `/api/events/?page=1&limit=50&severity=high&event_type=auth_failure`
- **Auth Required**: Yes

---

## 4. Alerts Router (`/api/alerts`)

### 4.1 List Security Alerts
- **Method**: `GET`
- **Path**: `/api/alerts/?status=open&severity=critical`
- **Auth Required**: Yes

### 4.2 Analyst Actions on Alerts
- **Method**: `POST`
- **Paths**:
  - `/api/alerts/{id}/acknowledge` — Marks alert as acknowledged by analyst
  - `/api/alerts/{id}/investigate` — Associates alert with an incident and escalates
  - `/api/alerts/{id}/resolve` — Resolves alert with closing remarks
  - `/api/alerts/{id}/false-positive` — Suppresses alert and updates detection telemetry

---

## 5. Incidents Router (`/api/incidents`)

### 5.1 List Correlated Incidents
- **Method**: `GET`
- **Path**: `/api/incidents/`
- **Auth Required**: Yes

### 5.2 Get Incident Details & Timeline
- **Method**: `GET`
- **Path**: `/api/incidents/{id}`
- **Auth Required**: Yes

#### Response (200 OK)
```json
{
  "id": "inc-4401",
  "title": "Brute Force Attack escalating to Lateral Movement",
  "severity": "critical",
  "status": "active",
  "created_at": "2026-11-21T10:15:00Z",
  "primary_source_ip": "192.168.1.105",
  "associated_alerts": [
    { "id": "alt-8812", "rule_name": "Brute Force Login", "severity": "high" },
    { "id": "alt-8815", "rule_name": "Lateral Movement Attempt", "severity": "critical" }
  ],
  "analyst_notes": [
    { "author": "analyst", "note": "Attacker observed probing internal SMB shares.", "timestamp": "2026-11-21T10:20:00Z" }
  ]
}
```

### 5.3 Append Analyst Investigation Note
- **Method**: `POST`
- **Path**: `/api/incidents/{id}/notes`
- **Auth Required**: Yes (`admin`, `analyst`)
- **Body**: `{"note": "Firewall block validated. Host isolated."}`

---

## 6. SOAR Automated Response Router (`/api/response`)

### 6.1 List Response Playbooks
- **Method**: `GET`
- **Path**: `/api/response/playbooks`
- **Auth Required**: Yes

### 6.2 Get / Set Response Mode
- **Method**: `GET` / `POST`
- **Path**: `/api/response/mode`
- **Auth Required**: Yes (`admin` only for POST)
- **Body**: `{"mode": "simulation" | "approval_required" | "lab_enforcement"}`

### 6.3 Approve / Rollback Playbook Action
- **Method**: `POST`
- **Paths**:
  - `/api/response/actions/{id}/approve` — Approves pending remediation action
  - `/api/response/actions/{id}/reject` — Rejects remediation action
  - `/api/response/actions/{id}/rollback` — Executes inverse command and restores host state

---

## 7. Detection Rules Router (`/api/detection-rules`)

### 7.1 List Detection Rules
- **Method**: `GET`
- **Path**: `/api/detection-rules/`
- **Auth Required**: Yes

### 7.2 Toggle Rule Status
- **Method**: `PATCH`
- **Path**: `/api/detection-rules/{id}`
- **Auth Required**: Yes (`admin`)
- **Body**: `{"is_enabled": false}`

### 7.3 Rule Live Test Bench
- **Method**: `POST`
- **Path**: `/api/detection-rules/test`
- **Auth Required**: Yes (`admin`)
- **Body**: Submits sample synthetic event object; returns matching rule status and evaluation outcome.

---

## 8. Demo Lab Simulation Router (`/api/demo`)

### 8.1 Trigger Controlled Attack Simulation
- **Method**: `POST`
- **Path**: `/api/demo/simulate`
- **Auth Required**: Yes (`admin`, `analyst`)

#### Request Body
```json
{
  "scenario": "brute_force"
}
```
*Supported Scenarios: `brute_force`, `port_scan`, `sql_injection`, `xss`, `privilege_escalation`, `lateral_movement`, `data_exfiltration`*

### 8.2 Reset Demo State
- **Method**: `POST`
- **Path**: `/api/demo/reset`
- **Auth Required**: Yes (`admin`)

---

## 9. Reports & Audit Router (`/api/reports` & `/api/audit`)

### 9.1 Generate Executive Report Summary
- **Method**: `GET`
- **Path**: `/api/reports/summary?days=7`

### 9.2 Export Incident Dataset (CSV)
- **Method**: `GET`
- **Path**: `/api/reports/export?format=csv`
- **Response**: Binary stream containing RFC-4180 compliant CSV document.

---

## 10. Real-Time WebSockets (`ws://localhost:8000/ws`)

Clients establish a persistent WebSocket connection to receive real-time push events without polling.

### Sample Inbound Frame (Broadcast to Analysts)
```json
{
  "type": "NEW_ALERT",
  "data": {
    "alert_id": "alt-9921",
    "rule_name": "SQL Injection Attempt",
    "mitre_id": "T1190",
    "severity": "critical",
    "source_ip": "192.168.1.180",
    "timestamp": "2026-11-21T12:05:32Z"
  }
}
```

### Event Message Types
- `NEW_EVENT`: Live event normalization notification.
- `NEW_ALERT`: Detection engine triggered an alert.
- `INCIDENT_UPDATE`: Incident status transition or note added.
- `RESPONSE_ACTION`: Automated playbook execution or approval required.
