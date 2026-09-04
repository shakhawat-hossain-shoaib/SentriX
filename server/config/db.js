const mysql = require('mysql2/promise');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let dbDriver = 'mysql';
let mysqlPool = null;
let sqlJsDb = null;
let sqliteFilePath = null;

// Persist SQLite database to disk
function persistSqlite() {
  if (sqlJsDb && sqliteFilePath) {
    try {
      const data = sqlJsDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(sqliteFilePath, buffer);
    } catch (e) {
      console.error('[DB] Error persisting SQLite file:', e.message);
    }
  }
}

// Initialize Database Connection
async function initDatabase() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'sentrix_db';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);

  // Attempt MySQL connection first
  try {
    const tempPool = mysql.createPool({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      port: dbPort,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2000
    });

    const connection = await tempPool.getConnection();
    connection.release();
    mysqlPool = tempPool;
    dbDriver = 'mysql';
    console.log(`[DB] Connected successfully to MySQL database "${dbName}" at ${dbHost}:${dbPort}`);
    return;
  } catch (mysqlErr) {
    console.warn(`[DB] MySQL connection not active (${mysqlErr.message}).`);
    console.log(`[DB] Initializing embedded persistent SQLite storage (sql.js engine)...`);
  }

  // Fallback to sql.js
  try {
    const SQL = await initSqlJs();
    const dbDir = path.resolve(__dirname, '../../database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    sqliteFilePath = path.join(dbDir, 'sentrix.sqlite');

    let isNew = true;
    if (fs.existsSync(sqliteFilePath)) {
      const fileBuffer = fs.readFileSync(sqliteFilePath);
      sqlJsDb = new SQL.Database(fileBuffer);
      isNew = false;
    } else {
      sqlJsDb = new SQL.Database();
    }

    dbDriver = 'sqlite';

    // Check if tables exist
    const checkRes = sqlJsDb.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    if (isNew || checkRes.length === 0 || checkRes[0].values.length === 0) {
      console.log(`[DB] Bootstrapping schema and initial seed data...`);
      bootstrapSqlite(sqlJsDb);
      persistSqlite();
    }

    console.log(`[DB] Embedded SQLite storage active at: ${sqliteFilePath}`);
  } catch (err) {
    console.error(`[DB] Fatal error initializing database:`, err);
    throw err;
  }
}

