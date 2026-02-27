import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authService } from '../services/api';
import './StaffLogin.css';

const StaffLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

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
        if (user && ['cook', 'delivery', 'cashier', 'admin'].includes(user.role)) {
          toast.success(`Welcome back, ${user.name}!`);
          
          // Determine redirect path based on role
          let redirectPath = '/staff/dashboard';
          
          switch(user.role) {
            case 'cook':
              redirectPath = '/staff/kitchen';
              break;
            case 'delivery':
              redirectPath = '/staff/delivery';
              break;
            case 'cashier':
              redirectPath = '/staff/cashier';
              break;
            case 'admin':
              redirectPath = '/admin';
              break;
          }
          
          console.log('Redirecting to:', redirectPath);
          
          // METHOD 1: Try React Router navigate first
          navigate(redirectPath, { replace: true });
          
          // METHOD 2: Fallback with window.location if still on login page after 1 second
          setTimeout(() => {
            if (window.location.pathname.includes('staff/login')) {
              console.log('Navigate failed, using window.location fallback');
              window.location.href = redirectPath;
            }
          }, 1000);
          
        } else {
          toast.error('This portal is for staff only. Please use customer login.');
          authService.logout();
        }
      } else {
        toast.error(result?.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error details:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-login-container">
      <div className="staff-login-card">
        <div className="login-header">
          <div className="staff-icon">👨‍🍳</div>
          <h1>Staff Portal</h1>
          <p>SEWRICA Cafe - Employee Login</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>
              <span className="input-icon">📧</span>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>
              <span className="input-icon">🔒</span>
              Password
            </label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
                Logging in...
              </>
            ) : (
              'Login to Staff Portal'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Authorized personnel only</p>
          <div className="login-links">
            <a href="/">← Back to Customer Site</a>
            <span className="separator">|</span>
            <a href="/login">Customer Login</a>
          </div>
        </div>
      </div>

      <div className="role-icons">
        <div className="role-icon">
          <span>👨‍🍳</span>
          <small>Chefs</small>
        </div>
        <div className="role-icon">
          <span>🚚</span>
          <small>Delivery</small>
        </div>
        <div className="role-icon">
          <span>💰</span>
          <small>Cashiers</small>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;