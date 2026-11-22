# SENTINEL SOC — Detection Rules Specification

SENTINEL SOC implements an independent, modular threat detection engine designed to identify multi-stage attacks across endpoint, authentication, and network telemetry.

---

## Rule Catalog & Specifications

### DET-001: SSH Brute-Force Authentication Attack
- **Category**: Authentication
- **Default Severity**: High
- **Logic Type**: Threshold Window
- **Threshold**: $\ge 5$ failed login attempts from identical `source_ip` within $60\text{ seconds}$.
- **MITRE ATT&CK**: Technique `T1110` (Brute Force) / Tactic `Credential Access`
- **Detection Algorithm**: Queries historical events matching `event_type == 'failed_login'` and `source_ip == event.source_ip` within the configured sliding time window.
- **Recommended Action**: Propose automated firewall drop rule on attacker IP and investigate target authentication logs.

---

### DET-002: Compromised Account (Login After Multiple Failures)
- **Category**: Authentication
- **Default Severity**: Critical
- **Logic Type**: Sequence Correlation
- **Threshold**: Successful authentication (`event_type in ['auth_success', 'successful_login']`) following $\ge 3$ failed login attempts from the same `source_ip` within $180\text{ seconds}$.
- **MITRE ATT&CK**: Technique `T1078` (Valid Accounts) / Tactic `Initial Access`
- **Detection Algorithm**: Evaluates preceding authentication attempts upon successful login to identify credential stuffing or password guessing breakthroughs.
- **Recommended Action**: Force immediate account password reset, revoke active session tokens, and quarantine source IP.

---

### DET-003: Port Reconnaissance & Service Discovery Scan
- **Category**: Network
- **Default Severity**: Medium
- **Logic Type**: Distinct Port Anomaly
- **Threshold**: Probing attempts across $\ge 4$ distinct destination ports on a single monitored host within $60\text{ seconds}$.
- **MITRE ATT&CK**: Technique `T1046` (Network Service Discovery) / Tactic `Discovery`
- **Detection Algorithm**: Aggregates distinct `destination_port` values for incoming TCP/UDP connections grouped by `source_ip` and `hostname`.
- **Recommended Action**: Enforce boundary firewall drop rule on source IP.

---

### DET-004: Unauthorized Privilege Escalation
- **Category**: Process
- **Default Severity**: Critical
- **Logic Type**: Privilege Pattern Matching
- **Threshold**: Execution of `sudo /bin/su`, root elevation tokens, or unauthorized administrative shell spawning.
- **MITRE ATT&CK**: Technique `T1548` (Abuse Elevation Control Mechanism) / Tactic `Privilege Escalation`
- **Detection Algorithm**: Analyzes command-line strings and auditd telemetry for unauthorized token transitions.
- **Recommended Action**: Terminate suspicious process, revoke user credentials, and capture live memory dump.

---

### DET-005: Suspicious Process Execution & Interactive Shell
- **Category**: Process
- **Default Severity**: High
- **Logic Type**: Signature & Command Heuristics
- **Threshold**: Execution of known attack utilities: `nc -e`, `bash -i`, `powershell -enc`, `mimikatz`, `certutil -urlcache`.
- **MITRE ATT&CK**: Technique `T1059` (Command and Scripting Interpreter) / Tactic `Execution`
- **Detection Algorithm**: Inspects normalized `process_name` and `command_line` telemetry against heuristic patterns.
- **Recommended Action**: Quarantine executable, terminate parent process tree, and mark endpoint under investigation.

---

### DET-006: Critical File Integrity Breach
- **Category**: File Integrity
- **Default Severity**: High
- **Logic Type**: Cryptographic Hash Mismatch
- **Threshold**: Modification or deletion of critical system assets (e.g., `/etc/passwd`, `/etc/shadow`, `system32\drivers\etc\hosts`).
- **MITRE ATT&CK**: Technique `T1565` (Data Manipulation) / Tactic `Impact`
- **Detection Algorithm**: Compares SHA-256 file checksum against baseline stored in `file_integrity_records`.
- **Recommended Action**: Restore file from baseline and inspect endpoint for unauthorized root access.

---

### DET-007: Multi-Account Password Spraying Campaign
- **Category**: Authentication
- **Default Severity**: High
- **Logic Type**: Multi-Target Correlation
- **Threshold**: A single `source_ip` attempting authentication across $\ge 3$ distinct user accounts within $120\text{ seconds}$.
- **MITRE ATT&CK**: Technique `T1110.003` (Password Spraying) / Tactic `Credential Access`
- **Detection Algorithm**: Counts distinct `username` values associated with `failed_login` events from a single IP.
- **Recommended Action**: Apply network containment to source IP and notify affected account holders.

---

### DET-008: Anomalous Endpoint Activity Burst
- **Category**: System Anomaly
- **Default Severity**: Medium
- **Logic Type**: Statistical Surge Anomaly
- **Threshold**: Rapid surge of $\ge 25$ events within $60\text{ seconds}$ on an endpoint.
- **MITRE ATT&CK**: Technique `T1496` (Resource Hijacking) / Tactic `Impact`
- **Detection Algorithm**: Monitors event frequency rate per host to detect script-driven ransomware encryption or automated worms.
- **Recommended Action**: Isolate network interface card and review active process tree.
