/**
 * Indicators of Compromise (IOC) Controller
 */

const { query } = require('../config/db');

async function listIocs(req, res) {
  try {
    const { type, search } = req.query;
    let sql = 'SELECT * FROM iocs WHERE 1=1';
    const params = [];

    if (type) {
      sql += ' AND type = ?';
      params.push(type.toUpperCase());
    }

    if (search && search.trim()) {
      sql += ' AND value LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    sql += ' ORDER BY report_count DESC, risk_score DESC';

    const [rows] = await query(sql, params);
    return res.json({ success: true, count: rows.length, iocs: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve IOCs.', error: err.message });
  }
}

async function getIocDetails(req, res) {
  try {
    const iocId = parseInt(req.params.id, 10);
    const [rows] = await query('SELECT * FROM iocs WHERE id = ?', [iocId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'IOC not found.' });
    }

    const ioc = rows[0];

    // Find related incidents linked to this IOC
    const [relatedIncidents] = await query(
      `SELECT i.id, i.title, i.severity, i.risk_score, i.status, i.created_at, u.name as reporter_name
       FROM incident_iocs ii
       JOIN incidents i ON ii.incident_id = i.id
       JOIN users u ON i.reporter_id = u.id
       WHERE ii.ioc_id = ?
       ORDER BY i.created_at DESC`,
      [iocId]
    );

    return res.json({
      success: true,
      ioc,
      relatedIncidents
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve IOC details.', error: err.message });
  }
}

module.exports = {
  listIocs,
  getIocDetails
};
