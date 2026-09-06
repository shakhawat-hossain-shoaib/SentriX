/**
 * Incident Management Controller
 */

const { query, logAuditEvent, createNotification } = require('../config/db');
const { analyzeIncident, recordIncidentIocs } = require('../services/securityEngine');
const path = require('path');

/**
 * List incidents with filtering and role scoping
 */
async function listIncidents(req, res) {
  try {
    const { status, severity, category_id, search, assigned_to } = req.query;
    const userRole = (req.user.role || '').toUpperCase();

    let sql = `
      SELECT
        i.id,
        i.title,
        i.description,
        i.severity,
        i.risk_score,
        i.status,
        i.url,
        i.sender_email,
        i.detected_factors,
        i.resolved_at,
        i.created_at,
        i.updated_at,
        c.id as category_id,
        c.name as category_name,
        r.id as reporter_id,
        r.name as reporter_name,
        r.email as reporter_email,
        a.id as assignee_id,
        a.name as assignee_name
      FROM incidents i
      LEFT JOIN incident_categories c ON i.category_id = c.id
      LEFT JOIN users r ON i.reporter_id = r.id
      LEFT JOIN users a ON i.assigned_to = a.id
      WHERE 1=1
    `;

    const params = [];

    // Role-based restrictions: Students only see their own reports
    if (userRole === 'USER') {
      sql += ' AND i.reporter_id = ?';
      params.push(req.user.id);
    }

    if (status) {
      sql += ' AND i.status = ?';
      params.push(status.toUpperCase());
    }

    if (severity) {
      sql += ' AND i.severity = ?';
      params.push(severity.toUpperCase());
    }

    if (category_id) {
      sql += ' AND i.category_id = ?';
      params.push(parseInt(category_id, 10));
    }

    if (assigned_to) {
      sql += ' AND i.assigned_to = ?';
      params.push(parseInt(assigned_to, 10));
    }

    if (search && search.trim()) {
      sql += ' AND (i.title LIKE ? OR i.description LIKE ? OR i.url LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY i.created_at DESC';

    const [rows] = await query(sql, params);

    const incidents = rows.map(row => {
      let factors = [];
      try {
        factors = typeof row.detected_factors === 'string' ? JSON.parse(row.detected_factors) : (row.detected_factors || []);
      } catch (e) {
        factors = [];
      }
      return {
        ...row,
        detected_factors: factors
      };
    });

    return res.json({ success: true, count: incidents.length, incidents });
  } catch (err) {
    console.error('[List Incidents Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve incidents.', error: err.message });
  }
}

/**
 * Retrieve deep incident dossier by ID
 */
