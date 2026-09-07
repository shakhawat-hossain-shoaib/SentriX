import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X, AlertTriangle, Shield, CheckCircle, Clock, User, FileText,
  Upload, Tag, Activity, Send, ExternalLink, Calendar, Hash, ArrowRight
} from 'lucide-react';

export default function IncidentDossierModal({ incidentId, onClose, onRefresh }) {
  const { user } = useAuth();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Actions state
  const [newNote, setNewNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [analystsList, setAnalystsList] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  const userRole = (user?.role || user?.role_name || 'USER').toUpperCase();
  const isAnalystOrAdmin = userRole === 'ANALYST' || userRole === 'ADMIN';

  const fetchDossier = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sentrix_token');
      const res = await fetch(`/api/incidents/${incidentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.incident) {
        setIncident(data.incident);
        setSelectedStatus(data.incident.status);
        setSelectedSeverity(data.incident.severity);
        setSelectedAssignee(data.incident.assigned_to || '');
      } else {
        setError(data.message || 'Failed to load incident details');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (incidentId) {
      fetchDossier();
    }
  }, [incidentId]);

  // Fetch analysts for assignment dropdown
  useEffect(() => {
    if (isAnalystOrAdmin) {
      const token = localStorage.getItem('sentrix_token');
      fetch('/api/users?role_id=2', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => {
          if (d.success && d.users) {
            setAnalystsList(d.users);
          }
        })
        .catch(() => {});
    }
  }, [isAnalystOrAdmin]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNoteLoading(true);
    try {
      const token = localStorage.getItem('sentrix_token');
      const res = await fetch(`/api/incidents/${incidentId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ note: newNote.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setNewNote('');
        fetchDossier();
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      // Ignore
    } finally {
      setNoteLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setStatusLoading(true);
    try {
      const token = localStorage.getItem('sentrix_token');
      const res = await fetch(`/api/incidents/${incidentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          notes: statusNote || `Status updated to ${newStatus} by Analyst ${user?.name}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusNote('');
        fetchDossier();
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      // Ignore
    } finally {
      setStatusLoading(false);
    }
  };

  const handleUpdateSeverity = async (newSev) => {
    try {
      const token = localStorage.getItem('sentrix_token');
      await fetch(`/api/incidents/${incidentId}/severity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ severity: newSev })
      });
      setSelectedSeverity(newSev);
      fetchDossier();
      if (onRefresh) onRefresh();
    } catch (e) {
      // Ignore
    }
  };

  const handleAssign = async (analystId) => {
    try {
      const token = localStorage.getItem('sentrix_token');
      await fetch(`/api/incidents/${incidentId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ assigned_to: analystId })
      });
      setSelectedAssignee(analystId);
      fetchDossier();
      if (onRefresh) onRefresh();
    } catch (e) {
      // Ignore
    }
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceFile) return;
    setEvidenceLoading(true);
    try {
      const token = localStorage.getItem('sentrix_token');
      const formData = new FormData();
      formData.append('evidence', evidenceFile);
      const res = await fetch(`/api/incidents/${incidentId}/evidence`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setEvidenceFile(null);
        fetchDossier();
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      // Ignore
    } finally {
      setEvidenceLoading(false);
    }
  };

  if (!incidentId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
            <Activity className="radar-dot" style={{ width: '24px', height: '24px', margin: '0 auto 1rem auto' }} />
            <div>Loading security telemetry dossier...</div>
          </div>
        ) : error || !incident ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#fb7185' }}>
            <div>{error || 'Failed to load incident.'}</div>
            <button onClick={onClose} className="btn btn-ghost" style={{ marginTop: '1rem' }}>Close</button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{
              padding: '1.25rem 2rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              background: 'rgba(11, 17, 32, 0.95)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                  <span className="font-mono" style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 700 }}>
                    INCIDENT #{incident.id}
                  </span>
                  <span className={`badge ${
                    incident.severity === 'CRITICAL' ? 'badge-critical' : incident.severity === 'HIGH' ? 'badge-high' : incident.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                  }`}>
                    {incident.severity}
                  </span>
                  <span className="badge badge-cyan">{incident.category_name}</span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}>
                    {incident.status}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.25rem', lineHeight: 1.3 }}>{incident.title}</h2>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.3rem', display: 'flex', gap: '1.25rem' }}>
                  <span>Reported by: <strong>{incident.reporter_name}</strong> ({incident.reporter_department || 'Student'})</span>
                  <span>Assigned to: <strong>{incident.assignee_name || 'Unassigned'}</strong></span>
                  <span>Timestamp: <span className="font-mono">{incident.created_at}</span></span>
                </div>
              </div>
              <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }}>
                <X size={18} />
              </button>
            </div>

            {/* Main Body */}
            <div style={{ padding: '1.75rem 2rem', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem' }}>
              {/* Left Column: Dossier Details & Timeline */}
              <div>
                {/* Description & Payload */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Incident Description & Evidence Context
                  </h4>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: '#e2e8f0',
                    lineHeight: 1.6
                  }}>
                    {incident.description}
                  </div>
                </div>

                {/* Target URL & Sender Email */}
                {(incident.url || incident.sender_email) && (
                  <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: incident.url && incident.sender_email ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                    {incident.url && (
                      <div style={{ padding: '0.75rem', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Target URL / Link</div>
                        <div className="font-mono" style={{ fontSize: '0.82rem', color: '#38bdf8', wordBreak: 'break-all', marginTop: '0.2rem' }}>
                          {incident.url}
                        </div>
                      </div>
                    )}
                    {incident.sender_email && (
                      <div style={{ padding: '0.75rem', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Sender / Pretext Email</div>
                        <div className="font-mono" style={{ fontSize: '0.82rem', color: '#fb7185', wordBreak: 'break-all', marginTop: '0.2rem' }}>
                          {incident.sender_email}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Heuristic Factors */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Automated Risk Factors Detected ({incident.detected_factors?.length || 0})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {incident.detected_factors?.map((f, idx) => (
                      <div key={idx} style={{
                        padding: '0.45rem 0.75rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(244, 63, 94, 0.2)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.82rem',
                        color: '#fca5a5'
                      }}>
                        <AlertTriangle size={14} color="#fb7185" style={{ flexShrink: 0 }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Associated IOCs */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Correlated Indicators of Compromise ({incident.iocs?.length || 0})
                  </h4>
                  {incident.iocs?.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>No IOCs extracted.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {incident.iocs?.map((ioc) => (
                        <div key={ioc.id} style={{
                          padding: '0.5rem 0.75rem',
                          background: 'rgba(6, 182, 212, 0.05)',
                          border: '1px solid rgba(6, 182, 212, 0.2)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.82rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{ioc.type}</span>
                            <span className="font-mono" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#e2e8f0' }}>
                              {ioc.value}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              Seen: <strong className="font-mono">{ioc.report_count}x</strong>
                            </span>
                            <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>
                              Score: {ioc.risk_score}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Attached Evidence */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Evidence Files ({incident.evidence?.length || 0})
                  </h4>
                  {incident.evidence?.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>No files attached.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {incident.evidence?.map((ev) => (
                        <div key={ev.id} style={{
                          padding: '0.5rem 0.75rem',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.82rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={15} color="#06b6d4" />
                            <span>{ev.original_name}</span>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>({Math.round(ev.file_size / 1024)} KB)</span>
                          </div>
                          <a
                            href={ev.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Investigation Timeline (Section 9.8 Milestone Stream) */}
                <div>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.75rem' }}>
                    Investigation Timeline
                  </h4>
                  <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid rgba(6, 182, 212, 0.3)' }}>
                    {incident.timeline?.map((step, idx) => (
                      <div key={idx} style={{ marginBottom: '1.25rem', position: 'relative' }}>
                        <div style={{
                          position: 'absolute',
                          left: '-1.85rem',
                          top: '2px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: step.badge === 'RESOLVED' ? '#10b981' : step.badge === 'CRITICAL' ? '#f43f5e' : '#06b6d4',
                          boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)'
                        }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{step.event}</span>
                          <span className="font-mono" style={{ fontSize: '0.72rem', color: '#64748b' }}>{step.timestamp}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                          {step.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: SOC Analyst Actions, Risk Meter & Notes */}
              <div>
                {/* Risk Score Card */}
                <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Synthesized Risk Score
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <div className="risk-meter-val" style={{
                      fontSize: '3rem',
                      color: incident.risk_score >= 76 ? '#fb7185' : incident.risk_score >= 51 ? '#fb923c' : incident.risk_score >= 21 ? '#fcd34d' : '#34d399'
                    }}>
                      {incident.risk_score}
                    </div>
                    <span className="risk-meter-max" style={{ fontSize: '1.1rem' }}>/ 100</span>
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                    Classification: <strong>{incident.severity} SEVERITY</strong>
                  </div>
                </div>

                {/* Analyst Controls (Only for Analysts & Admins) */}
                {isAnalystOrAdmin && (
                  <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#06b6d4', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Activity size={16} /> Analyst Actions
                    </h4>

                    {/* Change Status */}
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Update Lifecycle Status</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                        {['TRIAGE', 'INVESTIGATING', 'CONTAINED', 'RESOLVED'].map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateStatus(st)}
                            disabled={statusLoading || incident.status === st}
                            className={`btn btn-sm ${incident.status === st ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ fontSize: '0.72rem', padding: '0.4rem' }}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Change Severity Override */}
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Override Severity</label>
                      <select
                        className="form-select"
                        value={selectedSeverity}
                        onChange={e => handleUpdateSeverity(e.target.value)}
                        style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>

                    {/* Reassign Analyst */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Assignee</label>
                      <select
                        className="form-select"
                        value={selectedAssignee}
                        onChange={e => handleAssign(e.target.value)}
                        style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                      >
                        <option value="">Unassigned</option>
                        {analystsList.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Analyst Notes Thread */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={16} /> Investigation Notes ({incident.notes?.length || 0})
                  </h4>

                  <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {incident.notes?.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>
                        No investigation notes added yet.
                      </div>
                    ) : (
                      incident.notes?.map(n => (
                        <div key={n.id} style={{
                          padding: '0.65rem 0.8rem',
                          background: 'rgba(0, 0, 0, 0.25)',
                          borderLeft: '3px solid #06b6d4',
                          borderRadius: '4px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>
                            <strong style={{ color: '#fff' }}>{n.analyst_name}</strong>
                            <span className="font-mono">{n.created_at}</span>
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                            {n.note}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {isAnalystOrAdmin && (
                    <form onSubmit={handleAddNote}>
                      <textarea
                        className="form-textarea"
                        rows="2"
                        placeholder="Add investigation findings or mitigation note..."
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        style={{ fontSize: '0.85rem', minHeight: '60px' }}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', marginTop: '0.5rem', gap: '0.4rem' }}
                        disabled={noteLoading || !newNote.trim()}
                      >
                        <Send size={14} /> Add Note
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
