import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('access')) {
      API.get('/auth/me/').then(r => setUser(r.data)).catch(() => localStorage.clear()).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (username, password) => {
    const { data } = await API.post('/auth/login/', { username, password });
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    const me = await API.get('/auth/me/');
    setUser(me.data);
    return me.data;
  };

  const register = async (payload) => {
    const { data } = await API.post('/auth/register/', payload);
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    setUser(data.user);
    return data.user;
  };

  const logout = () => { localStorage.clear(); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
