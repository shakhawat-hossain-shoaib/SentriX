import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, PlusCircle, CheckCircle, Clock, Search, ExternalLink, Activity, Eye, AlertTriangle } from 'lucide-react';
import ReportIncidentModal from '../components/ReportIncidentModal';
import IncidentDossierModal from '../components/IncidentDossierModal';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sentrix_token');
      const res = await fetch('/api/incidents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.incidents) {
        setIncidents(data.incidents);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  const totalReports = incidents.length;
  const inTriage = incidents.filter(i => i.status === 'TRIAGE' || i.status === 'REPORTED').length;
  const investigating = incidents.filter(i => i.status === 'INVESTIGATING' || i.status === 'CONTAINED').length;
  const resolved = incidents.filter(i => i.status === 'RESOLVED').length;

  const filtered = incidents.filter(i => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return i.title.toLowerCase().includes(s) || (i.category_name && i.category_name.toLowerCase().includes(s));
  });

  return (
    <div className="app-container">
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-low">Student Security Center</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user?.department || 'Campus Community'}</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', marginTop: '0.35rem' }}>
            Welcome, {user?.name || 'Campus Student'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Report suspicious cybersecurity threats, track SOC analysis, and view investigation progress in real time.
          </p>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="btn btn-primary"
          style={{ gap: '0.5rem', padding: '0.75rem 1.4rem' }}
        >
          <PlusCircle size={18} /> Report Suspicious Threat
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8' }}>Total Submitted</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.3rem', color: '#fff' }}>{totalReports}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>All-time security reports</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#f59e0b' }}>In Triage Queue</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.3rem', color: '#fbbf24' }}>{inTriage}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Under initial analysis</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#06b6d4' }}>Active Investigation</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.3rem', color: '#38bdf8' }}>{investigating}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Assigned to SOC analysts</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#10b981' }}>Mitigated & Resolved</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.3rem', color: '#34d399' }}>{resolved}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Closed security actions</div>
        </div>
      </div>

      {/* Reports Table Section */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>My Reported Incidents</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Select any incident to view detailed automated risk telemetry and investigation notes
            </p>
          </div>

          <div style={{ width: '280px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              style={{ padding: '0.5rem 0.8rem 0.5rem 2.2rem', fontSize: '0.85rem' }}
              placeholder="Search by title or category..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Search size={15} color="#64748b" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <Activity className="radar-dot" style={{ margin: '0 auto 1rem auto' }} />
            <div>Loading reports...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            padding: '3.5rem 1rem',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '12px',
            border: '1px dashed rgba(255,255,255,0.1)'
          }}>
            <ShieldAlert size={36} color="#64748b" style={{ margin: '0 auto 0.75rem auto' }} />
            <h4 style={{ color: '#e2e8f0', fontSize: '1rem' }}>No incident reports found</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.3rem', maxWidth: '400px', margin: '0.3rem auto 1.25rem auto' }}>
              Notice any suspicious phishing emails, fake portals, or strange logins? Submit a report for instant SOC inspection.
            </p>
            <button onClick={() => setShowReportModal(true)} className="btn btn-primary btn-sm">
              <PlusCircle size={15} /> Report Incident Now
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="soc-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Incident Details</th>
                  <th>Category</th>
                  <th>Risk Score</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inc => (
                  <tr
                    key={inc.id}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="font-mono" style={{ color: '#06b6d4', fontWeight: 700 }}>
                      #{inc.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>{inc.title}</div>
                      {inc.url && (
                        <div className="font-mono" style={{ fontSize: '0.75rem', color: '#38bdf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>
                          {inc.url}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-cyan">{inc.category_name}</span>
                    </td>
                    <td>
                      <span className="font-mono" style={{
                        fontWeight: 700,
                        color: inc.risk_score >= 76 ? '#fb7185' : inc.risk_score >= 51 ? '#fb923c' : inc.risk_score >= 21 ? '#fcd34d' : '#34d399'
                      }}>
                        {inc.risk_score}/100
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        inc.severity === 'CRITICAL' ? 'badge-critical' : inc.severity === 'HIGH' ? 'badge-high' : inc.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {inc.created_at}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedIncidentId(inc.id); }}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ReportIncidentModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onCreated={(id) => {
          fetchReports();
          setSelectedIncidentId(id);
        }}
      />

      <IncidentDossierModal
        incidentId={selectedIncidentId}
        onClose={() => setSelectedIncidentId(null)}
        onRefresh={fetchReports}
      />
    </div>
  );
}
