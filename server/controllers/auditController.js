/**
 * Audit Logs Controller
 */

const { query } = require('../config/db');

async function listAuditLogs(req, res) {
  try {
    const { action, entity, search } = req.query;
    let sql = `
      SELECT a.id, a.user_id, a.action, a.entity, a.entity_id, a.details, a.ip_address, a.created_at,
             u.name as user_name, u.email as user_email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (action) {
      sql += ' AND a.action = ?';
      params.push(action.toUpperCase());
    }

    if (entity) {
      sql += ' AND a.entity = ?';
      params.push(entity.toLowerCase());
    }

    if (search && search.trim()) {
      sql += ' AND (a.action LIKE ? OR a.details LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY a.created_at DESC LIMIT 100';

    const [logs] = await query(sql, params);
    return res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.', error: err.message });
  }
}

module.exports = {
  listAuditLogs
};
