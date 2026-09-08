# Cybersecurity Analysis Engine — SentriX

The Cybersecurity Analysis Engine is the analytical core of SentriX, designed to transform simple text reports and URLs into actionable security intelligence.

---

## 1. Indicator of Compromise (IOC) Extraction
`iocExtractor.js` extracts security indicators using validated patterns:
- **URL**: Web links (`http://`, `https://`)
- **DOMAIN**: Hostnames extracted from URLs or plaintext
- **IP**: IPv4 octets
- **EMAIL**: Email addresses
- **HASH**: MD5, SHA-1, and SHA-256 cryptographic signatures

---

## 2. Rule-Based URL Analyzer
`urlAnalyzer.js` evaluates 10 risk heuristics:

| Heuristic | Condition | Points |
|---|---|---|
| IP Host | IPv4 address used in host instead of domain | +20 |
| Long URL | Character length exceeds 75 | +10 |
| `@` Symbol | User/password redirect masking symbol present | +20 |
| Suspicious TLD | Known high-risk TLDs (`.top`, `.xyz`, `.club`, `.click`, etc.) | +10 |
| Excessive Subdomains | Subdomain level depth > 3 | +10 |
| URL Shortener | Known redirect shorteners (`bit.ly`, `tinyurl`, etc.) | +10 |
| Login Keyword | Authentication/portal paths (`login`, `auth`, `portal`) | +10 |
| Password Keyword | Sensitive keywords (`password`, `credential`, `verify`) | +10 |
| Executable Payload | Dangerous extensions in path (`.exe`, `.scr`, `.bat`) | +10 |
| Plain HTTP | Transmission protocol lacks TLS encryption | +10 |

*Maximum score is clamped to 100.*

---

## 3. Phishing Content Analyzer
`phishingAnalyzer.js` detects social engineering pretexts:
- **Urgency language**: "immediate action", "within 24 hours", "account suspension"
- **Account lockout threats**: "deactivation", "access terminated", "permanent lockout"
- **Credential requests**: "confirm password", "verify account", "enter credentials"
- **Financial lures**: "research stipend", "grant", "lottery winner", "payroll update"
- **Campus impersonation**: Mimicking university departments without a valid `.edu` domain

---

## 4. Multi-Signal Threat Scoring
`securityEngine.js` integrates:
- URL Risk Heuristic Score (45% weight)
- Phishing Content Score (35% weight)
- Category Base Weight (15–25 points)
- Historical IOC recurrence bonus (+5 points per previous appearance)

### Classification Matrix
- **0 – 20**: `LOW`
- **21 – 50**: `MEDIUM`
- **51 – 75**: `HIGH`
- **76 – 100**: `CRITICAL`
