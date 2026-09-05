-- ==========================================================
-- SentriX - Campus Cybersecurity Incident Platform
-- Seed Data for Testing, Evaluation, and Demo Presentation
-- ==========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. SEED ROLES
INSERT INTO roles (id, name, description) VALUES
(1, 'USER', 'Campus Student or Staff Member who reports cybersecurity threats'),
(2, 'ANALYST', 'Security Operations Center (SOC) Analyst who investigates and mitigates incidents'),
(3, 'ADMIN', 'Platform Administrator with system-wide privileges, user management, and audit access')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. SEED USERS (password123 -> $2a$10$YVrtJto5rgwoBgWsT2NGveQ2U9yEJ3h/QDzZ2xs83En6ZNBLB6EJW)
INSERT INTO users (id, name, email, password_hash, role_id, status, department) VALUES
(1, 'Abid Khan', 'gisankhan299@gmail.com', '$2a$10$YVrtJto5rgwoBgWsT2NGveQ2U9yEJ3h/QDzZ2xs83En6ZNBLB6EJW', 1, 'ACTIVE', 'Computer Science & Engineering'),
(2, 'Partha Sharma', 'parthas.ratul@gmail.com', '$2a$10$YVrtJto5rgwoBgWsT2NGveQ2U9yEJ3h/QDzZ2xs83En6ZNBLB6EJW', 2, 'ACTIVE', 'Cybersecurity Operations Unit'),
(3, 'Shoaib', 'shakhawat.cse.20230104081@aust.edu', '$2a$10$YVrtJto5rgwoBgWsT2NGveQ2U9yEJ3h/QDzZ2xs83En6ZNBLB6EJW', 2, 'ACTIVE', 'Threat Intelligence & Analysis'),
(4, 'Hasan', 'hasan307.x@gmail.com', '$2a$10$YVrtJto5rgwoBgWsT2NGveQ2U9yEJ3h/QDzZ2xs83En6ZNBLB6EJW', 3, 'ACTIVE', 'Information Security Directorate'),
(5, 'Student Demo', 'student@campus.edu', '$2a$10$YVrtJto5rgwoBgWsT2NGveQ2U9yEJ3h/QDzZ2xs83En6ZNBLB6EJW', 1, 'ACTIVE', 'Department of Electrical Engineering'),
(6, 'Analyst Demo', 'analyst@campus.edu', '$2a$10$YVrtJto5rgwoBgWsT2NGveQ2U9yEJ3h/QDzZ2xs83En6ZNBLB6EJW', 2, 'ACTIVE', 'SOC Tier-1 Team'),
(7, 'Admin Demo', 'admin@campus.edu', '$2a$10$YVrtJto5rgwoBgWsT2NGveQ2U9yEJ3h/QDzZ2xs83En6ZNBLB6EJW', 3, 'ACTIVE', 'IT & Security Operations')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. SEED INCIDENT CATEGORIES
INSERT INTO incident_categories (id, name, description, severity_default) VALUES
(1, 'Phishing', 'Deceptive emails, fake portal links, credential harvesting scams', 'HIGH'),
(2, 'Malware', 'Viruses, ransomware, trojans, suspicious malicious attachments or executables', 'CRITICAL'),
(3, 'Account Compromise', 'Unauthorized account login, password reset anomalies, hijacked sessions', 'HIGH'),
(4, 'Suspicious Website', 'Fake portals, copycat domains, typosquatting campus URLs', 'MEDIUM'),
(5, 'Social Engineering', 'Impersonation of university professors/staff, phone pretexting, fake awards', 'MEDIUM'),
(6, 'Data Leakage', 'Sensitive student records, exam questions, or credentials exposed publicly', 'CRITICAL'),
(7, 'Scam/Fraud', 'Cryptocurrency scams, fake job offers, wire transfer requests targeting students', 'MEDIUM'),
(8, 'Unauthorized Access', 'Brute force attempts, abnormal network scanning, intrusion alarms', 'HIGH'),
(9, 'Other', 'General suspicious cybersecurity anomaly or uncategorized issue', 'LOW')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. SEED IOCs (Indicators of Compromise)
INSERT INTO iocs (id, type, value, risk_score, report_count, first_seen, last_seen) VALUES
(1, 'URL', 'http://fake-university-login.example.com/auth/login.php', 87, 7, '2026-09-01 10:00:00', '2026-09-11 12:00:00'),
(2, 'DOMAIN', 'fake-university-login.example.com', 85, 7, '2026-09-01 10:00:00', '2026-09-11 12:00:00'),
(3, 'IP', '198.51.100.23', 80, 5, '2026-09-02 14:10:00', '2026-09-10 16:30:00'),
(4, 'EMAIL', 'security-alert@univ-verify-desk.net', 75, 4, '2026-09-03 08:30:00', '2026-09-10 14:20:00'),
(5, 'HASH', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 95, 2, '2026-09-05 09:15:00', '2026-09-08 11:45:00'),
(6, 'URL', 'http://185.220.101.5/malware/update.exe', 92, 3, '2026-09-04 11:20:00', '2026-09-09 17:00:00'),
(7, 'DOMAIN', 'campus-scholarship-grants.top', 70, 3, '2026-09-06 13:00:00', '2026-09-09 18:30:00')
ON DUPLICATE KEY UPDATE value=VALUES(value);

