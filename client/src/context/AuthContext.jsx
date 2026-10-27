import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('campusfix-token')));

  useEffect(() => {
    if (!localStorage.getItem('campusfix-token')) return;
    api.me().then((result) => setUser(result.data)).catch(() => {
      localStorage.removeItem('campusfix-token');
    }).finally(() => setLoading(false));
  }, []);

  async function authenticate(action, values) {
    const result = await action(values);
    localStorage.setItem('campusfix-token', result.data.token);
    setUser(result.data.user);
    return result.data.user;
  }

  function logout() {
    localStorage.removeItem('campusfix-token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login: (values) => authenticate(api.login, values), register: (values) => authenticate(api.register, values), logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}