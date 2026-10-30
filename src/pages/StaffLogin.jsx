// src/pages/StaffLogin.jsx (updated redirect logic)
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { authService } from '../services/api';
import { useLanguage } from '../context/useLanguage';
import './StaffLogin.css';

const StaffLogin = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting login with:', email);
      
      const result = await authService.login(email, password);
      console.log('Login result:', result);
      
      if (result && result.success) {
        const user = result.user;
        console.log('Logged in user:', user);
        console.log('User role:', user?.role);
        
         // Check if user is staff (not customer)
         if (user && ['cook', 'chef', 'delivery', 'cashier', 'waiter', 'admin', 'supply_chain'].includes(user.role)) {
          toast.success(`Welcome back, ${user.name}!`);
          
          const permData = await authService.getPermissions();
          const pageAccess = permData.pageAccess || {};
          let redirectPath = '/staff/dashboard';
          
           if (pageAccess.adminDashboard?.canRead && user.role !== 'supply_chain') {
             redirectPath = '/admin';
           } else if (user.role === 'supply_chain') {
             redirectPath = '/supply-chain';
           } else if (pageAccess.staffDashboard?.canRead) {
            redirectPath = '/staff/dashboard';
          }
          
          console.log('Redirecting to:', redirectPath);
          window.location.href = redirectPath;
          
        } else {
          toast.error('This portal is for staff only. Please use customer login.');
          authService.logout();
        }
      } else {
        toast.error(result?.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error details:', error);
      toast.error(error.response?.data?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-login-container">
      <div className="staff-login-card">
        <div className="login-header">
          <div className="staff-icon">👨‍🍳</div>
          <h1>{t('Staff Portal')}</h1>
          <p>SEWRICA Cafe - {t('Employee Login')}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>
              <span className="input-icon">📧</span>
              {t('Email Address')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('Enter your work email')}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>
              <span className="input-icon">🔒</span>
              {t('Password')}
            </label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('Enter your password')}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                {t('Logging in...')}
              </>
            ) : (
              t('Login to Staff Portal')
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>{t('Authorized personnel only')}</p>
          <div className="login-links">
            <a href="/">← {t('Back to Customer Site')}</a>
            <span className="separator">|</span>
            <a href="/login">{t('Customer Login')}</a>
          </div>
        </div>
      </div>

      <div className="role-icons">
        <div className="role-icon">
          <span>👨‍🍳</span>
          <small>{t('Chefs')}</small>
        </div>
        <div className="role-icon">
          <span>🚚</span>
          <small>{t('Delivery')}</small>
        </div>
        <div className="role-icon">
          <span>💰</span>
          <small>{t('Cashiers')}</small>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;