async function getIncidentById(req, res) {
  try {
    const incidentId = parseInt(req.params.id, 10);
    const userRole = (req.user.role || '').toUpperCase();

    const [rows] = await query(
      `SELECT
        i.*,
        c.name as category_name,
        r.name as reporter_name,
        r.email as reporter_email,
        r.department as reporter_department,
        a.name as assignee_name,
        a.email as assignee_email
       FROM incidents i
       LEFT JOIN incident_categories c ON i.category_id = c.id
       LEFT JOIN users r ON i.reporter_id = r.id
       LEFT JOIN users a ON i.assigned_to = a.id
       WHERE i.id = ?`,
      [incidentId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    const incident = rows[0];

    // Authorization check: User role can only view their own
    if (userRole === 'USER' && incident.reporter_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this incident report.' });
    }

    let detectedFactors = [];
    try {
      detectedFactors = typeof incident.detected_factors === 'string' ? JSON.parse(incident.detected_factors) : (incident.detected_factors || []);
    } catch (e) {
      detectedFactors = [];
    }
    incident.detected_factors = detectedFactors;

    // Fetch Associated IOCs
    const [iocs] = await query(
      `SELECT ioc.id, ioc.type, ioc.value, ioc.risk_score, ioc.report_count, ioc.first_seen, ioc.last_seen
       FROM incident_iocs ii
       JOIN iocs ioc ON ii.ioc_id = ioc.id
       WHERE ii.incident_id = ?`,
      [incidentId]
    );

    // Fetch Notes
    const [notes] = await query(
      `SELECT n.id, n.note, n.created_at, u.id as analyst_id, u.name as analyst_name, u.email as analyst_email
       FROM investigation_notes n
       JOIN users u ON n.analyst_id = u.id
       WHERE n.incident_id = ?
       ORDER BY n.created_at ASC`,
      [incidentId]
    );

    // Fetch Status History
    const [statusHistory] = await query(
      `SELECT h.id, h.old_status, h.new_status, h.notes, h.created_at, u.name as changed_by_name
       FROM incident_status_history h
       LEFT JOIN users u ON h.changed_by = u.id
       WHERE h.incident_id = ?
       ORDER BY h.created_at ASC`,
      [incidentId]
    );

    // Fetch Evidence Files
    const [evidence] = await query(
      `SELECT e.id, e.file_name, e.original_name, e.file_path, e.file_type, e.file_size, e.created_at, u.name as uploaded_by_name
       FROM evidence e
       LEFT JOIN users u ON e.uploaded_by = u.id
       WHERE e.incident_id = ?
       ORDER BY e.created_at ASC`,
      [incidentId]
    );

    // Synthesize structured timeline milestones for SOC UI
    const timeline = [];
    timeline.push({
      event: 'Incident Reported',
      timestamp: incident.created_at,
      actor: incident.reporter_name,
      badge: 'REPORTED',
      description: `Report submitted by ${incident.reporter_name} (${incident.reporter_department || 'Campus'})`
    });

    timeline.push({
      event: 'Automated Security Analysis',
      timestamp: incident.created_at,
      actor: 'SentriX Security Engine',
      badge: incident.severity,
      description: `Risk score computed at ${incident.risk_score}/100 with severity [${incident.severity}]. Extracted ${iocs.length} IOC(s).`
    });

    for (const h of statusHistory) {
      timeline.push({
        event: `Status Transition: ${h.new_status}`,
        timestamp: h.created_at,
        actor: h.changed_by_name || 'SOC Analyst',
        badge: h.new_status,
        description: h.notes || `Incident transitioned from ${h.old_status || 'INITIAL'} to ${h.new_status}`
      });
    }

    for (const n of notes) {
      timeline.push({
        event: 'Investigation Note Added',
        timestamp: n.created_at,
        actor: n.analyst_name,
        badge: 'NOTE',
        description: n.note
      });
    }

    // Sort timeline chronologically
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return res.json({
      success: true,
      incident: {
        ...incident,
        iocs,
        notes,
        status_history: statusHistory,
        evidence,
        timeline
      }
    });
  } catch (err) {
    console.error('[Get Incident Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve incident dossier.', error: err.message });
  }
}

/**
 * Create new incident report with automated cybersecurity analysis
 */
async function createIncident(req, res) {
  try {
    const { title, description, category_id, url, sender_email } = req.body;

    if (!title || !description || !category_id) {
      return res.status(400).json({ success: false, message: 'Title, description, and category are required.' });
    }

    // Look up category
    const [catRows] = await query('SELECT name, severity_default FROM incident_categories WHERE id = ?', [category_id]);
    const categoryName = catRows && catRows.length > 0 ? catRows[0].name : 'General';

    // RUN CYBERSECURITY ANALYSIS ENGINE
    const analysis = await analyzeIncident({
      title,
      description,
      url: url || '',
      senderEmail: sender_email || '',
      categoryName
    });

    const detectedFactorsJson = JSON.stringify(analysis.detectedFactors);

    // Insert Incident
    const [result] = await query(
      `INSERT INTO incidents (
        reporter_id, title, description, category_id, severity, risk_score, status, url, sender_email, detected_factors
      ) VALUES (?, ?, ?, ?, ?, ?, 'REPORTED', ?, ?, ?)`,
      [
        req.user.id,
        title.trim(),
        description.trim(),
        parseInt(category_id, 10),
        analysis.severity,
        analysis.riskScore,
        url ? url.trim() : null,
        sender_email ? sender_email.trim() : null,
        detectedFactorsJson
      ]
    );

    const incidentId = result.insertId;

    // Record and correlate IOCs
    await recordIncidentIocs(incidentId, analysis.iocs);

    // Initial status history
    await query(
      `INSERT INTO incident_status_history (incident_id, old_status, new_status, changed_by, notes)
       VALUES (?, NULL, 'REPORTED', ?, ?)`,
      [incidentId, req.user.id, `Report created. Automated threat score: ${analysis.riskScore}/100 (${analysis.severity})`]
    );

    // Handle any file uploaded in the same multipart request
    if (req.file) {
      await query(
        `INSERT INTO evidence (incident_id, file_name, original_name, file_path, file_type, file_size, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          incidentId,
          req.file.filename,
          req.file.originalname,
          `/uploads/${req.file.filename}`,
          req.file.mimetype,
          req.file.size,
          req.user.id
        ]
      );
    }

    // Notify Analysts if High or Critical risk
    if (analysis.riskScore >= 70) {
      const [analysts] = await query("SELECT id FROM users WHERE role_id = 2 AND status = 'ACTIVE'");
      for (const a of analysts) {
        await createNotification({
          userId: a.id,
          title: `New ${analysis.severity} Incident #${incidentId}`,
          message: `High risk threat detected: "${title}" (Score: ${analysis.riskScore}). Immediate triage recommended.`,
          type: 'ALERT',
          incidentId
        });
      }
    }

    // Confirmation notification to reporter
    await createNotification({
      userId: req.user.id,
      title: 'Incident Report Received',
      message: `Your report #${incidentId} ("${title}") has been received and logged in the Security Operations Center.`,
      type: 'INFO',
      incidentId
    });

    await logAuditEvent({
      userId: req.user.id,
      action: 'CREATE_INCIDENT',
      entity: 'incident',
      entityId: incidentId,
      details: { title, riskScore: analysis.riskScore, severity: analysis.severity, iocsCount: analysis.iocs.length },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Incident submitted and automatically analyzed successfully.',
      incidentId,
      analysis: {
        riskScore: analysis.riskScore,
        severity: analysis.severity,
        detectedFactors: analysis.detectedFactors,
        iocs: analysis.iocs
      }
    });
  } catch (err) {
    console.error('[Create Incident Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to create incident.', error: err.message });
  }
}

