# SENTINEL SOC — Capstone Examiner Demonstration Guide
## 20-Minute Live Presentation & Technical Walkthrough Script

> **Platform Tagline**: *"Detect. Investigate. Respond. Protect."*  
> **Target Audience**: Capstone Examination Board, Academic Evaluators, and Industry Assessors.

---

## ⏱️ Presentation Timeline Overview

| Section | Topic | Allocated Time | Target Screen |
|---|---|---|---|
| **0.0** | Pre-Flight System Check | 5 min prior | Desktop / Command Prompts |
| **1.0** | Introduction & Design System | 2 Minutes | Login Page (`/login`) |
| **2.0** | Executive Situation Room | 3 Minutes | Dashboard (`/`) |
| **3.0** | Real-Time Ingestion & Threat Detection | 4 Minutes | Demo Lab (`/demo`) & Live Monitor (`/monitor`) |
| **4.0** | Incident Investigation & Kill-Chain | 4 Minutes | Alerts (`/alerts`) & Investigation (`/investigation`) |
| **5.0** | SOAR Playbooks & Safety Enforcement | 3 Minutes | Automated Response (`/response`) |
| **6.0** | System Health, Auditing & Reporting | 2 Minutes | Reports (`/reports`) & Settings (`/settings`) |
| **7.0** | Board Q&A & Technical Defence | 2 Minutes | Architecture & Codebase |

---

## 🛠️ Pre-Flight Demonstration Checklist

Perform these steps 5 minutes before the evaluators join:
1. Double-click `start_sentinel_soc.bat` from the project root.
2. Confirm two Command Prompt windows open:
   - Window 1: `Uvicorn running on http://0.0.0.0:8000` (FastAPI)
   - Window 2: `VITE v5.4 ready in ... Local: http://localhost:5173/`
3. Confirm browser opens to `http://localhost:5173/login`.
4. Ensure the green **Backend Online** and **WebSocket Connected** indicators are illuminated in the top bar.

---

## 1.0 Introduction & Design System (2 Minutes)

### Screen: `/login`

#### Action:
Display the dark glassmorphic login interface. Show the three quick-fill credential buttons (`Admin`, `Analyst`, `Viewer`).

#### Spoken Script:
> *"Distinguished members of the examination committee, welcome to the demonstration of **SENTINEL SOC: Security Operations and Automated Incident Response Platform**.
>
> In modern cybersecurity, Security Operations Centers face alert fatigue, delayed triaging, and manual response bottlenecks. SENTINEL SOC was designed as a production-grade mini-SOC that bridges this gap by unifying real-time event streaming, heuristic threat detection mapped to the MITRE ATT&CK framework, and a safety-first SOAR automated remediation engine.
>
> The user interface was engineered using a custom glassmorphism design system — featuring deep midnight navy surfaces, neon cyan status accents, and backdrop blur filters — inspired by mission-critical aerospace and cybersecurity operations command centers.
>
> Let us log in with full Administrator credentials."*

#### Action:
Click **Admin** quick-login button, then click **Sign In to Platform**.

---

## 2.0 Executive Situation Room (3 Minutes)

### Screen: `/` (Dashboard)

#### Action:
Point out the top KPI metric cards, the dual-spline event traffic chart, the resource allocation bars, the radial system gauges, and the threat heatmap.

#### Spoken Script:
> *"Upon authentication, the security analyst is presented with the Executive Situation Room. 
> 
> Across the top, high-priority vitals provide instantaneous situational awareness: Total Ingested Events, Active Alerts, Correlated Incidents, and Critical Threats.
>
> In the primary visualization zone, we observe our dual-spline time-series chart showing incoming telemetry versus correlated anomalies over a 24-hour sliding window.
>
> Below, our radial gauges measure real-time System Health Score (currently at 94%) and Data Stream Integrity. To the right, our 5x10 Threat Activity Heatmap aggregates detections across the MITRE ATT&CK tactical matrix, giving analysts an immediate visual representation of attacker focus areas.
>
> All cards, widgets, and charts on this screen are connected live to our FastAPI backend via WebSockets — as new events occur, these metrics mutate without page refresh."*

---

## 3.0 Real-Time Ingestion & Threat Detection (4 Minutes)

### Screen: `/demo` ➔ `/monitor`

#### Action:
1. Click **Demo Lab** on the left navigation bar.
2. Highlight the 7 real-world attack scenarios available.
3. Select **SSH Brute Force Attack** and click **Run Simulation**.
4. Immediately navigate to **Live Threat Monitor** (`/monitor`).

#### Spoken Script:
> *"To demonstrate our event ingestion and detection pipeline, we navigate to the Demo Lab. Here we have 7 controlled simulation scenarios covering brute force, port scans, SQL injection, XSS, privilege escalation, lateral movement, and data exfiltration.
>
> Let us trigger an active **SSH Brute Force Attack** against internal host `192.168.1.50`.
>
> Switching immediately to the Live Threat Monitor, we observe the low-latency WebSocket stream in action. Notice the series of six rapid authentication failure events streaming directly into our table. 
> 
> In the backend, our sliding-window detection engine is evaluating these events in real time. Because the incoming stream breached our threshold of 5 failed authentications within 60 seconds from the same source IP, Detection Rule T1110 immediately fired."*

