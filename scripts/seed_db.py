import sys
import os
import datetime
import uuid

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.database import SessionLocal, engine, Base
from backend.app.core.security import get_password_hash
from backend.app.models.models import (
    User, Endpoint, DetectionRule, ResponsePlaybook, SystemSetting, ApiKey, Event, Alert, Incident, IncidentAlert, IncidentEvent, ResponseAction
)

def seed_database():
    print("[*] Creating database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Users
        print("[*] Seeding default users...")
        if not db.query(User).filter(User.username == "admin").first():
            db.add_all([
                User(
                    username="admin",
                    email="admin@sentinel-soc.local",
                    hashed_password=get_password_hash("SentinelAdmin2026!"),
                    full_name="Chief Information Security Officer",
                    role="admin",
                    is_active=True
                ),
                User(
                    username="analyst",
                    email="analyst@sentinel-soc.local",
                    hashed_password=get_password_hash("SentinelAnalyst2026!"),
                    full_name="Senior SOC Analyst Tier-2",
                    role="analyst",
                    is_active=True
                ),
                User(
                    username="viewer",
                    email="viewer@sentinel-soc.local",
                    hashed_password=get_password_hash("SentinelViewer2026!"),
                    full_name="Compliance Auditor & Viewer",
                    role="viewer",
                    is_active=True
                )
            ])
            db.commit()

        # 2. Detection Rules
        print("[*] Seeding 8 core threat detection rules...")
        rules_data = [
            {
                "rule_id": "DET-001",
                "name": "SSH Brute-Force Authentication Attack",
                "description": "Detects repeated failed SSH authentication attempts from a single source IP exceeding threshold within time window.",
                "category": "authentication",
                "severity": "high",
                "logic_type": "threshold_window",
                "threshold": 5,
                "time_window_seconds": 60,
                "mitre_technique": "T1110",
                "mitre_tactic": "Credential Access",
                "recommended_action": "Execute automated IP block and verify sshd configuration"
            },
            {
                "rule_id": "DET-002",
                "name": "Successful Login After Multiple Failures",
                "description": "Detects compromised credentials indicated by successful authentication immediately following failed login attempts from same IP.",
                "category": "authentication",
                "severity": "critical",
                "logic_type": "sequence",
                "threshold": 3,
                "time_window_seconds": 180,
                "mitre_technique": "T1078",
                "mitre_tactic": "Initial Access",
                "recommended_action": "Isolate account session, force password reset & investigate source IP"
            },
            {
                "rule_id": "DET-003",
                "name": "Port Reconnaissance & Service Discovery",
                "description": "Identifies rapid network probing attempts across multiple distinct destination ports on a monitored endpoint.",
                "category": "network",
                "severity": "medium",
                "logic_type": "anomaly",
                "threshold": 4,
                "time_window_seconds": 60,
                "mitre_technique": "T1046",
                "mitre_tactic": "Discovery",
                "recommended_action": "Block source IP at lab boundary and inspect external perimeter"
            },
            {
                "rule_id": "DET-004",
                "name": "Unauthorized Privilege Escalation",
                "description": "Flags unauthorized execution of sudo, root escalation tokens, or administrator privilege abuse.",
                "category": "process",
                "severity": "critical",
                "logic_type": "pattern",
                "threshold": 1,
                "time_window_seconds": 30,
                "mitre_technique": "T1548",
                "mitre_tactic": "Privilege Escalation",
                "recommended_action": "Terminate suspicious process, revoke user token & preserve system image"
            },
            {
                "rule_id": "DET-005",
                "name": "Suspicious Process Execution & Interactive Shell",
                "description": "Detects anomalous utility spawning (netcat, mimikatz, powershell encoded commands, interactive bash shells).",
                "category": "process",
                "severity": "high",
                "logic_type": "pattern",
                "threshold": 1,
                "time_window_seconds": 30,
                "mitre_technique": "T1059",
                "mitre_tactic": "Execution",
                "recommended_action": "Mark endpoint under investigation and quarantine executable"
            },
            {
                "rule_id": "DET-006",
                "name": "Critical File Integrity Alteration",
                "description": "Detects cryptographic hash mismatch or unauthorized modification in monitored system files (/etc/passwd, hosts).",
                "category": "file_integrity",
                "severity": "high",
                "logic_type": "anomaly",
                "threshold": 1,
                "time_window_seconds": 60,
                "mitre_technique": "T1565",
                "mitre_tactic": "Impact",
                "recommended_action": "Restore file from verified baseline and conduct root-cause analysis"
            },
            {
                "rule_id": "DET-007",
                "name": "Password Spraying Campaign (Multiple Accounts)",
                "description": "Detects single source IP attempting authentication across several distinct user accounts.",
                "category": "authentication",
                "severity": "high",
                "logic_type": "threshold_window",
                "threshold": 3,
                "time_window_seconds": 120,
                "mitre_technique": "T1110.003",
                "mitre_tactic": "Credential Access",
                "recommended_action": "Enforce firewall block on source IP and alert targeted account owners"
            },
            {
                "rule_id": "DET-008",
                "name": "Anomalous Endpoint Activity Burst",
                "description": "Detects sudden statistical surge in event rate indicating ransomware activity or malicious script automation.",
                "category": "system",
                "severity": "medium",
                "logic_type": "anomaly",
                "threshold": 25,
                "time_window_seconds": 60,
                "mitre_technique": "T1496",
                "mitre_tactic": "Impact",
                "recommended_action": "Isolate host network adapter and collect live memory dump"
            }
        ]

        for r in rules_data:
            existing = db.query(DetectionRule).filter(DetectionRule.rule_id == r["rule_id"]).first()
            if not existing:
                db.add(DetectionRule(**r))
        db.commit()

        # 3. Response Playbooks
        print("[*] Seeding automated response playbooks...")
        playbooks = [
            {
                "playbook_id": "PB-001",
                "name": "SSH Brute-Force Containment",
                "description": "Automatically records/executes firewall DROP rule for aggressive login attack source IPs.",
                "trigger_rule_type": "ssh_brute_force",
                "action_type": "block_ip",
                "default_mode": "simulation",
                "cooldown_seconds": 300
            },
            {
                "playbook_id": "PB-002",
                "name": "Port Scan Interception",
                "description": "Applies network block against reconnaissance scanner source address.",
                "trigger_rule_type": "port_scan",
                "action_type": "block_ip",
                "default_mode": "simulation",
                "cooldown_seconds": 300
            },
            {
                "playbook_id": "PB-003",
                "name": "Endpoint Quarantine & Isolation",
                "description": "Marks compromised asset status as under investigation and isolates from production subnets.",
                "trigger_rule_type": "suspicious_process",
                "action_type": "isolate_endpoint",
                "default_mode": "simulation",
                "cooldown_seconds": 600
            }
        ]
        for pb in playbooks:
            if not db.query(ResponsePlaybook).filter(ResponsePlaybook.playbook_id == pb["playbook_id"]).first():
                db.add(ResponsePlaybook(**pb))
        db.commit()

        # 4. Monitored Endpoints
        print("[*] Seeding monitored laboratory endpoints...")
        endpoints_data = [
            {
                "hostname": "ubuntu-lab-01",
                "ip_address": "192.168.56.10",
                "mac_address": "08:00:27:11:A2:34",
                "os_type": "Linux",
                "os_version": "Ubuntu 22.04 LTS (Kernel 5.15)",
                "agent_version": "1.0.0",
                "status": "online",
                "risk_score": 15,
                "alert_count": 0
            },
            {
                "hostname": "ubuntu-lab-02",
                "ip_address": "192.168.56.20",
                "mac_address": "08:00:27:44:B5:78",
                "os_type": "Linux",
                "os_version": "Ubuntu 22.04 LTS",
                "agent_version": "1.0.0",
                "status": "online",
                "risk_score": 10,
                "alert_count": 0
            },
            {
                "hostname": "win-server-2022",
                "ip_address": "192.168.56.30",
                "mac_address": "08:00:27:88:C9:12",
                "os_type": "Windows",
                "os_version": "Windows Server 2022 Datacenter",
                "agent_version": "1.0.0",
                "status": "online",
                "risk_score": 25,
                "alert_count": 0
            },
            {
                "hostname": "soc-gateway-fw",
                "ip_address": "192.168.56.1",
                "mac_address": "08:00:27:EE:F0:01",
                "os_type": "Linux",
                "os_version": "Debian GNU/Linux 12",
                "agent_version": "1.0.0",
                "status": "online",
                "risk_score": 5,
                "alert_count": 0
            }
        ]
        for ep in endpoints_data:
            if not db.query(Endpoint).filter(Endpoint.hostname == ep["hostname"]).first():
                db.add(Endpoint(**ep))
        db.commit()

        # 5. System Settings
        if not db.query(SystemSetting).filter(SystemSetting.key == "response_mode").first():
            db.add(SystemSetting(key="response_mode", value="simulation", description="Default response mode"))
            db.add(SystemSetting(key="retention_days", value="30", description="Event retention period in days"))
            db.add(SystemSetting(key="wazuh_enabled", value="false", description="Wazuh external SIEM connection"))
            db.commit()

        # 6. Baseline Events & Alerts for Initial Experience
        if db.query(Event).count() == 0:
            print("[*] Seeding baseline telemetry events...")
            now = datetime.datetime.utcnow()
            sample_events = [
                Event(
                    timestamp=now - datetime.timedelta(minutes=45),
                    source="agent",
                    hostname="ubuntu-lab-01",
                    source_ip="192.168.56.5",
                    destination_ip="192.168.56.10",
                    protocol="TCP",
                    event_type="auth_success",
                    category="authentication",
                    severity="info",
                    username="analyst",
                    message="Successful SSH session opened for analyst from 192.168.56.5",
                    raw_log="sshd[4120]: Accepted publickey for analyst from 192.168.56.5 port 54122 ssh2",
                    is_synthetic=False
                ),
                Event(
                    timestamp=now - datetime.timedelta(minutes=30),
                    source="agent",
                    hostname="ubuntu-lab-02",
                    source_ip="192.168.56.20",
                    destination_ip="8.8.8.8",
                    destination_port=53,
                    protocol="UDP",
                    event_type="network_connection",
                    category="network",
                    severity="info",
                    message="Standard DNS resolution query for repo.ubuntu.com",
                    is_synthetic=False
                ),
                Event(
                    timestamp=now - datetime.timedelta(minutes=15),
                    source="agent",
                    hostname="win-server-2022",
                    source_ip="192.168.56.30",
                    event_type="process_creation",
                    category="process",
                    severity="low",
                    process_name="svchost.exe",
                    message="System maintenance background task executed",
                    is_synthetic=False
                )
            ]
            db.add_all(sample_events)
            db.commit()

        print("[+] Database initialized & seeded successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
