import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Layers, Users, BarChart3, ShieldCheck, Activity, Search,
  Clock, CheckCircle, AlertTriangle, ToggleLeft, ToggleRight, FileText
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'users', 'audit'
  const [analytics, setAnalytics] = useState(null);
  const [resolutionMetrics, setResolutionMetrics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Users filter
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('sentrix_token');
      const [ovRes, resRes] = await Promise.all([
        fetch('/api/analytics/overview', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/analytics/resolution-time', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const ovData = await ovRes.json();
      const resData = await resRes.json();
      if (ovData.success) setAnalytics(ovData);
      if (resData.success) setResolutionMetrics(resData);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('sentrix_token');
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setUsersList(data.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('sentrix_token');
      const res = await fetch('/api/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setAuditLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAnalytics(), fetchUsers(), fetchAuditLogs()]).finally(() => setLoading(false));
  }, []);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const token = localStorage.getItem('sentrix_token');
      await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeUserRole = async (userId, newRoleId) => {
    try {
      const token = localStorage.getItem('sentrix_token');
      await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role_id: newRoleId })
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = usersList.filter(u => {
    if (!userSearch) return true;
    const s = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || (u.department && u.department.toLowerCase().includes(s));
  });

  const filteredAudit = auditLogs.filter(a => {
    if (!auditSearch) return true;
    const s = auditSearch.toLowerCase();
    return a.action.toLowerCase().includes(s) || (a.user_name && a.user_name.toLowerCase().includes(s)) || (a.details && a.details.toLowerCase().includes(s));
  });

  return (
    <div className="app-container">
      {/* Header */}
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
            <span className="badge badge-purple">Platform Administrator</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Governance, Security Intelligence & Auditing</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', marginTop: '0.35rem' }}>
            Administrator Command Dashboard
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Platform metrics, role allocations, user account access controls, and forensic audit logs.
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.3rem', borderRadius: '10px' }}>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`btn btn-sm ${activeTab === 'analytics' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <BarChart3 size={15} /> Analytics & Charts
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Users size={15} /> Users ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <FileText size={15} /> Audit Logs ({auditLogs.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          <Activity className="radar-dot" style={{ margin: '0 auto 1rem auto' }} />
          <div>Loading administrative telemetry...</div>
        </div>
      ) : activeTab === 'analytics' ? (
        /* ANALYTICS TAB */
        <div>
          {/* KPI strip */}
          <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8' }}>Total Campus Incidents</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.2rem', color: '#fff' }}>
                {analytics?.metrics?.totalIncidents || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Submitted threat telemetry</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#f43f5e' }}>Critical Threat Alerts</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.2rem', color: '#fb7185' }}>
                {analytics?.metrics?.criticalIncidents || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Score &gt;= 76 indicators</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#10b981' }}>Mitigated & Closed</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.2rem', color: '#34d399' }}>
                {analytics?.metrics?.resolvedIncidents || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Resolution rate: {Math.round(((analytics?.metrics?.resolvedIncidents || 0) / (analytics?.metrics?.totalIncidents || 1)) * 100)}%
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#06b6d4' }}>Mean Resolution Time</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.2rem', color: '#38bdf8' }}>
                {resolutionMetrics?.averageHours || 2.4}h
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Average time to close ticket</div>
            </div>
          </div>

          {/* Graphical Distributions */}
          <div className="grid-cols-2" style={{ marginBottom: '2rem' }}>
            {/* Category Breakdown */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="#06b6d4" /> Incidents by Threat Classification
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {analytics?.charts?.categories?.map(c => {
                  const maxCount = Math.max(...(analytics?.charts?.categories?.map(x => x.count) || [1]), 1);
                  const percentage = Math.round((c.count / maxCount) * 100);
                  return (
                    <div key={c.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span>{c.name}</span>
                        <strong className="font-mono" style={{ color: '#06b6d4' }}>{c.count}</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #06b6d4 0%, #0284c7 100%)',
                          borderRadius: '999px'
                        }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="#f43f5e" /> Severity Distribution Matrix
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {analytics?.charts?.severity?.map(s => {
                  const maxCount = Math.max(...(analytics?.charts?.severity?.map(x => x.count) || [1]), 1);
                  const percentage = Math.round((s.count / maxCount) * 100);
                  const barColor = s.severity === 'CRITICAL' ? '#f43f5e' : s.severity === 'HIGH' ? '#f97316' : s.severity === 'MEDIUM' ? '#f59e0b' : '#10b981';
                  return (
                    <div key={s.severity}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span className={`badge ${
                          s.severity === 'CRITICAL' ? 'badge-critical' : s.severity === 'HIGH' ? 'badge-high' : s.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                        }`}>
                          {s.severity}
                        </span>
                        <strong className="font-mono">{s.count} incidents</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: barColor,
                          borderRadius: '999px'
                        }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'users' ? (
        /* USERS MANAGEMENT TAB */
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>User & Analyst Access Management</h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Assign security roles (Student, Analyst, Admin) and toggle account activation status
              </p>
            </div>

            <div style={{ width: '280px', position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
                placeholder="Search user name or email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
              <Search size={15} color="#64748b" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="soc-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Reported</th>
                  <th>Assigned</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.email}</div>
                    </td>
                    <td>{u.department || 'General'}</td>
                    <td>
                      <select
                        className="form-select"
                        value={u.role_id}
                        onChange={e => handleChangeUserRole(u.id, parseInt(e.target.value, 10))}
                        style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', width: 'auto' }}
                      >
                        <option value="1">USER (Student)</option>
                        <option value="2">ANALYST (SOC)</option>
                        <option value="3">ADMIN</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-low' : 'badge-critical'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="font-mono">{u.reported_count || 0}</td>
                    <td className="font-mono">{u.assigned_count || 0}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleUserStatus(u.id, u.status)}
                        className={`btn btn-sm ${u.status === 'ACTIVE' ? 'btn-ghost' : 'btn-primary'}`}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* AUDIT LOGS TAB */
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Forensic Audit Trail (Immutable System Log)</h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Tracks authentication attempts, status overrides, evidence attachments, and incident lifecycle transitions
              </p>
            </div>

            <div style={{ width: '280px', position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
                placeholder="Search audit action or detail..."
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
              />
              <Search size={15} color="#64748b" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="soc-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Actor</th>
                  <th>IP Address</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudit.map(log => (
                  <tr key={log.id}>
                    <td className="font-mono" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {log.created_at}
                    </td>
                    <td>
                      <span className="badge badge-cyan">{log.action}</span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.8rem' }}>{log.entity}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.user_name || 'System / Anonymous'}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{log.user_email || ''}</div>
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.78rem', color: '#38bdf8' }}>
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.78rem', color: '#cbd5e1', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
