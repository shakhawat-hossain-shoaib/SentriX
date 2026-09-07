# REST API Specification — SentriX

All API routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new campus user account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `POST` | `/api/auth/logout` | Authenticated | Terminate session & log audit trail |
| `GET` | `/api/auth/demo-accounts` | Public | Fetch test accounts for 1-click evaluation |

---

## 2. Incident Management (`/api/incidents`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/incidents` | Authenticated | List incidents (students see own; analysts see all) |
| `POST` | `/api/incidents` | Authenticated | Submit report; triggers automated security engine |
| `GET` | `/api/incidents/:id` | Authenticated | Retrieve complete incident dossier & timeline |
| `PUT` | `/api/incidents/:id/status` | Analyst/Admin | Update lifecycle status (`TRIAGE`, `RESOLVED`, etc.) |
| `PUT` | `/api/incidents/:id/severity` | Analyst/Admin | Override incident severity |
| `PUT` | `/api/incidents/:id/assign` | Analyst/Admin | Assign incident to an analyst |
| `POST` | `/api/incidents/:id/notes` | Analyst/Admin | Add investigation note |
| `POST` | `/api/incidents/:id/evidence` | Authenticated | Upload additional evidence file |
| `GET` | `/api/incidents/categories` | Authenticated | List active incident classification categories |

---

## 3. Threat Intelligence & IOCs (`/api/iocs`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/iocs` | Analyst/Admin | Query threat indicators (URL, DOMAIN, IP, EMAIL, HASH) |
| `GET` | `/api/iocs/:id` | Analyst/Admin | Retrieve IOC details and correlated incidents |

---

## 4. Threat Sandbox Scanner (`/api/analysis`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/analysis/inspect` | Public/Auth | On-demand URL, text, and email threat analyzer |

---

## 5. SOC Analytics (`/api/analytics`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/analytics/overview` | Analyst/Admin | Summary KPIs, severity, and category distributions |
| `GET` | `/api/analytics/trends` | Analyst/Admin | Monthly incident progression |
| `GET` | `/api/analytics/resolution-time` | Analyst/Admin | Mean time to resolve calculations |

---

## 6. User Management & Audit (`/api/users`, `/api/audit-logs`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users` | Analyst/Admin | List campus users and assigned tickets |
| `PATCH` | `/api/users/:id/status` | Admin | Toggle account status (`ACTIVE` / `SUSPENDED`) |
| `PATCH` | `/api/users/:id/role` | Admin | Change role (`USER`, `ANALYST`, `ADMIN`) |
| `GET` | `/api/audit-logs` | Admin | Search immutable forensic activity trail |
| `GET` | `/api/notifications` | Authenticated | Retrieve user notifications & alerts |
| `PATCH` | `/api/notifications/read-all` | Authenticated | Mark all notifications as read |
