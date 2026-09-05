# Database Architecture & Schema — SentriX

SentriX uses a dual-engine architecture capable of running against **MySQL 8.0+** or an **embedded persistent SQLite engine** (`sql.js`).

---

## 1. Entity Relationship Overview

```text
    roles ──< users ──< incidents ──< evidence
                │            │
                │            ├──< incident_iocs >── iocs
                │            ├──< investigation_notes
                │            ├──< incident_status_history
                │            └──< incident_assignments
                │
                ├──< notifications
                └──< audit_logs
```

---

## 2. Table Specifications

### 2.1 `roles`
Defines system access privileges (`USER` [Student/Staff], `ANALYST` [SOC], `ADMIN` [System Administrator]).

### 2.2 `users`
User credentials, department, activation status (`ACTIVE`, `INACTIVE`, `SUSPENDED`), and bcrypt password hashes.

### 2.3 `incident_categories`
Classification types (Phishing, Malware, Account Compromise, Suspicious Website, Social Engineering, Data Leakage, Scam/Fraud, Unauthorized Access, Other).

### 2.4 `incidents`
Central incident reports storing reporter ID, title, description, category ID, automated `severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), computed `risk_score` (0–100), lifecycle `status` (`REPORTED`, `TRIAGE`, `INVESTIGATING`, `CONTAINED`, `RESOLVED`), assignee, target URL, and JSON list of `detected_factors`.

### 2.5 `evidence`
Uploaded attachment metadata, file paths (`/uploads/...`), MIME types, file sizes, and uploading user reference.

### 2.6 `iocs` & `incident_iocs`
Many-to-many relationship mapping Indicators of Compromise (`URL`, `DOMAIN`, `IP`, `EMAIL`, `HASH`) to incidents with cumulative occurrence frequency counters and first/last seen timestamps.

### 2.7 `investigation_notes`
Analyst notes, findings, and mitigation actions taken during active investigations.

### 2.8 `incident_status_history`
Chronological audit of status transitions (`old_status` → `new_status`), changing analyst, and transition notes.

### 2.9 `audit_logs`
Immutable record of security-critical actions (logins, incident creations, status overrides, severity modifications, user promotions, and IP addresses).
