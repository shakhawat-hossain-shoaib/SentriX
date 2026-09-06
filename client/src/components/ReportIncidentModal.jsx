import React, { useState, useEffect } from 'react';
import { X, Send, AlertTriangle, Upload, Globe, Mail, ShieldAlert, Sparkles } from 'lucide-react';

export default function ReportIncidentModal({ isOpen, onClose, onCreated }) {
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Live pre-scan indicator
  const [preScanFactors, setPreScanFactors] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('sentrix_token');
      fetch('/api/incidents/categories', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => {
          if (d.success && d.categories) {
            setCategories(d.categories);
            if (d.categories.length > 0) setCategoryId(d.categories[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Dynamic live pre-scan heuristics as user types
  useEffect(() => {
    const factors = [];
    const text = `${title} ${description}`.toLowerCase();

    if (/\b(urgent|immediate|24 hours|action required)\b/i.test(text)) {
      factors.push('Urgency pattern detected');
    }
    if (/\b(suspend|deactivat|lockout|lose access)\b/i.test(text)) {
      factors.push('Account suspension threat detected');
    }
    if (/\b(verify|credentials|password|login immediately)\b/i.test(text)) {
      factors.push('Credential harvesting pattern detected');
    }
    if (url) {
      if (url.startsWith('http://')) factors.push('Unencrypted HTTP URL');
      if (/\.(top|xyz|club|click|download)\b/i.test(url)) factors.push('High-risk top-level domain (.top/.xyz)');
      if (/\b(login|auth|verify|portal)\b/i.test(url)) factors.push('Portal credential verification keyword in URL');
    }
    if (senderEmail && !senderEmail.endsWith('.edu') && /univ|campus/i.test(senderEmail)) {
      factors.push('Potential campus spoofing sender address');
    }

    setPreScanFactors(factors);
  }, [title, description, url, senderEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !categoryId) {
      setError('Please fill in title, category, and description.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('sentrix_token');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category_id', categoryId);
      formData.append('description', description);
      if (url) formData.append('url', url);
      if (senderEmail) formData.append('sender_email', senderEmail);
      if (evidenceFile) formData.append('evidence', evidenceFile);

      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        // Reset form
        setTitle('');
        setDescription('');
        setUrl('');
        setSenderEmail('');
        setEvidenceFile(null);
        if (onCreated) onCreated(data.incidentId);
        onClose();
      } else {
        setError(data.message || 'Failed to submit report');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px' }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 2rem',
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
              background: 'rgba(244, 63, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldAlert size={18} color="#fb7185" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Report Suspicious Cybersecurity Incident</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Automated threat analysis and IOC extraction will run upon submission
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.75rem 2rem' }}>
          {error && (
            <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '8px', color: '#fb7185', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Incident Subject / Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. URGENT! Account Suspension Warning with Fake Portal Link"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Incident Category *</label>
              <select
                className="form-select"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                required
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Suspicious URL / Link (Optional)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input font-mono"
                  placeholder="http://fake-university-login.example.com"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Sender Email Address (Optional)</label>
              <input
                type="email"
                className="form-input font-mono"
                placeholder="security-alert@univ-verify-desk.net"
                value={senderEmail}
                onChange={e => setSenderEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description / Message Content *</label>
            <textarea
              className="form-textarea"
              rows="4"
              placeholder="Paste full email body, SMS text, or context of what happened..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Attach Screenshot or Evidence File (Optional)</label>
            <input
              type="file"
              className="form-input"
              style={{ padding: '0.5rem' }}
              onChange={e => setEvidenceFile(e.target.files[0])}
            />
          </div>

          {/* Real-time Pre-scan telemetry badge */}
          {preScanFactors.length > 0 && (
            <div style={{
              marginBottom: '1.25rem',
              padding: '0.85rem 1rem',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#fb7185', fontWeight: 700, textTransform: 'uppercase' }}>
                <Sparkles size={14} /> Live Threat Pre-scan Heuristics
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                {preScanFactors.map((f, i) => (
                  <span key={i} className="badge badge-critical" style={{ fontSize: '0.68rem' }}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ gap: '0.5rem' }}>
              <Send size={16} />
              {loading ? 'Submitting & Analyzing Threat...' : 'Submit Incident Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
