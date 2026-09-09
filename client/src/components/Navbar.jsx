import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Bell, User, Terminal, LogOut, ChevronDown, Check, Activity, Sparkles, Layers } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenScanner }) {
  const { user, logout, demoAccounts, switchAccount } = useAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = async () => {
    try {
      const token = localStorage.getItem('sentrix_token');
      if (!token) return;
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('sentrix_token');
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifs();
    } catch (e) {
      // Ignore
    }
  };

  const userRole = (user?.role || user?.role_name || 'USER').toUpperCase();

  return (
    <header style={{
      background: 'rgba(9, 13, 22, 0.92)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0.85rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div 
            onClick={() => setActiveTab(userRole === 'ADMIN' ? 'admin' : userRole === 'ANALYST' ? 'analyst' : 'student')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(2, 132, 199, 0.4) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)'
            }}>
              <Shield size={22} color="#06b6d4" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#fff' }}>
                  Sentri<span style={{ color: '#06b6d4' }}>X</span>
                </span>
                <span className="radar-dot" title="SOC Telemetry Active"></span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Campus Cybersecurity Platform
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Student View Button */}
            <button
              onClick={() => setActiveTab('student')}
              className={`btn btn-sm ${activeTab === 'student' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <User size={15} /> Student Portal
            </button>

            {/* Analyst View Button (Available to Analyst & Admin) */}
            {(userRole === 'ANALYST' || userRole === 'ADMIN') && (
              <button
                onClick={() => setActiveTab('analyst')}
                className={`btn btn-sm ${activeTab === 'analyst' ? 'btn-primary' : 'btn-ghost'}`}
              >
                <Activity size={15} /> SOC Console
              </button>
            )}

            {/* Admin View Button (Available to Admin) */}
            {userRole === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`btn btn-sm ${activeTab === 'admin' ? 'btn-primary' : 'btn-ghost'}`}
              >
                <Layers size={15} /> Admin & Analytics
              </button>
            )}

            {/* Threat Intel Scanner Playground */}
            <button
              onClick={onOpenScanner}
              className="btn btn-sm btn-ghost"
              style={{ borderColor: 'rgba(6, 182, 212, 0.4)', color: '#38bdf8' }}
              title="Launch Threat Sandbox Scanner"
            >
              <Terminal size={15} /> Threat Scanner
            </button>
          </nav>
        </div>

        {/* Right side controls: Role Quick-Switcher & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Quick Demo Role Switcher Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="btn btn-sm btn-ghost"
              style={{
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                color: '#38bdf8',
                gap: '0.4rem',
                fontSize: '0.8rem'
              }}
            >
              <Sparkles size={14} color="#06b6d4" />
              <span>Role: <strong>{userRole}</strong></span>
              <ChevronDown size={14} />
            </button>

            {showRoleDropdown && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                background: '#0e1628',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                borderRadius: '12px',
                padding: '0.5rem',
                minWidth: '240px',
                boxShadow: '0 15px 40px rgba(0,0,0,0.8), 0 0 25px rgba(6, 182, 212, 0.15)',
                zIndex: 100
              }}>
                <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Switch Test Persona (1-Click):
                </div>
                {demoAccounts.map(acc => {
                  const isCurrent = acc.id === user?.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => {
                        switchAccount(acc);
                        setShowRoleDropdown(false);
                        if (acc.role_name === 'ADMIN') setActiveTab('admin');
                        else if (acc.role_name === 'ANALYST') setActiveTab('analyst');
                        else setActiveTab('student');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: isCurrent ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                        color: isCurrent ? '#38bdf8' : '#e2e8f0',
                        fontSize: '0.85rem',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                      onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{acc.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {acc.role_name} • {acc.email}
                        </div>
                      </div>
                      {isCurrent && <Check size={16} color="#06b6d4" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="btn btn-ghost btn-sm"
              style={{ position: 'relative', padding: '0.5rem' }}
              title="Notifications"
            >
              <Bell size={18} color="#94a3b8" />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  background: '#f43f5e',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(244, 63, 94, 0.6)'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                background: '#0d1527',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                width: '320px',
                maxHeight: '400px',
                overflowY: 'auto',
                boxShadow: '0 20px 50px rgba(0,0,0,0.85)',
                padding: '0.75rem',
                zIndex: 100
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Security Alerts</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: '#06b6d4', fontSize: '0.75rem', cursor: 'pointer' }}>
                      Mark all read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '8px',
                        marginBottom: '0.4rem',
                        background: n.is_read ? 'transparent' : 'rgba(6, 182, 212, 0.08)',
                        borderLeft: `3px solid ${n.type === 'ALERT' ? '#f43f5e' : n.type === 'WARNING' ? '#f59e0b' : '#06b6d4'}`
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#fff' }}>{n.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>{n.message}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                        {n.created_at}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User Profile info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: userRole === 'ADMIN' ? 'rgba(168, 85, 247, 0.3)' : userRole === 'ANALYST' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#fff'
            }}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{user?.department || 'Campus'}</div>
            </div>

            <button
              onClick={logout}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.4rem', color: '#94a3b8', marginLeft: '0.4rem' }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
