# SENTINEL SOC — Testing & Quality Assurance Guide
## Verification, Unit Testing, and Simulation Validation

This document provides complete instructions for executing automated tests, validating end-to-end event flows, and performing security evaluation in SENTINEL SOC.

---

## 🧪 1. Automated Test Suite (Pytest)

The platform includes an automated test suite located at `backend/tests/test_soc_backend.py`. It rigorously evaluates all critical subsystems:
- Authentication & JWT token issuance.
- Situational metrics calculation.
- Synchronous event ingestion.
- Stateful threat detection (sliding window brute-force).
- Alert lifecycle status mutations.
- Multi-alert incident correlation.
- SOAR automated remediation and rollback ledger.

### Executing Automated Tests

Open a PowerShell terminal in the project root:

```powershell
pytest backend/tests/test_soc_backend.py -v
```

### Expected Output
```text
============================= test session starts =============================
platform win32 -- Python 3.11.4, pytest-8.2.0, pluggy-1.5.0
cachedir: .pytest_cache
rootdir: C:\Users\shiva\OneDrive\Desktop\MINI SOC with Automated Response
collected 7 items

backend/tests/test_soc_backend.py::test_auth_login_and_me PASSED         [ 14%]
backend/tests/test_soc_backend.py::test_dashboard_summary PASSED         [ 28%]
backend/tests/test_soc_backend.py::test_event_ingestion_and_query PASSED  [ 42%]
backend/tests/test_soc_backend.py::test_detection_engine_brute_force PASSED [ 57%]
backend/tests/test_soc_backend.py::test_alert_lifecycle PASSED           [ 71%]
backend/tests/test_soc_backend.py::test_incident_creation_and_notes PASSED [ 85%]
backend/tests/test_soc_backend.py::test_response_engine_and_rollback PASSED [100%]

============================== 7 passed in 1.48s ==============================
```

---

## 🔍 2. Test Cases Specification

| Test Identifier | Component | Assertion Logic |
|---|---|---|
| `test_auth_login_and_me` | Identity & Access | Validates BCrypt verification against salted hash, asserts JWT access token structure, and verifies `/api/auth/me` user payload. |
| `test_dashboard_summary` | Situational Analytics | Validates aggregation queries returning `total_events`, `active_alerts`, `open_incidents`, and health score. |
| `test_event_ingestion_and_query` | Event Pipeline | Ingests raw event with custom metadata, verifies DB persistence and verifies query pagination. |
| `test_detection_engine_brute_force` | Detection Engine | Submits 5 rapid `auth_failure` events from a single IP, asserting that the sliding-window rule fires an alert with MITRE ID `T1110`. |
| `test_alert_lifecycle` | Alert Management | Tests status transition: `new` ➔ `acknowledged` ➔ `resolved`. |
| `test_incident_creation_and_notes` | Incident Forensics | Creates correlated incident, appends analyst investigation notes, and asserts immutable timeline ordering. |
| `test_response_engine_and_rollback` | SOAR & Rollback | Executes simulated IP block playbook, verifies action record in DB, triggers rollback, and verifies inverse execution. |

---

## 🛠 3. Manual Testing via Demo Lab

The easiest way to validate the full stack visually is through the **Demo Lab** interface (`/demo`):

1. **Launch Platform**: Double-click `start_sentinel_soc.bat`.
2. **Login**: Click **Admin** on the login page (`http://localhost:5173/login`).
3. **Navigate to Demo Lab**: Click **Demo Lab** on the left navigation sidebar.
4. **Trigger Simulation**: Click **Run Simulation** on **SSH Brute Force Attack**.
5. **Verify Lifecycle**:
   - Navigate to **Live Threat Monitor** (`/monitor`) — observe 6 failed auth events arriving via WebSocket.
   - Navigate to **Alerts** (`/alerts`) — observe a new `CRITICAL` alert: *SSH Brute Force Detected (T1110)*.
   - Navigate to **Incidents** (`/incidents`) — observe that an incident was automatically created and linked to the attacker IP.
   - Navigate to **Automated Response** (`/response`) — observe the executed or pending `Block Attacker IP` action.

---

## 💻 4. Command-Line API Testing (cURL / PowerShell)

### Step 1: Obtain Auth Token
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"SentinelAdmin2026!"}'

$token = $response.access_token
$headers = @{ "Authorization" = "Bearer $token" }
```

### Step 2: Ingest Security Event via API
```powershell
$eventData = @{
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    source = "demo_curl"
    event_type = "auth_failure"
    severity = "high"
    source_ip = "192.168.1.99"
    destination_ip = "192.168.1.50"
    destination_port = 22
    user = "root"
    raw_data = "Failed password for root from 192.168.1.99"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/events/" `
  -Method Post `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $eventData
```

### Step 3: Query Alerts
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/alerts/" -Method Get -Headers $headers
```

---

## ✅ 5. End-to-End Verification Checklist

Before submitting or presenting the project, verify each item:

- [ ] Database initialised and populated (`sentinel_soc.db` exists).
- [ ] Backend starts without error on port `8000`.
- [ ] Swagger API docs render at `http://localhost:8000/docs`.
- [ ] Frontend compiles and renders at `http://localhost:5173`.
- [ ] WebSocket connects (green status indicator in top navigation).
- [ ] All 15 navigation routes load with consistent glassmorphism theme.
- [ ] Running a Demo Lab scenario updates Dashboard KPIs in real time.
- [ ] SOAR rollback successfully re-opens blocked IPs.
- [ ] CSV report download successfully downloads valid RFC-4180 data.
- [ ] All 7 automated pytest tests report `PASSED`.
