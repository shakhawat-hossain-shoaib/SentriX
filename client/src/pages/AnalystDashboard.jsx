import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Activity, Search, Filter, ShieldAlert, AlertTriangle, Eye,
  CheckCircle, Clock, Database, Globe, Mail, Hash, ChevronRight
} from 'lucide-react';
import IncidentDossierModal from '../components/IncidentDossierModal';

export default function AnalystDashboard({ onOpenScanner }) {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [iocs, setIocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('queue'); // 'queue' or 'iocs'
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

  // IOC search
  const [iocSearch, setIocSearch] = useState('');
  const [iocTypeFilter, setIocTypeFilter] = useState('');

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sentrix_token');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (categoryFilter) params.append('category_id', categoryFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/incidents?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIncidents(data.incidents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchIocs = async () => {
    try {
      const token = localStorage.getItem('sentrix_token');
      const params = new URLSearchParams();
      if (iocTypeFilter) params.append('type', iocTypeFilter);
      if (iocSearch) params.append('search', iocSearch);

      const res = await fetch(`/api/iocs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIocs(data.iocs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('sentrix_token');
    fetch('/api/incidents/categories', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.categories) setCategories(d.categories);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, severityFilter, categoryFilter, search, user]);

  useEffect(() => {
    if (activeSubTab === 'iocs') {
      fetchIocs();
    }
  }, [activeSubTab, iocTypeFilter, iocSearch]);

  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL').length;
  const highCount = incidents.filter(i => i.severity === 'HIGH').length;
  const unassignedCount = incidents.filter(i => !i.assignee_id).length;

  return (
    <div className="app-container">
      {/* Top Header */}
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
            <span className="badge badge-cyan">Security Operations Center</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tier-1/2 Threat Analysis</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', marginTop: '0.35rem' }}>
            SOC Incident Triage & Investigation Console
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Correlate indicators, investigate phishing pretexts, enforce containment, and document resolution timelines.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.3rem', borderRadius: '10px' }}>
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`btn btn-sm ${activeSubTab === 'queue' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Activity size={15} /> Incident Queue ({incidents.length})
          </button>
          <button
            onClick={() => setActiveSubTab('iocs')}
            className={`btn btn-sm ${activeSubTab === 'iocs' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Database size={15} /> Threat Indicators (IOCs)
          </button>
        </div>
      </div>

      {/* KPI Alert Strip */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#fb7185' }}>Critical Severity</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fb7185', marginTop: '0.2rem' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Requires immediate containment</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #f97316' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#fb923c' }}>High Severity</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fb923c', marginTop: '0.2rem' }}>
            {highCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Suspicious credential targets</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#38bdf8' }}>Unassigned Queue</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>
            {unassignedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Awaiting analyst allocation</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#34d399' }}>Threat Playground</div>
          <div style={{ marginTop: '0.4rem' }}>
            <button
              onClick={onOpenScanner}
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', borderColor: 'rgba(6, 182, 212, 0.4)', color: '#38bdf8', padding: '0.45rem' }}
            >
              Open Threat Scanner
            </button>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.35rem' }}>Inspect external URLs/hashes</div>
        </div>
      </div>

      {activeSubTab === 'queue' ? (
        /* INCIDENT QUEUE */
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          {/* Filters Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
                placeholder="Search by title, description, or URL..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Search size={15} color="#64748b" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <select
              className="form-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="">All Statuses</option>
              <option value="REPORTED">REPORTED</option>
              <option value="TRIAGE">TRIAGE</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="CONTAINED">CONTAINED</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>

            <select
              className="form-select"
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>

            <select
              className="form-select"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              <Activity className="radar-dot" style={{ margin: '0 auto 1rem auto' }} />
              <div>Loading queue telemetry...</div>
            </div>
          ) : incidents.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              No incidents match current filter criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="soc-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Incident</th>
                    <th>Category</th>
                    <th>Risk Score</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Assignee</th>
                    <th>Reported</th>
                    <th style={{ textAlign: 'right' }}>Dossier</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map(inc => (
                    <tr
                      key={inc.id}
                      onClick={() => setSelectedIncidentId(inc.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="font-mono" style={{ color: '#06b6d4', fontWeight: 700 }}>
                        #{inc.id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>
                          {inc.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '0.6rem', marginTop: '0.2rem' }}>
                          <span>Reporter: {inc.reporter_name}</span>
                          {inc.url && (
                            <span className="font-mono" style={{ color: '#38bdf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                              • {inc.url}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-cyan">{inc.category_name}</span>
                      </td>
                      <td>
                        <span className="font-mono" style={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
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
                        <span className="badge" style={{
                          background: inc.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)',
                          color: inc.status === 'RESOLVED' ? '#34d399' : '#fff'
                        }}>
                          {inc.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: inc.assignee_name ? '#e2e8f0' : '#f59e0b' }}>
                          {inc.assignee_name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {inc.created_at}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedIncidentId(inc.id); }}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                        >
                          <Eye size={14} /> Investigate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* IOC INTELLIGENCE DATABASE EXPLORER */
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Threat Indicators Database (IOCs)</h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Extracted malicious domains, IP addresses, phishing URLs, and cryptographic hashes
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <select
                className="form-select"
                value={iocTypeFilter}
                onChange={e => setIocTypeFilter(e.target.value)}
                style={{ width: '140px', fontSize: '0.85rem' }}
              >
                <option value="">All Types</option>
                <option value="URL">URL</option>
                <option value="DOMAIN">DOMAIN</option>
                <option value="IP">IP</option>
                <option value="EMAIL">EMAIL</option>
                <option value="HASH">HASH</option>
              </select>

              <div style={{ width: '250px', position: 'relative' }}>
                <input
                  type="text"
                  className="form-input font-mono"
                  style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
                  placeholder="Search IOC value..."
                  value={iocSearch}
                  onChange={e => setIocSearch(e.target.value)}
                />
                <Search size={15} color="#64748b" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="soc-table">
              <thead>
                <tr>
                  <th>Indicator Type</th>
                  <th>Value</th>
                  <th>Risk Score</th>
                  <th>Frequency</th>
                  <th>First Seen</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {iocs.map(ioc => (
                  <tr key={ioc.id}>
                    <td>
                      <span className="badge badge-cyan">{ioc.type}</span>
                    </td>
                    <td>
                      <span className="font-mono" style={{ color: '#fff', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                        {ioc.value}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-critical" style={{ fontSize: '0.7rem' }}>
                        Score: {ioc.risk_score}
                      </span>
                    </td>
                    <td>
                      <strong className="font-mono" style={{ color: '#38bdf8' }}>{ioc.report_count} reports</strong>
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {ioc.first_seen}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {ioc.last_seen}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Incident Dossier Investigation Modal */}
      <IncidentDossierModal
        incidentId={selectedIncidentId}
        onClose={() => setSelectedIncidentId(null)}
        onRefresh={fetchIncidents}
      />
    </div>
  );
}