function bootstrapSqlite(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role_id INTEGER NOT NULL DEFAULT 1,
      status TEXT DEFAULT 'ACTIVE',
      avatar_url TEXT DEFAULT NULL,
      department TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS incident_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      severity_default TEXT DEFAULT 'MEDIUM',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      severity TEXT DEFAULT 'MEDIUM',
      risk_score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'REPORTED',
      assigned_to INTEGER DEFAULT NULL,
      url TEXT DEFAULT NULL,
      sender_email TEXT DEFAULT NULL,
      detected_factors TEXT DEFAULT NULL,
      resolved_at DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES incident_categories(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      uploaded_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS iocs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      risk_score INTEGER DEFAULT 0,
      report_count INTEGER DEFAULT 1,
      first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(type, value)
    );

    CREATE TABLE IF NOT EXISTS incident_iocs (
      incident_id INTEGER NOT NULL,
      ioc_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (incident_id, ioc_id),
      FOREIGN KEY (incident_id) REFERENCES incidents(id),
      FOREIGN KEY (ioc_id) REFERENCES iocs(id)
    );

    CREATE TABLE IF NOT EXISTS investigation_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      analyst_id INTEGER NOT NULL,
      note TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id),
      FOREIGN KEY (analyst_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS incident_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      old_status TEXT DEFAULT NULL,
      new_status TEXT NOT NULL,
      changed_by INTEGER NOT NULL,
      notes TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id),
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS incident_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL,
      assigned_to INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'INFO',
      incident_id INTEGER DEFAULT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (incident_id) REFERENCES incidents(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id INTEGER DEFAULT NULL,
      details TEXT DEFAULT NULL,
      ip_address TEXT DEFAULT NULL,
      user_agent TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Seed default data
  const hash = '$2a$10$YVrtJto5rgwoBgWsT2NGveQ2U9yEJ3h/QDzZ2xs83En6ZNBLB6EJW'; // password123

  db.run(`INSERT OR IGNORE INTO roles (id, name, description) VALUES (1, 'USER', 'Campus Student or Staff Member who reports cybersecurity threats');`);
  db.run(`INSERT OR IGNORE INTO roles (id, name, description) VALUES (2, 'ANALYST', 'Security Operations Center (SOC) Analyst who investigates and mitigates incidents');`);
  db.run(`INSERT OR IGNORE INTO roles (id, name, description) VALUES (3, 'ADMIN', 'Platform Administrator with system-wide privileges, user management, and audit access');`);

  db.run(`INSERT OR IGNORE INTO users (id, name, email, password_hash, role_id, status, department) VALUES (1, 'Abid Khan', 'gisankhan299@gmail.com', '${hash}', 1, 'ACTIVE', 'Computer Science & Engineering');`);
  db.run(`INSERT OR IGNORE INTO users (id, name, email, password_hash, role_id, status, department) VALUES (2, 'Partha Sharma', 'parthas.ratul@gmail.com', '${hash}', 2, 'ACTIVE', 'Cybersecurity Operations Unit');`);
  db.run(`INSERT OR IGNORE INTO users (id, name, email, password_hash, role_id, status, department) VALUES (3, 'Shoaib', 'shakhawat.cse.20230104081@aust.edu', '${hash}', 2, 'ACTIVE', 'Threat Intelligence & Analysis');`);
  db.run(`INSERT OR IGNORE INTO users (id, name, email, password_hash, role_id, status, department) VALUES (4, 'Hasan', 'hasan307.x@gmail.com', '${hash}', 3, 'ACTIVE', 'Information Security Directorate');`);
  db.run(`INSERT OR IGNORE INTO users (id, name, email, password_hash, role_id, status, department) VALUES (5, 'Student Demo', 'student@campus.edu', '${hash}', 1, 'ACTIVE', 'Department of Electrical Engineering');`);
  db.run(`INSERT OR IGNORE INTO users (id, name, email, password_hash, role_id, status, department) VALUES (6, 'Analyst Demo', 'analyst@campus.edu', '${hash}', 2, 'ACTIVE', 'SOC Tier-1 Team');`);
  db.run(`INSERT OR IGNORE INTO users (id, name, email, password_hash, role_id, status, department) VALUES (7, 'Admin Demo', 'admin@campus.edu', '${hash}', 3, 'ACTIVE', 'IT & Security Operations');`);

  const categories = [
    [1, 'Phishing', 'Deceptive emails, fake portal links, credential harvesting scams', 'HIGH'],
    [2, 'Malware', 'Viruses, ransomware, trojans, suspicious malicious attachments or executables', 'CRITICAL'],
    [3, 'Account Compromise', 'Unauthorized account login, password reset anomalies, hijacked sessions', 'HIGH'],
    [4, 'Suspicious Website', 'Fake portals, copycat domains, typosquatting campus URLs', 'MEDIUM'],
    [5, 'Social Engineering', 'Impersonation of university professors/staff, phone pretexting, fake awards', 'MEDIUM'],
    [6, 'Data Leakage', 'Sensitive student records, exam questions, or credentials exposed publicly', 'CRITICAL'],
    [7, 'Scam/Fraud', 'Cryptocurrency scams, fake job offers, wire transfer requests targeting students', 'MEDIUM'],
    [8, 'Unauthorized Access', 'Brute force attempts, abnormal network scanning, intrusion alarms', 'HIGH'],
    [9, 'Other', 'General suspicious cybersecurity anomaly or uncategorized issue', 'LOW']
  ];

  for (const [id, name, desc, sev] of categories) {
    db.run(`INSERT OR IGNORE INTO incident_categories (id, name, description, severity_default) VALUES (?, ?, ?, ?)`, [id, name, desc, sev]);
  }

  const iocs = [
    [1, 'URL', 'http://fake-university-login.example.com/auth/login.php', 87, 7],
    [2, 'DOMAIN', 'fake-university-login.example.com', 85, 7],
    [3, 'IP', '198.51.100.23', 80, 5],
    [4, 'EMAIL', 'security-alert@univ-verify-desk.net', 75, 4],
    [5, 'HASH', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 95, 2],
    [6, 'URL', 'http://185.220.101.5/malware/update.exe', 92, 3],
    [7, 'DOMAIN', 'campus-scholarship-grants.top', 70, 3]
  ];

  for (const [id, type, val, score, count] of iocs) {
    db.run(`INSERT OR IGNORE INTO iocs (id, type, value, risk_score, report_count) VALUES (?, ?, ?, ?, ?)`, [id, type, val, score, count]);
  }

  // Incidents
  const inc1Factors = JSON.stringify(["Urgency keywords detected", "Account suspension threat", "Credential harvesting language", "Suspicious unverified domain", "No HTTPS encryption"]);
  db.run(`
    INSERT OR IGNORE INTO incidents (id, reporter_id, title, description, category_id, severity, risk_score, status, assigned_to, url, sender_email, detected_factors, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    1, 5, 'URGENT! Account Suspension Warning with Fake Portal Link',
    'Received an urgent email stating: URGENT! Your university account will be suspended within 24 hours. Verify your account at: http://fake-university-login.example.com/auth/login.php immediately to prevent losing student email access.',
    1, 'HIGH', 87, 'INVESTIGATING', 3,
    'http://fake-university-login.example.com/auth/login.php',
    'security-alert@univ-verify-desk.net',
    inc1Factors,
    '2026-09-08 14:01:00', '2026-09-08 14:15:00'
  ]);

  const inc2Factors = JSON.stringify(["IP-based URL indicator", "Suspicious executable file reference", "Known high-risk subnet", "Phishing pretext"]);
  db.run(`
    INSERT OR IGNORE INTO incidents (id, reporter_id, title, description, category_id, severity, risk_score, status, assigned_to, url, sender_email, detected_factors, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    2, 1, 'Malicious Attachment in Scholarship Email',
    'A message claimed I won an international research stipend. The attached zip file contained an invoice executable that tried to bypass Windows Defender.',
    2, 'CRITICAL', 92, 'REPORTED', null,
    'http://185.220.101.5/malware/update.exe',
    'stipend-grant@international-scholarship.top',
    inc2Factors,
    '2026-09-09 09:30:00', '2026-09-09 09:30:00'
  ]);

  const inc3Factors = JSON.stringify(["Brute force pattern detected", "Abnormal geolocation login anomaly", "Repeated credential failure"]);
  db.run(`
    INSERT OR IGNORE INTO incidents (id, reporter_id, title, description, category_id, severity, risk_score, status, assigned_to, url, sender_email, detected_factors, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    3, 5, 'Multiple Failed Login Attempts Followed by Password Reset Alert',
    'My campus portal showed 14 failed login attempts originating from IP 198.51.100.23 at 3:00 AM, followed by an unauthorized password reset SMS request.',
    3, 'HIGH', 78, 'CONTAINED', 2,
    null, null,
    inc3Factors,
    '2026-09-07 11:15:00', '2026-09-07 16:40:00'
  ]);

  const inc4Factors = JSON.stringify(["Suspicious top-level domain (.top)", "Personal data harvesting", "Recent domain registration indicator"]);
  db.run(`
    INSERT OR IGNORE INTO incidents (id, reporter_id, title, description, category_id, severity, risk_score, status, assigned_to, url, sender_email, detected_factors, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    4, 1, 'Typosquatted Portal Page: campus-scholarship-grants.top',
    'Found a link circulated in student WhatsApp group claiming to distribute laptop stipends via campus-scholarship-grants.top asking for student ID and NID numbers.',
    4, 'MEDIUM', 65, 'TRIAGE', 3,
    'https://campus-scholarship-grants.top/apply',
    'noreply@campus-scholarship-grants.top',
    inc4Factors,
    '2026-09-09 15:45:00', '2026-09-09 16:00:00'
  ]);

  const inc5Factors = JSON.stringify(["Evil twin / rogue AP signature", "HTTP credential capture", "Campus SSID impersonation"]);
  db.run(`
    INSERT OR IGNORE INTO incidents (id, reporter_id, title, description, category_id, severity, risk_score, status, assigned_to, url, sender_email, detected_factors, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    5, 5, 'Rogue Access Point Detected in Central Library',
    'Detected an unencrypted open Wi-Fi network named Campus_Free_HighSpeed_Secure redirecting users to a fake router login page.',
    5, 'HIGH', 74, 'RESOLVED', 2,
    'http://192.168.1.1/login.html', null,
    inc5Factors,
    '2026-09-06 10:20:00', '2026-09-07 14:00:00'
  ]);

  const inc6Factors = JSON.stringify(["PII data exposure", "Unauthorized publication of educational records"]);
  db.run(`
    INSERT OR IGNORE INTO incidents (id, reporter_id, title, description, category_id, severity, risk_score, status, assigned_to, url, sender_email, detected_factors, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    6, 1, 'Exposed Student Directory Spreadsheet on Public Cloud Drive',
    'Discovered a public Google Drive spreadsheet containing student emails, phone numbers, and CGPAs shared in a student group.',
    6, 'CRITICAL', 88, 'RESOLVED', 3,
    'https://drive.google.com/open?id=demo_leak_123', null,
    inc6Factors,
    '2026-09-05 13:00:00', '2026-09-06 18:30:00'
  ]);

  // Incident IOC links
  db.run(`INSERT OR IGNORE INTO incident_iocs (incident_id, ioc_id) VALUES (1, 1);`);
  db.run(`INSERT OR IGNORE INTO incident_iocs (incident_id, ioc_id) VALUES (1, 2);`);
  db.run(`INSERT OR IGNORE INTO incident_iocs (incident_id, ioc_id) VALUES (1, 4);`);
  db.run(`INSERT OR IGNORE INTO incident_iocs (incident_id, ioc_id) VALUES (2, 5);`);
  db.run(`INSERT OR IGNORE INTO incident_iocs (incident_id, ioc_id) VALUES (2, 6);`);
  db.run(`INSERT OR IGNORE INTO incident_iocs (incident_id, ioc_id) VALUES (3, 3);`);
  db.run(`INSERT OR IGNORE INTO incident_iocs (incident_id, ioc_id) VALUES (4, 7);`);

  // Investigation notes
  db.run(`INSERT OR IGNORE INTO investigation_notes (id, incident_id, analyst_id, note, created_at) VALUES (1, 1, 3, 'Initial triage complete. The domain fake-university-login.example.com was registered 48 hours ago. DNS records resolve to known phishing bulletproof hosting.', '2026-09-08 14:08:00');`);
  db.run(`INSERT OR IGNORE INTO investigation_notes (id, incident_id, analyst_id, note, created_at) VALUES (2, 1, 3, 'Confirmed phishing attempt targeting campus users. Domain submitted to campus perimeter firewall blocklist and threat feed.', '2026-09-08 14:15:00');`);
  db.run(`INSERT OR IGNORE INTO investigation_notes (id, incident_id, analyst_id, note, created_at) VALUES (3, 3, 2, 'Temporarily locked affected student account. Triggered mandatory multi-factor authentication reset. No unauthorized exfiltration detected.', '2026-09-07 13:20:00');`);
  db.run(`INSERT OR IGNORE INTO investigation_notes (id, incident_id, analyst_id, note, created_at) VALUES (4, 5, 2, 'Network engineering dispatched to Central Library 2nd floor. Rogue router located and disconnected from physical ethernet wall jack.', '2026-09-07 13:45:00');`);
  db.run(`INSERT OR IGNORE INTO investigation_notes (id, incident_id, analyst_id, note, created_at) VALUES (5, 6, 3, 'Contacted repository owner. Link access revoked and access logs audited. Incident resolved.', '2026-09-06 18:00:00');`);

  // History
  db.run(`INSERT OR IGNORE INTO incident_status_history (id, incident_id, old_status, new_status, changed_by, notes, created_at) VALUES (1, 1, 'REPORTED', 'TRIAGE', 3, 'Automated risk scoring completed. Triaged by Analyst Shoaib', '2026-09-08 14:02:00');`);
  db.run(`INSERT OR IGNORE INTO incident_status_history (id, incident_id, old_status, new_status, changed_by, notes, created_at) VALUES (2, 1, 'TRIAGE', 'INVESTIGATING', 3, 'Assigned to Analyst Shoaib for deep indicator inspection', '2026-09-08 14:05:00');`);
  db.run(`INSERT OR IGNORE INTO incident_status_history (id, incident_id, old_status, new_status, changed_by, notes, created_at) VALUES (3, 3, 'REPORTED', 'INVESTIGATING', 2, 'Investigating brute force IP telemetry', '2026-09-07 11:30:00');`);
  db.run(`INSERT OR IGNORE INTO incident_status_history (id, incident_id, old_status, new_status, changed_by, notes, created_at) VALUES (4, 3, 'INVESTIGATING', 'CONTAINED', 2, 'User session invalidated and attacker IP blocked', '2026-09-07 16:40:00');`);
  db.run(`INSERT OR IGNORE INTO incident_status_history (id, incident_id, old_status, new_status, changed_by, notes, created_at) VALUES (5, 5, 'REPORTED', 'INVESTIGATING', 2, 'Dispatched campus security and network team', '2026-09-06 11:00:00');`);
  db.run(`INSERT OR IGNORE INTO incident_status_history (id, incident_id, old_status, new_status, changed_by, notes, created_at) VALUES (6, 5, 'INVESTIGATING', 'RESOLVED', 2, 'Rogue physical AP confiscated and decommissioned', '2026-09-07 14:00:00');`);
  db.run(`INSERT OR IGNORE INTO incident_status_history (id, incident_id, old_status, new_status, changed_by, notes, created_at) VALUES (7, 6, 'REPORTED', 'INVESTIGATING', 3, 'Analyzing cloud drive permissions and data sensitivity', '2026-09-05 13:30:00');`);
  db.run(`INSERT OR IGNORE INTO incident_status_history (id, incident_id, old_status, new_status, changed_by, notes, created_at) VALUES (8, 6, 'INVESTIGATING', 'RESOLVED', 3, 'Public link deactivated and security advisory published', '2026-09-06 18:30:00');`);

  // Notifications
  db.run(`INSERT OR IGNORE INTO notifications (id, user_id, title, message, type, incident_id, is_read, created_at) VALUES (1, 5, 'Incident Under Investigation', 'Your report #1 ("URGENT! Account Suspension Warning") is being investigated by Analyst Shoaib.', 'INFO', 1, 0, '2026-09-08 14:05:00');`);
  db.run(`INSERT OR IGNORE INTO notifications (id, user_id, title, message, type, incident_id, is_read, created_at) VALUES (2, 3, 'New High-Risk Incident Assigned', 'Incident #1 has a risk score of 87 and has been assigned to your queue.', 'WARNING', 1, 1, '2026-09-08 14:05:00');`);
  db.run(`INSERT OR IGNORE INTO notifications (id, user_id, title, message, type, incident_id, is_read, created_at) VALUES (3, 5, 'Incident Resolved', 'Your report #5 ("Rogue Access Point") has been marked as RESOLVED by the SOC team.', 'SUCCESS', 5, 1, '2026-09-07 14:00:00');`);
  db.run(`INSERT OR IGNORE INTO notifications (id, user_id, title, message, type, incident_id, is_read, created_at) VALUES (4, 1, 'Incident Under Review', 'Your report #2 ("Malicious Attachment") was flagged as CRITICAL risk score 92.', 'ALERT', 2, 0, '2026-09-09 09:31:00');`);

  // Audit logs
  db.run(`INSERT OR IGNORE INTO audit_logs (id, user_id, action, entity, entity_id, details, ip_address, created_at) VALUES (1, 5, 'CREATE', 'incident', 1, '{"title": "URGENT! Account Suspension Warning", "risk_score": 87}', '10.10.12.45', '2026-09-08 14:01:00');`);
  db.run(`INSERT OR IGNORE INTO audit_logs (id, user_id, action, entity, entity_id, details, ip_address, created_at) VALUES (2, 3, 'STATUS_UPDATE', 'incident', 1, '{"old_status": "REPORTED", "new_status": "INVESTIGATING"}', '10.10.1.5', '2026-09-08 14:05:00');`);
  db.run(`INSERT OR IGNORE INTO audit_logs (id, user_id, action, entity, entity_id, details, ip_address, created_at) VALUES (3, 3, 'NOTE_ADD', 'investigation_notes', 1, '{"note_preview": "Initial triage complete..."}', '10.10.1.5', '2026-09-08 14:08:00');`);
  db.run(`INSERT OR IGNORE INTO audit_logs (id, user_id, action, entity, entity_id, details, ip_address, created_at) VALUES (4, 2, 'STATUS_UPDATE', 'incident', 5, '{"old_status": "INVESTIGATING", "new_status": "RESOLVED"}', '10.10.1.8', '2026-09-07 14:00:00');`);
  db.run(`INSERT OR IGNORE INTO audit_logs (id, user_id, action, entity, entity_id, details, ip_address, created_at) VALUES (5, 4, 'SYSTEM_LOGIN', 'auth', 4, '{"role": "ADMIN", "login_status": "SUCCESS"}', '10.10.0.2', '2026-09-10 09:00:00');`);
}

