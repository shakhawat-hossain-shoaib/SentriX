/**
 * Security Operations Center (SOC) Analytics Controller
 * Implements Section 10.12 metrics and visualizations data
 */

const { query } = require('../config/db');

async function getOverview(req, res) {
  try {
    // KPI Counters
    const [totalRows] = await query('SELECT COUNT(*) as total FROM incidents');
    const [openRows] = await query("SELECT COUNT(*) as count FROM incidents WHERE status NOT IN ('RESOLVED', 'CLOSED', 'FALSE_POSITIVE')");
    const [resolvedRows] = await query("SELECT COUNT(*) as count FROM incidents WHERE status = 'RESOLVED'");
    const [criticalRows] = await query("SELECT COUNT(*) as count FROM incidents WHERE severity = 'CRITICAL'");
    const [iocTotalRows] = await query('SELECT COUNT(*) as count FROM iocs');
    const [userTotalRows] = await query('SELECT COUNT(*) as count FROM users');

    // Severity Breakdown
    const [severityRows] = await query(
      `SELECT severity, COUNT(*) as count
       FROM incidents
       GROUP BY severity
       ORDER BY CASE severity
         WHEN 'CRITICAL' THEN 1
         WHEN 'HIGH' THEN 2
         WHEN 'MEDIUM' THEN 3
         WHEN 'LOW' THEN 4
         ELSE 5 END`
    );

    // Category Breakdown
    const [categoryRows] = await query(
      `SELECT c.name, COUNT(i.id) as count
       FROM incident_categories c
       LEFT JOIN incidents i ON c.id = i.category_id
       GROUP BY c.id, c.name
       ORDER BY count DESC`
    );

    // Status Lifecycle Breakdown
    const [statusRows] = await query(
      `SELECT status, COUNT(*) as count
       FROM incidents
       GROUP BY status
       ORDER BY count DESC`
    );

    // Recent 5 Incidents
    const [recentIncidents] = await query(
      `SELECT i.id, i.title, i.severity, i.risk_score, i.status, i.created_at, c.name as category_name, u.name as reporter_name
       FROM incidents i
       LEFT JOIN incident_categories c ON i.category_id = c.id
       LEFT JOIN users u ON i.reporter_id = u.id
       ORDER BY i.created_at DESC
       LIMIT 5`
    );

    // Top Indicators of Compromise
    const [topIocs] = await query(
      `SELECT type, value, risk_score, report_count
       FROM iocs
       ORDER BY report_count DESC, risk_score DESC
       LIMIT 6`
    );

    return res.json({
      success: true,
      metrics: {
        totalIncidents: totalRows[0]?.total || 0,
        openIncidents: openRows[0]?.count || 0,
        resolvedIncidents: resolvedRows[0]?.count || 0,
        criticalIncidents: criticalRows[0]?.count || 0,
        totalIocs: iocTotalRows[0]?.count || 0,
        totalUsers: userTotalRows[0]?.count || 0
      },
      charts: {
        severity: severityRows,
        categories: categoryRows,
        status: statusRows,
        topIocs
      },
      recentIncidents
    });
  } catch (err) {
    console.error('[Analytics Overview Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate analytics overview.', error: err.message });
  }
}

async function getMonthlyTrends(req, res) {
  try {
    // Extract incident counts by month/day
    const [rows] = await query(
      `SELECT
        substr(created_at, 1, 7) as month,
        COUNT(*) as total,
        SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved
       FROM incidents
       GROUP BY substr(created_at, 1, 7)
       ORDER BY month ASC`
    );

    return res.json({ success: true, trends: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get monthly trends.', error: err.message });
  }
}

async function getResolutionTime(req, res) {
  try {
    const [resolved] = await query(
      `SELECT id, severity, created_at, resolved_at
       FROM incidents
       WHERE status = 'RESOLVED' AND resolved_at IS NOT NULL`
    );

    let totalHours = 0;
    const resolvedList = resolved.map(inc => {
      const start = new Date(inc.created_at).getTime();
      const end = new Date(inc.resolved_at).getTime();
      const hours = Math.max(0.1, Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10);
      totalHours += hours;
      return { ...inc, resolutionHours: hours };
    });

    const averageHours = resolvedList.length > 0 ? Math.round((totalHours / resolvedList.length) * 10) / 10 : 2.5;

    return res.json({
      success: true,
      averageHours,
      resolvedCount: resolvedList.length,
      sample: resolvedList
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to calculate resolution metrics.', error: err.message });
  }
}

module.exports = {
  getOverview,
  getMonthlyTrends,
  getResolutionTime
};