#### Action:
Click any event row to open the **SlideOver Drawer** and show the parsed metadata and raw log payload.

---

## 4.0 Incident Investigation & Kill-Chain (4 Minutes)

### Screen: `/alerts` ➔ `/incidents` ➔ `/investigation`

#### Action:
1. Navigate to **Alerts** (`/alerts`).
2. Show the newly generated `CRITICAL` alert for the brute force attack.
3. Click **Investigate** on the alert.
4. Navigate to **Incidents** (`/incidents`), then to **Investigation** (`/investigation`).

#### Spoken Script:
> *"In the Alerts triage queue, we see the generated alert with its MITRE ATT&CK identifier, severity, and host context. Rather than leaving analysts to sift through fragmented alerts, SENTINEL SOC's correlation engine automatically clustered related alerts into an Incident File.
>
> Navigating to the **Investigation Workspace**, we see the full chronological timeline of the breach. Notice our MITRE ATT&CK Kill-Chain progression visualizer: it maps the incident from Initial Access through Credential Access.
>
> On the right, the analyst has an integrated forensic notebook to append observations. Let us record that we have verified the source IP as hostile."*

#### Action:
Type `"Hostile IP identified: 192.168.1.105. Initiating containment."` into the notebook and click **Add Note**. Show that it appends to the immutable timeline.

---

## 5.0 SOAR Playbooks & Safety Enforcement (3 Minutes)

### Screen: `/response` (Automated Response)

#### Action:
Navigate to **Automated Response**. Show the three operating modes (`Simulation`, `Approval Required`, `Lab Enforcement`).

#### Spoken Script:
> *"This brings us to the core differentiator of SENTINEL SOC: our Security Orchestration, Automation, and Response (SOAR) engine.
>
> Automated remediation in enterprise environments carries risk — an incorrect firewall rule could disconnect a mission-critical server. To address this, SENTINEL SOC implements three distinct operating modes:
>
> 1. **Simulation Mode**: Generates full playbook executions and audit trails without modifying operating system rules.
> 2. **Approval Required Mode**: Queues actions in a pending state until a Tier 2 analyst or SOC manager approves them.
> 3. **Lab Enforcement Mode**: Executes active operating system firewall rules (`iptables` on Linux or `netsh` on Windows).
>
> Crucially, our backend enforces strict **RFC1918 Private IP safety guardrails**: even in enforcement mode, public IP ranges and local loopback addresses are systematically rejected to prevent network isolation disasters.
>
> Notice our Rollback Ledger below. Every action executed by the platform records its mathematical inverse. If a host was blocked in error, the analyst can click **Rollback Action** to immediately restore connectivity."*

#### Action:
Click **Rollback Action** on the latest action to demonstrate instant remediation reversal.

---

## 6.0 System Health, Auditing & Reporting (2 Minutes)

### Screen: `/reports` ➔ `/audit`

#### Action:
1. Navigate to **Reports** (`/reports`).
2. Click **Export CSV** to demonstrate instant compliance reporting.
3. Navigate to **Audit Logs** (`/audit`).

#### Spoken Script:
> *"For regulatory compliance and executive reporting, SENTINEL SOC provides on-demand aggregation reports with one-click RFC-4180 CSV export.
>
> Furthermore, every analyst click, API key generation, rule modification, and playbook execution is recorded in an immutable, cryptographically timestamped Audit Log table.
>
> This guarantees full accountability and non-repudiation across the entire incident response lifecycle."*

---

## 7.0 Board Q&A & Technical Defense (2 Minutes)

### Anticipated Questions & Model Responses:

#### Q1: "Why did you choose SQLite for development instead of forcing PostgreSQL?"
> **Answer**: *"For rapid evaluation and zero-dependency reproducibility during capstone assessment, SQLite allows the entire platform to boot without requiring external daemon configuration. However, our backend is built entirely on SQLAlchemy 2.0 ORM with Alembic migrations — switching to production PostgreSQL is achieved simply by updating the `DATABASE_URL` environment variable, with Docker Compose already preconfigured for Postgres 15."*

#### Q2: "How does your sliding-window detection algorithm handle memory spikes?"
> **Answer**: *"The detection engine employs in-memory bounded circular deques combined with timestamp filtering. Cooldown periods ensure that duplicate events within a configurable cooldown window are aggregated into hit counters rather than allocating new alert objects, preventing memory leaks during volumetric attacks."*

#### Q3: "What prevents the SOAR engine from blocking the analyst's own workstation?"
> **Answer**: *"The response engine includes hardcoded safety guardrails: loopback addresses (`127.0.0.1`), default gateway IPs, and configured SOC analyst subnets are whitelisted in the core configuration, immediately dropping any isolation playbook targeting protected infrastructure."*

---

> **Conclusion**: *"Thank you for your time and evaluation. I would be pleased to answer any further questions or inspect specific code modules."*
