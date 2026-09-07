/**
 * IOC (Indicator of Compromise) Extractor Service
 * Extracts URLs, Domains, IPs, Emails, and Cryptographic Hashes from unstructured text and fields.
 */

const URL_REGEX = /https?:\/\/[^\s<>"'{}|\\^`]+[^\s<>"'{}|\\^`.,;:?!)]/gi;
const IP_REGEX = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi;
const HASH_REGEX = /\b(?:[a-fA-F0-9]{64}|[a-fA-F0-9]{40}|[a-fA-F0-9]{32})\b/g;

function extractDomainFromUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname.toLowerCase();
  } catch (e) {
    // If not standard URL format
    const match = rawUrl.match(/(?:https?:\/\/)?([a-zA-Z0-9.-]+)(?::\d+)?(?:\/.*)?/);
    return match ? match[1].toLowerCase() : null;
  }
}

function extractIocs({ text = '', url = '', senderEmail = '' }) {
  const combinedText = `${text || ''} ${url || ''} ${senderEmail || ''}`;
  const iocs = [];
  const seen = new Set();

  function addIoc(type, value) {
    if (!value) return;
    const cleanVal = value.trim();
    const key = `${type}:${cleanVal.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      iocs.push({ type, value: cleanVal });
    }
  }

  // 1. Explicit or text URLs
  if (url && url.trim()) {
    addIoc('URL', url.trim());
    const domain = extractDomainFromUrl(url.trim());
    if (domain) {
      if (IP_REGEX.test(domain)) {
        addIoc('IP', domain);
      } else {
        addIoc('DOMAIN', domain);
      }
    }
  }

  const urlMatches = combinedText.match(URL_REGEX) || [];
  for (const matchedUrl of urlMatches) {
    addIoc('URL', matchedUrl);
    const domain = extractDomainFromUrl(matchedUrl);
    if (domain) {
      if (domain.match(IP_REGEX)) {
        addIoc('IP', domain);
      } else {
        addIoc('DOMAIN', domain);
      }
    }
  }

  // 2. Sender Email or text Emails
  if (senderEmail && senderEmail.trim()) {
    addIoc('EMAIL', senderEmail.trim().toLowerCase());
    const parts = senderEmail.trim().split('@');
    if (parts[1]) addIoc('DOMAIN', parts[1].toLowerCase());
  }

  const emailMatches = combinedText.match(EMAIL_REGEX) || [];
  for (const email of emailMatches) {
    addIoc('EMAIL', email.toLowerCase());
  }

  // 3. IP Addresses
  const ipMatches = combinedText.match(IP_REGEX) || [];
  for (const ip of ipMatches) {
    // Filter out common loopbacks / subnet masks if desirable, but preserve for IOC records
    if (ip !== '127.0.0.1' && ip !== '255.255.255.0' && ip !== '0.0.0.0') {
      addIoc('IP', ip);
    }
  }

  // 4. File Hashes (MD5, SHA1, SHA256)
  const hashMatches = combinedText.match(HASH_REGEX) || [];
  for (const hash of hashMatches) {
    // Ignore pure digits or all zeros
    if (!/^\d+$/.test(hash) && !/^0+$/.test(hash)) {
      addIoc('HASH', hash.toLowerCase());
    }
  }

  return iocs;
}

module.exports = {
  extractIocs,
  extractDomainFromUrl
};
