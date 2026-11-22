import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.models import Event, Alert, Incident, ResponseAction, AuditLog

client = TestClient(app)

def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["platform"] == "SENTINEL SOC"
    assert data["status"] == "OPERATIONAL"

    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"

def test_auth_login_and_me():
    # Admin login
    res = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "SentinelAdmin2026!"
    })
    assert res.status_code == 200
    token_data = res.json()
    assert "access_token" in token_data
    assert token_data["role"] == "admin"

    token = token_data["access_token"]
    # Get current user profile
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["username"] == "admin"
    assert res_me.json()["role"] == "admin"

def test_dashboard_summary():
    res = client.get("/api/v1/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_events" in data
    assert "total_alerts" in data
    assert "active_incidents" in data
    assert "system_health" in data

def test_event_ingestion_and_brute_force_detection():
    # Submit 6 failed login attempts from test IP 192.168.56.99
    test_ip = "192.168.56.99"
    for i in range(6):
        res = client.post("/api/v1/events/ingest", json={
            "source": "linux-auth",
            "hostname": "ubuntu-lab-01",
            "source_ip": test_ip,
            "destination_ip": "192.168.56.10",
            "source_port": 50000 + i,
            "destination_port": 22,
            "protocol": "TCP",
            "event_type": "failed_login",
            "category": "authentication",
            "severity": "medium",
            "username": "root",
            "message": f"Failed password attempt {i+1} from {test_ip}"
        })
        assert res.status_code == 200

    # Verify alerts generated
    res_alerts = client.get(f"/api/v1/alerts?source_ip={test_ip}")
    assert res_alerts.status_code == 200
    alerts = res_alerts.json()
    assert len(alerts) >= 1
    alert = alerts[0]
    assert alert["rule_id"] == "DET-001"
    assert alert["source_ip"] == test_ip

    # Verify incident created
    res_incidents = client.get(f"/api/v1/incidents?source_ip={test_ip}")
    assert res_incidents.status_code == 200
    incidents = res_incidents.json()
    assert len(incidents) >= 1
    incident_id = incidents[0]["incident_id"]

    # Test adding analyst note
    res_note = client.post(f"/api/v1/incidents/{incident_id}/notes", json={
        "note": "Analyst verified malicious brute-force activity. Block verified."
    })
    assert res_note.status_code == 200
    assert "Analyst verified" in res_note.json()["investigation_notes"]

def test_automated_response_and_rollback():
    # Verify response actions
    res = client.get("/api/v1/response/actions")
    assert res.status_code == 200
    actions = res.json()
    assert len(actions) >= 1

    action = actions[0]
    action_id = action["action_id"]

    # Test rollback
    res_rollback = client.post(f"/api/v1/response/actions/{action_id}/rollback")
    assert res_rollback.status_code == 200
    data = res_rollback.json()
    assert data["is_reversed"] is True
    assert data["status"] == "rolled_back"

def test_demo_simulations():
    # Test port scan simulation
    res_scan = client.post("/api/v1/demo/simulate/port-scan", params={
        "target_host": "ubuntu-lab-02",
        "attacker_ip": "192.168.56.180"
    })
    assert res_scan.status_code == 200
    assert res_scan.json()["status"] == "success"

    # Test suspicious process simulation
    res_proc = client.post("/api/v1/demo/simulate/suspicious-process", params={
        "target_host": "ubuntu-lab-01",
        "command": "powershell -enc JABzACAAPQAgAE4AZQB3AC0ATwBiAGo..."
    })
    assert res_proc.status_code == 200
    assert res_proc.json()["status"] == "success"

def test_audit_logs():
    res = client.get("/api/v1/audit-logs")
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) > 0
