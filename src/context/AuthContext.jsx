// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Use sessionStorage instead of localStorage for tab isolation
  const storage = sessionStorage;

  useEffect(() => {
    const initializeAuth = () => {
      const token = storage.getItem('token');
      const storedUser = storage.getItem('user');

      console.log('🔐 Auth Init - Token exists:', !!token);
      console.log('🔐 Auth Init - Stored user:', storedUser);

      if (token && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('🔐 Auth Init - Loaded user:', userData);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          storage.removeItem('user');
        }
      }
      setLoading(false);
      setInitialized(true);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Login attempt:', email);
      const data = await authService.login({ email, password });
      console.log('🔐 Login response:', data);
      
      if (data && data.token) {
        const userData = data.user || data;
        const normalized = {
          _id: userData.id || userData._id,
          id: userData.id || userData._id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role || 'customer'
        };
        
        console.log('🔐 Login - Normalized user:', normalized);
        console.log('🔐 Login - User role:', normalized.role);
        
        // Store in sessionStorage (tab-specific)
        storage.setItem('token', data.token);
        storage.setItem('user', JSON.stringify(normalized));
        
        setUser(normalized);
        return { success: true, user: normalized };
      }
      return { success: false, error: data.message || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Network error' };
    }
  };

  const logout = () => {
    console.log('🔐 Logout - Clearing session');
    storage.removeItem('token');
    storage.removeItem('user');
    setUser(null);
  };

  // Helper functions with null checks
  const getUserRole = () => user?.role?.toLowerCase() || null;
  
  const isAdmin = () => {
    const role = getUserRole();
    return role === 'admin';
  };
  
  const isStaff = () => {
    const role = getUserRole();
    return ['cook', 'chef', 'delivery', 'cashier'].includes(role);
  };
  
  const isChef = () => {
    const role = getUserRole();
    return role === 'cook' || role === 'chef';
  };
  
  const isDelivery = () => {
    return getUserRole() === 'delivery';
  };
  
  const isCashier = () => {
    return getUserRole() === 'cashier';
  };

  const value = {
    user,
    login,
    logout,
    loading,
    initialized,
    isAuthenticated: !!user, // Computed from user state, not storage
    // Role checkers as functions (safer)
    isAdmin: isAdmin(),
    isStaff: isStaff(),
    isChef: isChef(),
    isDelivery: isDelivery(),
    isCashier: isCashier(),
    // Also expose the role string
    userRole: getUserRole()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};