-- 5. SEED INCIDENTS
-- Incident 1 is the Section 21 Phishing Scenario
INSERT INTO incidents (id, reporter_id, title, description, category_id, severity, risk_score, status, assigned_to, url, sender_email, detected_factors, created_at, updated_at) VALUES
(1, 5, 'URGENT! Account Suspension Warning with Fake Portal Link',
'Received an urgent email stating: URGENT! Your university account will be suspended within 24 hours. Verify your account at: http://fake-university-login.example.com/auth/login.php immediately to prevent losing student email access.',
1, 'HIGH', 87, 'INVESTIGATING', 3,
'http://fake-university-login.example.com/auth/login.php',
'security-alert@univ-verify-desk.net',
'["Urgency keywords detected", "Account suspension threat", "Credential harvesting language", "Suspicious unverified domain", "No HTTPS encryption"]',
'2026-09-08 14:01:00', '2026-09-08 14:15:00'),

(2, 1, 'Malicious Attachment in Scholarship Email',
'A message claimed I won an international research stipend. The attached zip file contained an invoice executable that tried to bypass Windows Defender.',
2, 'CRITICAL', 92, 'REPORTED', NULL,
'http://185.220.101.5/malware/update.exe',
'stipend-grant@international-scholarship.top',
'["IP-based URL indicator", "Suspicious executable file reference", "Known high-risk subnet", "Phishing pretext"]',
'2026-09-09 09:30:00', '2026-09-09 09:30:00'),

(3, 5, 'Multiple Failed Login Attempts Followed by Password Reset Alert',
'My campus portal showed 14 failed login attempts originating from IP 198.51.100.23 at 3:00 AM, followed by an unauthorized password reset SMS request.',
3, 'HIGH', 78, 'CONTAINED', 2,
NULL,
NULL,
'["Brute force pattern detected", "Abnormal geolocation login anomaly", "Repeated credential failure"]',
'2026-09-07 11:15:00', '2026-09-07 16:40:00'),

(4, 1, 'Typosquatted Portal Page: campus-scholarship-grants.top',
'Found a link circulated in student WhatsApp group claiming to distribute laptop stipends via campus-scholarship-grants.top asking for student ID and NID numbers.',
4, 'MEDIUM', 65, 'TRIAGE', 3,
'https://campus-scholarship-grants.top/apply',
'noreply@campus-scholarship-grants.top',
'["Suspicious top-level domain (.top)", "Personal data harvesting", "Recent domain registration indicator"]',
'2026-09-09 15:45:00', '2026-09-09 16:00:00'),

(5, 5, 'Rogue Access Point Detected in Central Library',
'Detected an unencrypted open Wi-Fi network named Campus_Free_HighSpeed_Secure redirecting users to a fake router login page.',
5, 'HIGH', 74, 'RESOLVED', 2,
'http://192.168.1.1/login.html',
NULL,
'["Evil twin / rogue AP signature", "HTTP credential capture", "Campus SSID impersonation"]',
'2026-09-06 10:20:00', '2026-09-07 14:00:00'),

(6, 1, 'Exposed Student Directory Spreadsheet on Public Cloud Drive',
'Discovered a public Google Drive spreadsheet containing student emails, phone numbers, and CGPAs shared in a student group.',
6, 'CRITICAL', 88, 'RESOLVED', 3,
'https://drive.google.com/open?id=demo_leak_123',
NULL,
'["PII data exposure", "Unauthorized publication of educational records"]',
'2026-09-05 13:00:00', '2026-09-06 18:30:00')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 6. INCIDENT_IOCS ASSOCIATIONS
INSERT INTO incident_iocs (incident_id, ioc_id) VALUES
(1, 1),
(1, 2),
(1, 4),
(2, 5),
(2, 6),
(3, 3),
(4, 7)
ON DUPLICATE KEY UPDATE incident_id=VALUES(incident_id);

