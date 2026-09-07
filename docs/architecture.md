# System Architecture — SentriX

SentriX is a web-based Campus Cybersecurity Incident Reporting and Mini-Security Operations Center (SOC) platform designed to detect, triage, analyze, and mitigate cyber threats across university environments.

---

## 1. High-Level Architecture

```text
                                  React Client (Vite)
                            [Student / Analyst / Admin]
                                         │
                                         │ REST API / JWT
                                         ▼
                                Express.js Backend
                 ┌───────────────────────┼────────────────────────┐
                 ▼                       ▼                        ▼
       Authentication & RBAC     Cybersecurity Engine        Dual Database Engine
         - JWT Verification       - IOC Extractor             - MySQL (Default target)
         - Role Authorization     - URL Heuristic Analyzer    - Embedded Persistent SQLite
         - Audit Trail Dispatch   - Phishing Content NLP      - Automatic Seed & Schema
                                  - Multi-Signal Risk Scorer
```

---

## 2. Core Subsystems

### 2.1 React Frontend & UI/UX (Person 1)
- **Student Incident Reporting Portal**: Real-time form with heuristic pre-scanning as the user types, evidence file attachment, and incident tracking.
- **SOC Analyst Console**: Incident triage queue, multi-dimensional filtering, deep incident dossier, investigation notes thread, timeline visualizer, and status controls (`TRIAGE` → `INVESTIGATING` → `CONTAINED` → `RESOLVED`).
- **Administrative Command Center**: Real-time threat classification distributions, severity matrices, mean resolution time tracking, user role assignment, and immutable forensic audit logs.
- **Threat Intelligence Sandbox**: Interactive ad-hoc analysis modal allowing analysts to test URLs and messages on the fly.

### 2.2 Express Backend & Security (Person 2)
- REST API layer secured with **Helmet** HTTP headers, **CORS** origin control, and **Express Rate Limiting**.
- Secure evidence upload management using **Multer**.
- Password hashing with **bcryptjs** (salt rounds = 10) and stateless token authorization with **JSON Web Tokens (JWT)**.

### 2.3 Cybersecurity Analysis Engine (Person 3)
- **IOC Extraction**: Extracts URLs, domain names, IPv4 addresses, email addresses, and MD5/SHA-256 hashes.
- **URL Risk Analyzer**: 10 rule-based security heuristics detecting IP hosts, long URLs, redirect masking, suspicious TLDs (`.top`, `.xyz`, etc.), excessive subdomains, shorteners, credential keywords, and insecure protocols.
- **Phishing & Social Engineering Engine**: Scans text for urgency, account suspension pretexts, credential harvesting language, and campus authority impersonation.
- **Multi-Signal Risk Scoring**: Weighs URL scores, content triggers, category baseline weights, and historical IOC recurrence into a unified 0–100 risk score classified as `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.

### 2.4 Data Architecture & Governance (Person 4)
- **Dual-Engine Storage**: Connects to MySQL when available; automatically falls back to persistent embedded SQLite (`database/sentrix.sqlite`) for frictionless out-of-the-box evaluation.
- **Relational Schema**: 12 normalized tables managing users, roles, incidents, evidence, IOCs, incident-IOC links, notes, status history, assignments, notifications, and audit logs.
