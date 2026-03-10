import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import client from '../api/client';

const BASE = process.env.REACT_APP_API_URL || 'https://witzclass.onrender.com/api';
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access');
    const refresh = localStorage.getItem('refresh');
    const savedUser = localStorage.getItem('user');

    if (!token && !refresh) {
      setLoading(false);
      return;
    }

    // Use saved user immediately to avoid flash
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch {}
    }

    // Try to fetch fresh user data
    client.get('/auth/me/')
      .then(res => {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      })
      .catch(async () => {
        // Access token failed — try refreshing
        if (refresh) {
          try {
            const { data } = await axios.post(`${BASE}/auth/refresh/`, { refresh });
            localStorage.setItem('access', data.access);
            const me = await client.get('/auth/me/', {
              headers: { Authorization: `Bearer ${data.access}` }
            });
            setUser(me.data);
            localStorage.setItem('user', JSON.stringify(me.data));
          } catch {
            // Refresh also failed — truly logged out
            localStorage.clear();
            setUser(null);
          }
        } else {
          localStorage.clear();
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
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
