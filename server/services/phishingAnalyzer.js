/**
 * Phishing & Social Engineering Content Analyzer
 * Implements Section 9.4 heuristic detection for phishing indicators.
 */

const PHISHING_PATTERNS = [
  {
    name: 'Urgency language',
    weight: 20,
    regex: /\b(urgent|immediately|action required|within 24 hours|within 48 hours|asap|time sensitive|expires today|deadline)\b/i
  },
  {
    name: 'Account suspension threat',
    weight: 25,
    regex: /\b(account.*suspend|suspension|deactivat|disabled|terminated|lose access|blocked|prevent losing|lockout)\b/i
  },
  {
    name: 'Credential verification request',
    weight: 25,
    regex: /\b(verify your account|confirm password|enter credentials|validate identity|re-login|update password|security alert.*verify)\b/i
  },
  {
    name: 'Fake reward or financial lure',
    weight: 20,
    regex: /\b(scholarship|stipend|grant|lottery|winner|won \$|wire transfer|cryptocurrency|bitcoin|claim prize|part-time job|payroll update)\b/i
  },
  {
    name: 'Authority / IT Helpdesk impersonation',
    weight: 15,
    regex: /\b(it helpdesk|system administrator|campus director|security operations|office of registrar|dean of students|university tech desk)\b/i
  },
  {
    name: 'Threatening or coercive language',
    weight: 15,
    regex: /\b(legal action|consequences|disciplinary action|arrest|penalty|permanently deleted|forfeited)\b/i
  }
];

function analyzeContent({ title = '', description = '', senderEmail = '' }) {
  const combined = `${title} ${description} ${senderEmail}`.toLowerCase();
  let score = 0;
  const factors = [];

  for (const pattern of PHISHING_PATTERNS) {
    if (pattern.regex.test(combined)) {
      score += pattern.weight;
      factors.push(pattern.name);
    }
  }

  // Sender email domain mismatch or suspicious sender
  if (senderEmail) {
    const emailLower = senderEmail.toLowerCase();
    if (emailLower.includes('univ') && !emailLower.endsWith('.edu')) {
      score += 15;
      factors.push('Campus impersonation: email mimics university name but lacks .edu domain');
    }
    if (/\.(top|xyz|club|buzz|click|tk|ml)$/i.test(emailLower)) {
      score += 15;
      factors.push('Sender email uses high-risk untrusted top-level domain');
    }
  }

  return {
    score: Math.min(100, score),
    factors
  };
}

module.exports = {
  analyzeContent
};
