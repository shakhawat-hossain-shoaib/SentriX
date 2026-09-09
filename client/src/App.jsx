import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import StudentDashboard from './pages/StudentDashboard';
import AnalystDashboard from './pages/AnalystDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ThreatScannerModal from './components/ThreatScannerModal';
import { Shield, Lock, Activity, Sparkles, UserPlus, LogIn } from 'lucide-react';

function AppContent() {
  const { user, token, loading, login, register, demoAccounts, switchAccount } = useAuth();
  const [activeTab, setActiveTab] = useState('student');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Auth form states (for manual login/register)
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Sync tab on user role change
  React.useEffect(() => {
    if (user) {
      const role = (user.role || user.role_name || '').toUpperCase();
      if (role === 'ADMIN') setActiveTab('admin');
      else if (role === 'ANALYST') setActiveTab('analyst');
      else setActiveTab('student');
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        color: '#94a3b8'
      }}>
        <div className="radar-dot" style={{ width: '24px', height: '24px' }}></div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>Initializing SentriX SOC Environment...</div>
      </div>
    );
  }

  // If not logged in, show Auth Portal
  if (!user || !token) {
    const handleAuthSubmit = async (e) => {
      e.preventDefault();
      setAuthLoading(true);
      setAuthError(null);
      try {
        if (isRegisterMode) {
          await register({ name, email, password, department });
        } else {
          await login(email, password);
        }
      } catch (err) {
        setAuthError(err.message);
      } finally {
        setAuthLoading(false);
      }
    };

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', position: 'relative' }}>
          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(2, 132, 199, 0.5) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              boxShadow: '0 0 30px rgba(6, 182, 212, 0.4)'
            }}>
              <Shield size={32} color="#06b6d4" />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Sentri<span style={{ color: '#06b6d4' }}>X</span> Portal
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>
              Campus Cybersecurity Incident Reporting & Mini-SOC Platform
            </p>
          </div>

          {/* Quick Demo Login Buttons */}
          <div style={{
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
              <Sparkles size={14} /> Instant Demo Access (1-Click Login):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
              {demoAccounts.slice(0, 3).map(acc => (
                <button
                  key={acc.id}
                  onClick={() => switchAccount(acc)}
                  className="btn btn-sm btn-ghost"
                  style={{ fontSize: '0.75rem', padding: '0.4rem' }}
                >
                  {acc.role_name === 'ADMIN' ? 'Admin' : acc.role_name === 'ANALYST' ? 'Analyst' : 'Student'}
                </button>
              ))}
            </div>
          </div>

          {authError && (
            <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '8px', color: '#fb7185', fontSize: '0.85rem' }}>
              {authError}
            </div>
          )}

          {/* Manual Form */}
          <form onSubmit={handleAuthSubmit}>
            {isRegisterMode && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Abid Khan"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department / Faculty</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Computer Science & Engineering"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="student@campus.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '0.5rem', marginTop: '0.5rem' }} disabled={authLoading}>
              {isRegisterMode ? <UserPlus size={16} /> : <LogIn size={16} />}
              {authLoading ? 'Authenticating...' : isRegisterMode ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <button
              onClick={() => { setIsRegisterMode(!isRegisterMode); setAuthError(null); }}
              style={{ background: 'none', border: 'none', color: '#06b6d4', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'student' && <StudentDashboard />}
        {activeTab === 'analyst' && <AnalystDashboard onOpenScanner={() => setIsScannerOpen(true)} />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      <ThreatScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
