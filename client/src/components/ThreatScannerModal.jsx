import React, { useState } from 'react';
import { X, Search, Terminal, AlertTriangle, ShieldCheck, ExternalLink, Globe, Mail, Hash, ShieldAlert } from 'lucide-react';

export default function ThreatScannerModal({ isOpen, onClose }) {
  const [url, setUrl] = useState('http://fake-university-login.example.com/auth/login.php');
  const [text, setText] = useState('URGENT! Your university account will be suspended within 24 hours. Verify your account immediately to prevent losing student email access.');
  const [senderEmail, setSenderEmail] = useState('security-alert@univ-verify-desk.net');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleScan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analysis/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          text,
          sender_email: senderEmail,
          title: 'Ad-hoc Sandbox Inspection'
        })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.analysis);
      } else {
        setError(data.message || 'Inspection failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadgeClass = (sev) => {
    switch (sev) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MEDIUM': return 'badge-medium';
      default: return 'badge-low';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px' }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(11, 17, 32, 0.95)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Terminal size={18} color="#06b6d4" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Threat Intelligence Sandbox</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                On-Demand URL & Content Heuristics Engine (Person 3 Engine)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '1.5rem 1.75rem' }}>
          <form onSubmit={handleScan}>
            <div className="form-group">
              <label className="form-label">Suspicious Target URL</label>
              <input
                type="text"
                className="form-input font-mono"
                placeholder="https://suspicious-link.example.com/login"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Sender Email (Pretext)</label>
                <input
                  type="email"
                  className="form-input font-mono"
                  placeholder="admin@fake-domain.net"
                  value={senderEmail}
                  onChange={e => setSenderEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Quick Actions</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setUrl('http://fake-university-login.example.com/auth/login.php');
                      setText('URGENT! Your university account will be suspended within 24 hours. Verify your account at: http://fake-university-login.example.com/auth/login.php immediately to prevent losing student email access.');
                      setSenderEmail('security-alert@univ-verify-desk.net');
                    }}
                  >
                    Load Phishing Sample
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setUrl('http://185.220.101.5/malware/update.exe');
                      setText('Download required research stipend invoice and execute update.exe');
                      setSenderEmail('grant@scholarship.top');
                    }}
                  >
                    Load Malware Sample
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Message Body / Email Content</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Paste the suspicious email or message text here..."
                value={text}
                onChange={e => setText(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '0.6rem' }} disabled={loading}>
              <Search size={16} />
              {loading ? 'Evaluating Heuristic Telemetry...' : 'Run Automated Threat Analysis'}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '8px', color: '#fb7185', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Analysis Results Display */}
          {result && (
            <div style={{ marginTop: '1.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Calculated Risk Telemetry
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
                    <div className="risk-meter">
                      <span className="risk-meter-val" style={{
                        color: result.riskScore >= 76 ? '#fb7185' : result.riskScore >= 51 ? '#fb923c' : result.riskScore >= 21 ? '#fcd34d' : '#34d399'
                      }}>
                        {result.riskScore}
                      </span>
                      <span className="risk-meter-max">/100</span>
                    </div>
                    <span className={`badge ${getSeverityBadgeClass(result.severity)}`}>
                      {result.severity} RISK
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>IOCs Extracted</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {result.iocs?.length || 0}
                  </div>
                </div>
              </div>

              {/* Heuristic Factors List */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.6rem' }}>
                  Detected Threat Factors ({result.detectedFactors?.length || 0})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {result.detectedFactors?.map((factor, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(244, 63, 94, 0.2)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        fontSize: '0.84rem'
                      }}
                    >
                      <AlertTriangle size={15} color="#fb7185" style={{ flexShrink: 0 }} />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extracted IOCs */}
              <div>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.6rem' }}>
                  Extracted Indicators of Compromise
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem' }}>
                  {result.iocs?.map((ioc, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(6, 182, 212, 0.06)',
                        border: '1px solid rgba(6, 182, 212, 0.25)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem'
                      }}
                    >
                      <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>{ioc.type}</span>
                      <span className="font-mono" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: '0.5rem', color: '#e2e8f0' }}>
                        {ioc.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
