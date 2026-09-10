<div align="center">

# 🛡️ SentriX
### Campus Cybersecurity Incident Platform & Mini-SOC

[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![SQLite](https://img.shields.io/badge/SQLite-sql.js-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)

**A modern, web-based Cybersecurity Incident Reporting and Security Operations Center (SOC) platform for universities.**

[Architecture](docs/architecture.md) • [API Reference](docs/api.md) • [Database Schema](docs/database.md) • [Security Engine](docs/security-engine.md)

</div>

---

## 📖 Overview

**SentriX** bridges the gap between campus users and cybersecurity incident response teams. It enables students and faculty to report suspicious emails, links, and anomalies while empowering Security Analysts to investigate, classify, and mitigate threats using automated heuristic scoring, IOC correlation, and real-time triage dashboards.

---

## 🚀 Key Features

### 🎓 1. Student / Campus User Portal
- **Rapid Reporting**: Submit incidents with suspicious URLs, sender details, descriptions, and file evidence.
- **Live Threat Pre-Scanning**: Heuristic analysis provides real-time warning feedback as the user types.
- **Tracking & History**: Monitor the lifecycle status of submitted incidents in real time.

### 🔍 2. SOC Analyst Console
- **Triage Queue**: Filter incidents by Severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), Status, or Category.
- **Deep Investigation Dossier**:
  - Synthesized **Risk Score Gauge** (0–100) with triggered heuristic breakdowns.
  - **Correlated Indicators of Compromise (IOCs)** with recurrence frequency and risk levels.
  - **Reconstructed Investigation Timeline**: Chronological event tracking from report to resolution.
  - **Investigation Notes Thread**: Add analyst findings and mitigation steps.
  - **Lifecycle Management**: Transition states from `REPORTED` → `TRIAGE` → `INVESTIGATING` → `CONTAINED` → `RESOLVED`.
- **IOC Intelligence Explorer**: Search extracted malicious URLs, domains, IPs, emails, and hashes across all incidents.

### 📊 3. Administrative Command Center
- **SOC Metrics**: Live KPI counters, monthly progression curves, and mean time to resolve (MTTR).
- **Distribution Matrices**: Threat classification and severity charts.
- **Access Governance**: Manage roles (`USER`, `ANALYST`, `ADMIN`) and toggle active/suspended statuses.
- **Forensic Audit Trail**: Immutable logging of all security-critical system events and IP addresses.

### ⚡ 4. Cybersecurity Analysis Engine
- **IOC Extraction**: Extracts URLs, domains, IPv4 addresses, emails, and cryptographic hashes.
- **Rule-Based URL Analyzer**: Evaluates 10 heuristics (IP hosts, redirect masking, suspicious TLDs, shorteners, credential keywords, protocol security).
- **Phishing NLP Engine**: Scans text for urgency, account lockout pretexts, credential harvesting, and spoofed senders.
- **Multi-Signal Risk Scorer**: Combines signals with historical IOC repetitions to generate normalized risk telemetry.
- **Threat Intelligence Sandbox**: Dedicated playground in the navigation bar to inspect external links and files on the fly.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Lucide Icons, Modern Cyber SOC CSS Tokens |
| **Backend** | Node.js, Express.js, JWT, bcryptjs, Helmet, Multer, Rate Limiting |
| **Cyber Engine** | Rule-Based Heuristic Analyzers, IOC Extraction Regexes, Threat Correlator |
| **Database** | Dual Storage Engine: MySQL 8.0+ with automatic fallback to persistent embedded SQLite (`sql.js`) |

---

## ⚡ Quick Start & Installation

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/shakhawat-hossain-shoaib/SentriX.git
cd SentriX

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment (Optional)
A pre-configured `.env.example` is provided. If no MySQL database is running, the server automatically initializes an embedded persistent SQLite database (`database/sentrix.sqlite`) with full demo data.
```bash
cp .env.example .env
```

### 3. Run the Platform
In two separate terminals:

```bash
# Terminal 1: Start Backend API (Port 5000)
cd server
npm start

# Terminal 2: Start Frontend UI (Port 3000)
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Demo Personas (1-Click Switcher)

The platform includes pre-populated test data and an instant **Role Switcher** in the navigation header:

| Role | Email | Password | Pre-populated Scenarios |
|---|---|---|---|
| **Student Demo** | `student@campus.edu` | `password123` | Phishing Report (#1), Rogue AP Report (#5) |
| **SOC Analyst Demo** | `analyst@campus.edu` | `password123` | Active Incident Queue, Investigation Dossiers, Notes |
| **Admin Demo** | `admin@campus.edu` | `password123` | Visual Analytics, User Controls, Audit Logs |

---

## 📁 Repository Structure

```text
SentriX/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/         # Navbar, Modals, Dossier Inspector
│   │   ├── context/            # Authentication & Role State
│   │   ├── pages/              # Student, Analyst, Admin Dashboards
│   │   ├── index.css           # SOC Dark Mode Design Tokens
│   │   └── App.jsx
│   └── vite.config.js          # Reverse Proxy Configuration
├── server/                     # Express Backend & Security Engine
│   ├── config/                 # Dual Database Driver (MySQL / SQLite)
│   ├── controllers/            # Auth, Incidents, IOCs, Analytics, Users
│   ├── middleware/             # JWT, RBAC, Multer File Upload
│   ├── routes/                 # Express API Routing
│   ├── services/               # URL Analyzer, Phishing Detector, IOC Extractor
│   └── server.js               # Application Entrypoint
├── database/                   # Schema & Seed Scripts
│   ├── schema.sql              # Relational Table Definitions
│   └── seed.sql                # Demonstration Scenarios & Seed Data
├── docs/                       # Project Documentation
│   ├── architecture.md         # System Architecture & Component Flow
│   ├── api.md                  # REST API Specification
│   ├── database.md             # Schema & ER Layout
│   └── security-engine.md      # Cybersecurity Analysis Heuristics
├── .env.example
├── .gitignore
└── README.md
```

---

## 📜 License
This project is developed for educational and demonstration purposes.
