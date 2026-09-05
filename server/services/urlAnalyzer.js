/**
 * URL Risk Analyzer
 * Implements Section 9.2 rule-based security heuristics:
 * - IP host (+20)
 * - URL length > 75 (+10)
 * - @ symbol (+20)
 * - Suspicious TLD (+10)
 * - Excessive subdomains (+10)
 * - URL shortener (+10)
 * - Login/Auth keywords (+10)
 * - Password/Credential keywords (+10)
 * - Suspicious executable/script path (+10)
 * - Insecure HTTP protocol (+10)
 * Max capped at 100
 */

const SUSPICIOUS_TLDS = new Set([
  'top', 'xyz', 'tk', 'ml', 'ga', 'cf', 'gq', 'club', 'buzz',
  'click', 'download', 'loan', 'racing', 'win', 'bid', 'stream',
  'country', 'gdn', 'mom', 'date', 'faith', 'review', 'party'
]);

const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 'is.gd', 't.co', 'ow.ly', 'buff.ly',
  'cutt.ly', 'rb.gy', 'goo.gl', 'bl.ink', 'shorturl.at'
]);

const SUSPICIOUS_PATH_EXTENSIONS = /\.(exe|dll|scr|bat|cmd|vbs|vbe|js|jse|wsf|wsh|ps1|apk|msi|sh|bin)$/i;

function analyzeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      score: 0,
      factors: [],
      url: null,
      hostname: null,
      isHttps: false
    };
  }

  const cleanUrl = rawUrl.trim();
  let score = 0;
  const factors = [];

  let parsed = null;
  try {
    parsed = new URL(cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') ? cleanUrl : `http://${cleanUrl}`);
  } catch (e) {
    // If URL cannot be parsed
    return {
      score: 25,
      factors: ['Malformed or invalid URL structure'],
      url: cleanUrl,
      hostname: null,
      isHttps: false
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();
  const fullUrl = cleanUrl.toLowerCase();

  // 1. IP used instead of domain (+20)
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  if (isIp) {
    score += 20;
    factors.push('IP address host used instead of domain name (+20)');
  }

  // 2. Very long URL (+10)
  if (cleanUrl.length > 75) {
    score += 10;
    factors.push(`Abnormally long URL length (${cleanUrl.length} chars) (+10)`);
  }

  // 3. @ symbol (+20)
  if (cleanUrl.includes('@')) {
    score += 20;
    factors.push('Contains "@" symbol used for credential/redirect masking (+20)');
  }

  // 4. Suspicious TLD (+10)
  const hostParts = hostname.split('.');
  const tld = hostParts.length > 1 ? hostParts[hostParts.length - 1] : '';
  if (SUSPICIOUS_TLDS.has(tld)) {
    score += 10;
    factors.push(`Suspicious top-level domain (.${tld}) (+10)`);
  }

  // 5. Too many subdomains (+10)
  if (!isIp && hostParts.length > 3) {
    score += 10;
    factors.push(`Excessive subdomains count (${hostParts.length - 2} levels) (+10)`);
  }

  // 6. URL shortener (+10)
  if (URL_SHORTENERS.has(hostname)) {
    score += 10;
    factors.push(`Known URL shortener detected (${hostname}) (+10)`);
  }

  // 7. Login / verification keywords (+10)
  const loginKeywords = ['login', 'signin', 'sign-in', 'verify', 'verification', 'portal', 'auth', 'webmail'];
  const hasLoginKeyword = loginKeywords.some(kw => pathname.includes(kw) || hostname.includes(kw));
  if (hasLoginKeyword) {
    score += 10;
    factors.push('Authentication or portal keyword present in URL (+10)');
  }

  // 8. Password / credential keywords (+10)
  const credKeywords = ['password', 'passwd', 'credential', 'passcode', 'security-update', 'account-update'];
  const hasCredKeyword = credKeywords.some(kw => pathname.includes(kw) || fullUrl.includes(kw));
  if (hasCredKeyword) {
    score += 10;
    factors.push('Credential harvesting keyword present in URL (+10)');
  }

  // 9. Suspicious executable / script path (+10)
  if (SUSPICIOUS_PATH_EXTENSIONS.test(pathname)) {
    score += 10;
    factors.push(`Suspicious executable/script file payload in path (${pathname.split('/').pop()}) (+10)`);
  }

  // 10. Insecure plain HTTP (+10)
  const isHttps = parsed.protocol === 'https:';
  if (!isHttps) {
    score += 10;
    factors.push('Insecure transmission protocol (HTTP without TLS encryption) (+10)');
  }

  const finalScore = Math.min(100, score);

  return {
    score: finalScore,
    factors,
    url: cleanUrl,
    hostname,
    isHttps
  };
}

module.exports = {
  analyzeUrl
};
