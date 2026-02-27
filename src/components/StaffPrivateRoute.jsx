import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StaffPrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/staff/login" />;
  }

  // Check if user has allowed role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/staff/dashboard" />;
  }

  // Check if user is staff (not customer)
  if (!['cook', 'delivery', 'cashier', 'admin'].includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default StaffPrivateRoute;