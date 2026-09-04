/**
 * Master Cybersecurity Analysis Engine
 * Coordinates IOC extraction, URL heuristics, Phishing detection, and historical IOC correlation.
 */

const { extractIocs } = require('./iocExtractor');
const { analyzeUrl } = require('./urlAnalyzer');
const { analyzeContent } = require('./phishingAnalyzer');
const { query } = require('../config/db');

function classifySeverity(riskScore) {
  if (riskScore >= 76) return 'CRITICAL';
  if (riskScore >= 51) return 'HIGH';
  if (riskScore >= 21) return 'MEDIUM';
  return 'LOW';
}

/**
 * Perform comprehensive cybersecurity analysis on incident payload
 */
async function analyzeIncident({ title = '', description = '', url = '', senderEmail = '', categoryName = '' }) {
  // 1. Extract all IOCs
  const extractedIocs = extractIocs({ text: `${title} ${description}`, url, senderEmail });

  // 2. Analyze URL heuristics
  const urlAnalysis = analyzeUrl(url || '');

  // 3. Analyze textual phishing indicators
  const contentAnalysis = analyzeContent({ title, description, senderEmail });

  // 4. Query IOC database for historical occurrences
  let iocHistoryBonus = 0;
  const iocCorrelations = [];

  for (const ioc of extractedIocs) {
    try {
      const [existing] = await query('SELECT * FROM iocs WHERE type = ? AND value = ?', [ioc.type, ioc.value]);
      if (existing && existing.length > 0) {
        const prev = existing[0];
        iocHistoryBonus += Math.min(25, (prev.report_count || 1) * 5);
        iocCorrelations.push({
          type: ioc.type,
          value: ioc.value,
          previousReports: prev.report_count || 1,
          riskScore: prev.risk_score || 0
        });
      }
    } catch (e) {
      // Ignore DB query errors during static inspection
    }
  }

  // 5. Category baseline weight
  let categoryBaseline = 15;
  const catLower = (categoryName || '').toLowerCase();
  if (catLower.includes('malware') || catLower.includes('data leak')) categoryBaseline = 25;
  else if (catLower.includes('phishing') || catLower.includes('compromise') || catLower.includes('unauthorized')) categoryBaseline = 20;

  // 6. Aggregate risk score calculation
  const allFactors = [...urlAnalysis.factors, ...contentAnalysis.factors];
  if (iocCorrelations.length > 0) {
    allFactors.push(`Repeated Threat Indicator: ${iocCorrelations.length} IOC(s) previously logged in threat intelligence database`);
  }

  // Combine weighted components
  let combinedScore = 0;
  if (url) {
    combinedScore = (urlAnalysis.score * 0.45) + (contentAnalysis.score * 0.35) + categoryBaseline + iocHistoryBonus;
  } else {
    combinedScore = (contentAnalysis.score * 0.65) + categoryBaseline + iocHistoryBonus;
  }

  // Clamp 0-100
  const finalRiskScore = Math.min(100, Math.max(0, Math.round(combinedScore)));
  const severity = classifySeverity(finalRiskScore);

  return {
    riskScore: finalRiskScore,
    severity,
    detectedFactors: allFactors,
    iocs: extractedIocs,
    iocCorrelations,
    urlAnalysis,
    contentAnalysis
  };
}

/**
 * Persist extracted IOCs and link them to the incident
 */
async function recordIncidentIocs(incidentId, iocsList) {
  if (!incidentId || !iocsList || iocsList.length === 0) return;

  for (const ioc of iocsList) {
    try {
      // Check if IOC exists
      const [rows] = await query('SELECT id, report_count FROM iocs WHERE type = ? AND value = ?', [ioc.type, ioc.value]);
      let iocId = null;

      if (rows && rows.length > 0) {
        iocId = rows[0].id;
        const newCount = (rows[0].report_count || 1) + 1;
        await query(
          "UPDATE iocs SET report_count = ?, last_seen = datetime('now') WHERE id = ?",
          [newCount, iocId]
        ).catch(() => {
          return query('UPDATE iocs SET report_count = ? WHERE id = ?', [newCount, iocId]);
        });
      } else {
        const [insertRes] = await query(
          "INSERT INTO iocs (type, value, risk_score, report_count, first_seen, last_seen) VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))",
          [ioc.type, ioc.value, 60]
        ).catch(() => {
          return query('INSERT INTO iocs (type, value, risk_score, report_count) VALUES (?, ?, ?, 1)', [ioc.type, ioc.value, 60]);
        });
        iocId = insertRes.insertId;
      }

      if (iocId) {
        await query('INSERT OR IGNORE INTO incident_iocs (incident_id, ioc_id) VALUES (?, ?)', [incidentId, iocId])
          .catch(() => {
            return query('INSERT IGNORE INTO incident_iocs (incident_id, ioc_id) VALUES (?, ?)', [incidentId, iocId]);
          });
      }
    } catch (err) {
      console.error(`[Record IOC Error for ${ioc.type}:${ioc.value}]:`, err.message);
    }
  }
}

module.exports = {
  analyzeIncident,
  classifySeverity,
  recordIncidentIocs
};
