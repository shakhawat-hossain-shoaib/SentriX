/**
 * Cybersecurity Analysis Controller
 * Interactive on-demand threat sandbox for analyzing URLs, messages, and IOCs
 */

const { analyzeIncident } = require('../services/securityEngine');
const { extractIocs } = require('../services/iocExtractor');
const { analyzeUrl } = require('../services/urlAnalyzer');

async function inspectThreat(req, res) {
  try {
    const { url, text, sender_email, title, category } = req.body;

    if (!url && !text && !title) {
      return res.status(400).json({ success: false, message: 'Please provide a URL, text, or title to analyze.' });
    }

    const analysis = await analyzeIncident({
      title: title || '',
      description: text || '',
      url: url || '',
      senderEmail: sender_email || '',
      categoryName: category || 'General'
    });

    return res.json({
      success: true,
      analysis: {
        riskScore: analysis.riskScore,
        severity: analysis.severity,
        detectedFactors: analysis.detectedFactors,
        iocs: analysis.iocs,
        iocCorrelations: analysis.iocCorrelations,
        urlAnalysis: analysis.urlAnalysis,
        contentAnalysis: analysis.contentAnalysis
      }
    });
  } catch (err) {
    console.error('[Threat Inspection Error]:', err);
    return res.status(500).json({ success: false, message: 'Threat analysis failed.', error: err.message });
  }
}

module.exports = {
  inspectThreat
};