-- 7. INVESTIGATION NOTES
INSERT INTO investigation_notes (id, incident_id, analyst_id, note, created_at) VALUES
(1, 1, 3, 'Initial triage complete. The domain fake-university-login.example.com was registered 48 hours ago. DNS records resolve to known phishing bulletproof hosting.', '2026-09-08 14:08:00'),
(2, 1, 3, 'Confirmed phishing attempt targeting campus users. Domain submitted to campus perimeter firewall blocklist and threat feed.', '2026-09-08 14:15:00'),
(3, 3, 2, 'Temporarily locked affected student account. Triggered mandatory multi-factor authentication reset. No unauthorized exfiltration detected.', '2026-09-07 13:20:00'),
(4, 5, 2, 'Network engineering dispatched to Central Library 2nd floor. Rogue router located and disconnected from physical ethernet wall jack.', '2026-09-07 13:45:00'),
(5, 6, 3, 'Contacted repository owner. Link access revoked and access logs audited. Incident resolved.', '2026-09-06 18:00:00')
ON DUPLICATE KEY UPDATE note=VALUES(note);

-- 8. STATUS HISTORY
INSERT INTO incident_status_history (incident_id, old_status, new_status, changed_by, notes, created_at) VALUES
(1, 'REPORTED', 'TRIAGE', 3, 'Automated risk scoring completed. Triaged by Analyst Shoaib', '2026-09-08 14:02:00'),
(1, 'TRIAGE', 'INVESTIGATING', 3, 'Assigned to Analyst Shoaib for deep indicator inspection', '2026-09-08 14:05:00'),
(3, 'REPORTED', 'INVESTIGATING', 2, 'Investigating brute force IP telemetry', '2026-09-07 11:30:00'),
(3, 'INVESTIGATING', 'CONTAINED', 2, 'User session invalidated and attacker IP blocked', '2026-09-07 16:40:00'),
(5, 'REPORTED', 'INVESTIGATING', 2, 'Dispatched campus security and network team', '2026-09-06 11:00:00'),
(5, 'INVESTIGATING', 'RESOLVED', 2, 'Rogue physical AP confiscated and decommissioned', '2026-09-07 14:00:00'),
(6, 'REPORTED', 'INVESTIGATING', 3, 'Analyzing cloud drive permissions and data sensitivity', '2026-09-05 13:30:00'),
(6, 'INVESTIGATING', 'RESOLVED', 3, 'Public link deactivated and security advisory published', '2026-09-06 18:30:00');

-- 9. NOTIFICATIONS
INSERT INTO notifications (user_id, title, message, type, incident_id, is_read, created_at) VALUES
(5, 'Incident Under Investigation', 'Your report #1 ("URGENT! Account Suspension Warning") is being investigated by Analyst Shoaib.', 'INFO', 1, 0, '2026-09-08 14:05:00'),
(3, 'New High-Risk Incident Assigned', 'Incident #1 has a risk score of 87 and has been assigned to your queue.', 'WARNING', 1, 1, '2026-09-08 14:05:00'),
(5, 'Incident Resolved', 'Your report #5 ("Rogue Access Point") has been marked as RESOLVED by the SOC team.', 'SUCCESS', 5, 1, '2026-09-07 14:00:00'),
(1, 'Incident Under Review', 'Your report #2 ("Malicious Attachment") was flagged as CRITICAL risk score 92.', 'ALERT', 2, 0, '2026-09-09 09:31:00');

-- 10. AUDIT LOGS
INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address, created_at) VALUES
(5, 'CREATE', 'incident', 1, '{"title": "URGENT! Account Suspension Warning", "risk_score": 87}', '10.10.12.45', '2026-09-08 14:01:00'),
(3, 'STATUS_UPDATE', 'incident', 1, '{"old_status": "REPORTED", "new_status": "INVESTIGATING"}', '10.10.1.5', '2026-09-08 14:05:00'),
(3, 'NOTE_ADD', 'investigation_notes', 1, '{"note_preview": "Initial triage complete..."}', '10.10.1.5', '2026-09-08 14:08:00'),
(2, 'STATUS_UPDATE', 'incident', 5, '{"old_status": "INVESTIGATING", "new_status": "RESOLVED"}', '10.10.1.8', '2026-09-07 14:00:00'),
(4, 'SYSTEM_LOGIN', 'auth', 4, '{"role": "ADMIN", "login_status": "SUCCESS"}', '10.10.0.2', '2026-09-10 09:00:00');

SET FOREIGN_KEY_CHECKS = 1;
