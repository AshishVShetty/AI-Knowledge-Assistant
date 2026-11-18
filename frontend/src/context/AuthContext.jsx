import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken, removeToken, getUserEmail, setUserEmail, removeUserEmail } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const [email, setEmailState] = useState(getUserEmail());
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getToken()));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    removeToken();
    removeUserEmail();
    setTokenState(null);
    setEmailState(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  useEffect(() => {
    const verifyStoredAuth = async () => {
      const storedToken = getToken();
      if (!storedToken) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      try {
        const user = await api.getMe();
        if (user && user.email) {
          setTokenState(storedToken);
          setEmailState(user.email);
          setUserEmail(user.email);
          setIsAuthenticated(true);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session expired or user not found, logging out:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyStoredAuth();
  }, [logout]);

  const login = async (emailInput, password) => {
    const data = await api.login(emailInput, password);
    if (data.access_token) {
      setToken(data.access_token);
      setUserEmail(emailInput);
      setTokenState(data.access_token);
      setEmailState(emailInput);
      setIsAuthenticated(true);
    }
    return data;
  };

  const register = async (username, emailInput, password) => {
    const data = await api.register(username, emailInput, password);
    // After registration, auto-login or return data
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        email,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
