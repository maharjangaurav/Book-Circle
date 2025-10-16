import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthAPI from '../api/auth';

const AuthContext = createContext();

const TOKEN_KEY = 'bookcircle_auth_token';
const REFRESH_KEY = 'bookcircle_refresh_token';
const USER_KEY = 'bookcircle_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to load authentication data', e);
      } finally {
        setLoading(false);
      }
    };
    loadStoredAuth();
  }, []);

  const storeAuthData = async (userData, accessToken, refreshToken) => {
    try {
      if (!accessToken) return;
      await AsyncStorage.setItem(TOKEN_KEY, accessToken);
      if (refreshToken) await AsyncStorage.setItem(REFRESH_KEY, refreshToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (e) {
      console.error('Failed to store authentication data', e);
    }
  };

  const clearAuthData = async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY, USER_KEY]);
    } catch (e) {
      console.error('Failed to clear authentication data', e);
    }
  };

  // In app/context/AuthContext.js - modify the login function

const login = async (email, password) => {
  setLoading(true);
  setError(null);
  try {
    const response = await AuthAPI.login(email, password);
    
    if (!response.success) {
      const errorMessage = response.error?.message || 'Failed to login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
    
    const { access, refresh, user: userData } = response;

    if (!access) {
      setError('No access token returned from backend');
      return { success: false, error: 'No access token returned from backend' };
    }

    // Store token first
    setToken(access);
    
    // Fetch user profile to get role
    try {
      const userProfile = await AuthAPI.getUserProfile();
      if (userProfile.success) {
        // Add role to user data
        const userWithRole = { ...userData, role: userProfile.data.role };
        setUser(userWithRole);
        await storeAuthData(userWithRole, access, refresh);
      } else {
        setUser(userData);
        await storeAuthData(userData, access, refresh);
      }
    } catch (profileError) {
      console.error('Error fetching user profile:', profileError);
      setUser(userData);
      await storeAuthData(userData, access, refresh);
    }

    return { success: true };
  } catch (e) {
    console.error('Login error:', e);
    const errorMessage = e.message || 'Failed to login';
    setError(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    setLoading(false);
  }
};

const register = async (userData) => {
  setLoading(true);
  setError(null);
  try {
    const response = await AuthAPI.register(userData);
    return { success: true, data: response };
  } catch (e) {
    setError(e.message || 'Failed to register');
    return { success: false, error: e.message || 'Failed to register' };
  } finally {
    setLoading(false);
  }
};

const logout = async () => {
  setLoading(true);
  try {
    await AuthAPI.logout();
  } catch (e) {
    console.error('Logout API error', e);
  } finally {
    setUser(null);
    setToken(null);
    await clearAuthData();
    setLoading(false);
  }
};

const refreshToken = async () => {
  try {
    const storedRefresh = await AsyncStorage.getItem(REFRESH_KEY);
    if (!storedRefresh) return false;

    const response = await AuthAPI.refreshToken(storedRefresh);
    const { access } = response;

    if (access) {
      setToken(access);
      await AsyncStorage.setItem(TOKEN_KEY, access);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Token refresh failed:', e);
    await logout();
    return false;
  }
};

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        refreshToken,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
