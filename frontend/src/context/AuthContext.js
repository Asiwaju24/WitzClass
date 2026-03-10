import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import client from '../api/client';

const BASE = process.env.REACT_APP_API_URL || 'https://witzclass.onrender.com/api';
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access');
    const refresh = localStorage.getItem('refresh');

    if (!token && !refresh) {
      setLoading(false);
      return;
    }

    client.get('/auth/me/')
      .then(res => {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        setLoading(false);
      })
      .catch(async (err) => {
        const status = err.response?.status;

        if (status === 401 && refresh) {
          // Token expired — try refresh
          try {
            const { data } = await axios.post(`${BASE}/auth/refresh/`, { refresh });
            localStorage.setItem('access', data.access);
            const me = await client.get('/auth/me/', {
              headers: { Authorization: `Bearer ${data.access}` }
            });
            setUser(me.data);
            localStorage.setItem('user', JSON.stringify(me.data));
          } catch {
            // Refresh failed — clear and logout
            localStorage.clear();
            setUser(null);
          }
        } else if (status === 401) {
          // No refresh token — clear
          localStorage.clear();
          setUser(null);
        }
        // For network errors (no status) — keep existing user from localStorage
        // This handles Render's 50s cold start without logging user out
        setLoading(false);
      });
  }, []);

  const login = (userData, accessToken, refreshToken) => {
    localStorage.setItem('access', accessToken);
    localStorage.setItem('refresh', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
