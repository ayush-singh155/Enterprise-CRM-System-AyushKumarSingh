import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, refreshAccessToken, setAccessToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const expireSession = () => {
      setAccessToken(null);
      setUser(null);
    };
    window.addEventListener('auth:expired', expireSession);
    refreshAccessToken()
      .then((data) => {
        if (!active) return;
        setAccessToken(data.accessToken);
        setUser(data.user);
      })
      .catch(() => {
        if (active) setAccessToken(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      window.removeEventListener('auth:expired', expireSession);
    };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(email, password) {
      const { data } = await api.post('/auth/login', { email, password });
      setAccessToken(data.accessToken);
      setUser(data.user);
    },
    async logout() {
      try {
        await api.post('/auth/logout');
      } finally {
        setAccessToken(null);
        setUser(null);
      }
    }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
