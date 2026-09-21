import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('fc_token') || null);
  const [loading, setLoading] = useState(true);

  // Set default auth header for axios
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  useEffect(() => {
    async function fetchMe() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`);
        setUser({
          ...res.data.user,
          restaurant: res.data.restaurant,
          reputationScore: res.data.reputationScore,
        });
      } catch (err) {
        console.warn('Auth token expired or invalid:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }
    fetchMe();
  }, [token]);

  const login = async (walletAddress, password) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, {
      walletAddress,
      password,
    });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('fc_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await axios.post(`${API_URL}/api/auth/register`, formData);
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('fc_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('fc_token');
    setToken(null);
    setUser(null);
  };

  const updateUserReputation = (newScore) => {
    setUser((prev) => (prev ? { ...prev, reputationScore: newScore } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUserReputation }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
