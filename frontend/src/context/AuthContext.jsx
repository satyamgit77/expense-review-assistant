import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { TOKEN_KEY } from '../services/api';
import { AuthContext } from './authStore';

// Login response me user.id aata hai, /auth/me me user._id
const normalizeUser = (u) => ({
  id: u.id || u._id,
  name: u.name,
  email: u.email,
  role: u.role,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Token pehle se hai to pehle uski jaanch hogi, tab tak loading
  const [loading, setLoading] = useState(() => !!localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;

    api
      .get('/auth/me')
      .then((res) => setUser(normalizeUser(res.data.user)))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = (data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(normalizeUser(data.user));
  };

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    saveSession(res.data);
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    saveSession(res.data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}