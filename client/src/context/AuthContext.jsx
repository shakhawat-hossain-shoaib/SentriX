import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sentrix_token') || null);
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch current user if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('sentrix_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('[Auth Load Error]:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  // Load demo accounts list for rapid 1-click evaluation
  useEffect(() => {
    async function loadDemoAccounts() {
      try {
        const res = await fetch('/api/auth/demo-accounts');
        const data = await res.json();
        if (data.success && data.accounts) {
          setDemoAccounts(data.accounts);
          // If no user is logged in, default to Analyst Demo for the best SOC experience
          if (!localStorage.getItem('sentrix_token') && data.accounts.length > 0) {
            const defaultUser = data.accounts.find(a => a.email === 'analyst@campus.edu') || data.accounts[0];
            if (defaultUser && defaultUser.token) {
              setToken(defaultUser.token);
              localStorage.setItem('sentrix_token', defaultUser.token);
              setUser(defaultUser);
            }
          }
        }
      } catch (err) {
        console.error('[Demo Accounts Error]:', err);
      }
    }

    loadDemoAccounts();
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Login failed');
    }
    localStorage.setItem('sentrix_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (formData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Registration failed');
    }
    localStorage.setItem('sentrix_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem('sentrix_token');
    setToken(null);
    setUser(null);
  };

  // Instant switch account helper
  const switchAccount = (account) => {
    if (account && account.token) {
      localStorage.setItem('sentrix_token', account.token);
      setToken(account.token);
      setUser(account);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      demoAccounts,
      login,
      register,
      logout,
      switchAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
