# SENTINEL SOC — Automated Incident Response (SOAR) Specification

## 1. SOAR Engine Overview

The SENTINEL Automated Incident Response Engine coordinates dynamic containment playbooks across network and endpoint layers. It operates as an independent backend service separated from the threat detection engine and UI presentation layer.

---

## 2. Three Operational Modes

```mermaid
flowchart TD
    Trigger["Threat Alert Generated"] --> Engine["Response Engine Policy Check"]
    Engine --> ModeCheck{"Current Mode?"}

    ModeCheck -->|Simulation (Default)| Mock["MockFirewallAdapter: Record DROP action without OS modifications"]
    ModeCheck -->|Approval Required| AppQueue["Queue Action as pending_approval for Analyst Sign-off"]
    ModeCheck -->|Lab Enforcement| Safety{"Lab Safety & CIDR Validation"}

    AppQueue -->|Analyst Approves| Safety
    AppQueue -->|Analyst Rejects| Rej["Log Rejection in Audit Trail"]

    Safety -->|Passed| OSFW["SystemFirewallAdapter: Apply iptables / netsh"]
    Safety -->|Failed / Public IP| Abort["Abort & Log Safety Violation"]

    Mock --> Audit["Append to Audit Log"]
    OSFW --> Audit
```

### Mode 1: Simulation Mode (Default)
- **Safe Demonstration Mode**: No OS changes or firewall configuration modifications are made.
- Records the intended command and simulated firewall rule in `response_actions` (e.g., `"[SIMULATION] Mock Firewall applied rule: DROP traffic from source IP 192.168.56.101"`).
- Updates the incident status to `contained` and broadcasts the simulation event to the UI over WebSockets.

### Mode 2: Approval-Required Mode
- Generates a proposed containment action with status `pending_approval`.
- Prompts authorized SOC analysts via the **Automated Response** dashboard with threat details, risk scores, and target assets.
- Execution occurs only after explicit analyst approval (`POST /api/v1/response/actions/{id}/approve`).

### Mode 3: Lab Enforcement Mode
- Intended strictly for authorized isolated virtualized lab environments (e.g., Ubuntu VM lab on VirtualBox/VMware).
- Applies real OS firewall rules safely:
  - **Linux**: `iptables -A INPUT -s <IP> -j DROP` using safe argument vectors (no raw `shell=True`).
  - **Windows**: `netsh advfirewall firewall add rule name=SENTINEL_BLOCK_<IP> dir=in action=block remoteip=<IP>`.

---

## 3. Strict Safety & Guardrail Architecture

To ensure university demonstration safety, the Response Engine enforces mandatory guardrails:
1. **Lab CIDR Allowlist**: Actions are restricted strictly to private RFC1918 lab subnets (`192.168.0.0/16`, `10.0.0.0/8`, `172.16.0.0/12`).
2. **Anti-Lockout Protection**: Localhost (`127.0.0.1`), gateway (`0.0.0.0`), and broadcast addresses can NEVER be blocked.
3. **No Public IP Targeting**: Public internet addresses are rejected with a safety violation error.
4. **No Arbitrary Shell Injection**: Commands are invoked using structured Python subprocess arrays (`["iptables", "-A", ...]` or `["netsh", ...]`).
5. **Reversible Rollback**: Any active block can be reversed with one click (`POST /api/v1/response/actions/{id}/rollback`), removing the corresponding `iptables` or `netsh` rule and recording the reversal in the audit ledger.