/**
 * Update incident lifecycle status (Analyst/Admin)
 */
async function updateStatus(req, res) {
  try {
    const incidentId = parseInt(req.params.id, 10);
    const { status, notes } = req.body;

    const validStatuses = ['REPORTED', 'TRIAGE', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'FALSE_POSITIVE', 'CLOSED'];
    const newStatus = (status || '').toUpperCase();

    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of [${validStatuses.join(', ')}]` });
    }

    const [current] = await query('SELECT status, reporter_id, title FROM incidents WHERE id = ?', [incidentId]);
    if (!current || current.length === 0) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    const oldStatus = current[0].status;

    if (newStatus === 'RESOLVED') {
      try {
        await query(
          "UPDATE incidents SET status = ?, resolved_at = datetime('now') WHERE id = ?",
          [newStatus, incidentId]
        );
      } catch (e) {
        await query(
          "UPDATE incidents SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?",
          [newStatus, incidentId]
        );
      }
    } else {
      await query('UPDATE incidents SET status = ? WHERE id = ?', [newStatus, incidentId]);
    }

    // Record status history
    await query(
      'INSERT INTO incident_status_history (incident_id, old_status, new_status, changed_by, notes) VALUES (?, ?, ?, ?, ?)',
      [incidentId, oldStatus, newStatus, req.user.id, notes || `Status changed from ${oldStatus} to ${newStatus}`]
    );

    // Notify Reporter
    await createNotification({
      userId: current[0].reporter_id,
      title: `Incident #${incidentId} Status Updated`,
      message: `Your incident report ("${current[0].title}") status was updated to ${newStatus}.`,
      type: newStatus === 'RESOLVED' ? 'SUCCESS' : 'INFO',
      incidentId
    });

    await logAuditEvent({
      userId: req.user.id,
      action: 'UPDATE_STATUS',
      entity: 'incident',
      entityId: incidentId,
      details: { oldStatus, newStatus, notes },
      ipAddress: req.ip
    });

    return res.json({ success: true, message: `Incident status updated to ${newStatus}.` });
  } catch (err) {
    console.error('[Update Status Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to update status.', error: err.message });
  }
}

/**
 * Update incident severity override (Analyst/Admin)
 */