/**
 * Unified Database Query Runner
 * Works across both MySQL and sql.js seamlessly.
 */
async function query(sql, params = []) {
  if (dbDriver === 'mysql' && mysqlPool) {
    return await mysqlPool.query(sql, params);
  }

  // SQLite execution via sql.js
  if (!sqlJsDb) {
    throw new Error('Database is not initialized');
  }

  const cleanParams = params.map(p => (p === undefined ? null : p));
  const trimmedSql = sql.trim();
  const isSelect = /^(SELECT|PRAGMA|WITH)/i.test(trimmedSql);

  try {
    if (isSelect) {
      const stmt = sqlJsDb.prepare(trimmedSql);
      stmt.bind(cleanParams);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return [rows, []];
    } else {
      sqlJsDb.run(trimmedSql, cleanParams);

      // Retrieve last insert ID and affected rows BEFORE export/persist
      const lastIdRes = sqlJsDb.exec("SELECT last_insert_rowid() as id, changes() as affected");
      let insertId = 0;
      let affectedRows = 0;
      if (lastIdRes.length > 0 && lastIdRes[0].values.length > 0) {
        insertId = lastIdRes[0].values[0][0];
        affectedRows = lastIdRes[0].values[0][1];
      }

      persistSqlite();

      return [{ insertId, affectedRows, changedRows: affectedRows }, []];
    }
  } catch (err) {
    console.error(`[DB Query Error] ${err.message}\nSQL: ${trimmedSql}\nParams:`, cleanParams);
    throw err;
  }
}

