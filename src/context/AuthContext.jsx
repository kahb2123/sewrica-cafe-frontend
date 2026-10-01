// src/context/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService, ROLE_PERMISSIONS, ROLE_HIERARCHY, PAGE_ACCESS } from '../services/api';

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
  const [userPermissions, setUserPermissions] = useState([]);
  const [userPageAccess, setUserPageAccess] = useState({});

  // Use sessionStorage instead of localStorage for tab isolation
  const storage = sessionStorage;

  const fetchPermissions = async () => {
    const token = storage.getItem('token');
    if (!token) return;
    try {
      const data = await authService.getPermissions();
      if (data && data.success !== false) {
        const perms = data.permissions || [];
        setUserPermissions(perms);

        const mergedPageAccess = {};
        const role = data.role || 'customer';
        for (const [page, access] of Object.entries(PAGE_ACCESS)) {
          const override = (data.pageAccessOverrides || {})[page];
          if (override) {
            mergedPageAccess[page] = {
              canRead: override.canRead ?? access.read.includes(role),
              canWrite: override.canWrite ?? access.write.includes(role),
            };
          } else {
            mergedPageAccess[page] = {
              canRead: access.read.includes(role),
              canWrite: access.write.includes(role),
            };
          }
        }
        setUserPageAccess(mergedPageAccess);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
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
      if (token) {
        await fetchPermissions();
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Login attempt:', email);
      const data = await authService.login(email, password);
      console.log('🔐 Login response:', data);
      
      if (data && data.success && data.token) {
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
        
        storage.setItem('token', data.token);
        storage.setItem('user', JSON.stringify(normalized));
        setUser(normalized);

        await fetchPermissions();
        
        return { success: true, user: normalized };
      }
      return { success: false, error: data?.error || data?.message || 'Login failed' };
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

   const getUserPermissions = () => {
    if (userPermissions.length) return userPermissions;
    const role = getUserRole();
    return ROLE_PERMISSIONS[role] || [];
  };
  
  const hasPermission = (permission) => {
    if (userPermissions.length) return userPermissions.includes(permission);
    const role = getUserRole();
    const perms = ROLE_PERMISSIONS[role] || [];
    return perms.includes(permission);
  };
  
  const hasRole = (...allowedRoles) => {
    const role = getUserRole();
    return allowedRoles.includes(role);
  };
  
  const hasRoleOrHigher = (minRole) => {
    const role = getUserRole();
    const userLevel = ROLE_HIERARCHY[role] ?? -1;
    const minLevel = ROLE_HIERARCHY[minRole] ?? -1;
    return userLevel >= minLevel;
  };
  
  const canReadPage = (page) => {
    if (userPageAccess[page]) return userPageAccess[page].canRead;
    const role = getUserRole();
    return PAGE_ACCESS[page]?.read.includes(role) || false;
  };
  
  const canWritePage = (page) => {
    if (userPageAccess[page]) return userPageAccess[page].canWrite;
    const role = getUserRole();
    return PAGE_ACCESS[page]?.write.includes(role) || false;
  };
  
  const getPageAccess = () => {
    if (Object.keys(userPageAccess).length) return userPageAccess;
    const role = getUserRole();
    const result = {};
    for (const [page, access] of Object.entries(PAGE_ACCESS)) {
      result[page] = {
        canRead: access.read.includes(role),
        canWrite: access.write.includes(role),
      };
    }
    return result;
  };

  const value = {
    user,
    login,
    logout,
    loading,
    initialized,
    isAuthenticated: !!user,
    isAdmin: isAdmin(),
    isStaff: isStaff(),
    isChef: isChef(),
    isDelivery: isDelivery(),
    isCashier: isCashier(),
    userRole: getUserRole(),
    userPermissions: getUserPermissions(),
    hasPermission,
    hasRole,
    hasRoleOrHigher,
    canReadPage,
    canWritePage,
    getPageAccess,
    refetchPermissions: fetchPermissions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};