async function updateSeverity(req, res) {
  try {
    const incidentId = parseInt(req.params.id, 10);
    const { severity } = req.body;

    const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const newSeverity = (severity || '').toUpperCase();

    if (!validSeverities.includes(newSeverity)) {
      return res.status(400).json({ success: false, message: `Invalid severity. Must be one of [${validSeverities.join(', ')}]` });
    }

    await query('UPDATE incidents SET severity = ? WHERE id = ?', [newSeverity, incidentId]);

    await logAuditEvent({
      userId: req.user.id,
      action: 'UPDATE_SEVERITY',
      entity: 'incident',
      entityId: incidentId,
      details: { newSeverity },
      ipAddress: req.ip
    });

    return res.json({ success: true, message: `Incident severity set to ${newSeverity}.` });
  } catch (err) {
    console.error('[Update Severity Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to update severity.', error: err.message });
  }
}

/**
 * Assign incident to an analyst (Analyst/Admin)
 */
async function assignIncident(req, res) {
  try {
    const incidentId = parseInt(req.params.id, 10);
    const { assigned_to } = req.body;

    const assigneeId = assigned_to ? parseInt(assigned_to, 10) : null;

    await query('UPDATE incidents SET assigned_to = ? WHERE id = ?', [assigneeId, incidentId]);

    if (assigneeId) {
      await query(
        'INSERT INTO incident_assignments (incident_id, assigned_by, assigned_to) VALUES (?, ?, ?)',
        [incidentId, req.user.id, assigneeId]
      );

      const [assigneeRows] = await query('SELECT name FROM users WHERE id = ?', [assigneeId]);
      const assigneeName = assigneeRows && assigneeRows.length > 0 ? assigneeRows[0].name : 'Analyst';

      // Notify Assignee
      await createNotification({
        userId: assigneeId,
        title: 'New Incident Assigned',
        message: `Incident #${incidentId} has been assigned to you by ${req.user.name}.`,
        type: 'WARNING',
        incidentId
      });
    }

    await logAuditEvent({
      userId: req.user.id,
      action: 'ASSIGN_INCIDENT',
      entity: 'incident',
      entityId: incidentId,
      details: { assignedTo: assigneeId },
      ipAddress: req.ip
    });

    return res.json({ success: true, message: 'Incident assignment updated successfully.' });
  } catch (err) {
    console.error('[Assign Incident Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to assign incident.', error: err.message });
  }
}

/**
 * Add an investigation note to incident
 */
async function addNote(req, res) {
  try {
    const incidentId = parseInt(req.params.id, 10);
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note content is required.' });
    }

    const [result] = await query(
      'INSERT INTO investigation_notes (incident_id, analyst_id, note) VALUES (?, ?, ?)',
      [incidentId, req.user.id, note.trim()]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: 'ADD_NOTE',
      entity: 'investigation_notes',
      entityId: result.insertId,
      details: { incidentId, notePreview: note.substring(0, 100) },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Investigation note added.',
      note: {
        id: result.insertId,
        incident_id: incidentId,
        analyst_id: req.user.id,
        analyst_name: req.user.name,
        note: note.trim(),
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[Add Note Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to add note.', error: err.message });
  }
}

/**
 * Upload additional evidence to an incident
 */
async function uploadEvidence(req, res) {
  try {
    const incidentId = parseInt(req.params.id, 10);

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No evidence file provided.' });
    }

    const [result] = await query(
      `INSERT INTO evidence (incident_id, file_name, original_name, file_path, file_type, file_size, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        incidentId,
        req.file.filename,
        req.file.originalname,
        `/uploads/${req.file.filename}`,
        req.file.mimetype,
        req.file.size,
        req.user.id
      ]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: 'UPLOAD_EVIDENCE',
      entity: 'evidence',
      entityId: result.insertId,
      details: { incidentId, filename: req.file.originalname, size: req.file.size },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Evidence uploaded successfully.',
      evidence: {
        id: result.insertId,
        incident_id: incidentId,
        file_name: req.file.filename,
        original_name: req.file.originalname,
        file_path: `/uploads/${req.file.filename}`,
        file_type: req.file.mimetype,
        file_size: req.file.size
      }
    });
  } catch (err) {
    console.error('[Upload Evidence Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload evidence.', error: err.message });
  }
}

/**
 * Get active incident categories
 */
async function getCategories(req, res) {
  try {
    const [categories] = await query('SELECT * FROM incident_categories WHERE is_active = 1 ORDER BY id ASC');
    return res.json({ success: true, categories });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve categories.', error: err.message });
  }
}

module.exports = {
  listIncidents,
  getIncidentById,
  createIncident,
  updateStatus,
  updateSeverity,
  assignIncident,
  addNote,
  uploadEvidence,
  getCategories
};