async function logAuditEvent({ userId = null, action, entity, entityId = null, details = null, ipAddress = null }) {
  try {
    const detailsStr = typeof details === 'object' && details !== null ? JSON.stringify(details) : details;
    await query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [userId, action, entity, entityId, detailsStr, ipAddress]
    );
  } catch (err) {
    // If MySQL fallback syntax datetime('now') fails, try CURRENT_TIMESTAMP
    try {
      const detailsStr = typeof details === 'object' && details !== null ? JSON.stringify(details) : details;
      await query(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, action, entity, entityId, detailsStr, ipAddress]
      );
    } catch (e) {
      console.error('[Audit Log Error]:', e.message);
    }
  }
}

async function createNotification({ userId, title, message, type = 'INFO', incidentId = null }) {
  try {
    await query(
      `INSERT INTO notifications (user_id, title, message, type, incident_id, is_read) VALUES (?, ?, ?, ?, ?, 0)`,
      [userId, title, message, type, incidentId]
    );
  } catch (err) {
    console.error('[Notification Error]:', err.message);
  }
}

async function execute(sql, params = []) {
  return query(sql, params);
}

function getDriver() {
  return dbDriver;
}

module.exports = {
  initDatabase,
  query,
  execute,
  getDriver,
  logAuditEvent,
  createNotification
};
