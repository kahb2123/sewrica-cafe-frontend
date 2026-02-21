import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaEnvelope, FaLock, FaUser, FaEye, 
  FaEyeSlash, FaGoogle, FaFacebook, 
  FaUtensils, FaArrowLeft, FaCheckCircle,
  FaPhone
} from 'react-icons/fa';
import { MdRestaurantMenu } from 'react-icons/md';
import { toast } from 'react-toastify';
import { authService } from '../services/api';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  // Form errors state
  const [errors, setErrors] = useState({});

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Validate login form
  const validateLogin = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    return newErrors;
  };

  // Validate signup form
  const validateSignup = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = isLogin ? validateLogin() : validateSignup();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    
    try {
      if (isLogin) {
        // REAL LOGIN - using your backend API
        const userData = await authService.login({
          email: formData.email,
          password: formData.password
        });
        
        toast.success(`Welcome back, ${userData.name || 'User'}!`);
        navigate('/');
      } else {
        // REAL REGISTRATION - using your backend API
        await authService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone
        });
        
        toast.success('Account created successfully!');
        navigate('/');
      }
    } catch (error) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle social login
  const handleSocialLogin = (provider) => {
    toast.info(`Login with ${provider} coming soon!`);
  };

  // Toggle between login and signup
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: ''
    });
  };

  return (
    <div className="login-page">
      {/* Background Decoration */}
      <div className="login-bg">
        <div className="bg-circle circle1"></div>
        <div className="bg-circle circle2"></div>
        <div className="bg-circle circle3"></div>
      </div>

      <div className="login-container">
        {/* Left Side - Branding */}
        <div className="login-brand">
          <div className="brand-content">
            <Link to="/" className="back-home">
              <FaArrowLeft /> Back to Home
            </Link>
            
            <div className="brand-logo">
              <div className="logo-circle">
                <FaUtensils />
              </div>
              <h1 className="brand-name">SEWRICA</h1>
              <p className="brand-tagline">Cafe & Restaurant</p>
            </div>

            <div className="brand-features">
              <div className="brand-feature">
                <FaCheckCircle className="feature-check" />
                <span>Best City View in Addis</span>
              </div>
              <div className="brand-feature">
                <FaCheckCircle className="feature-check" />
                <span>Authentic Ethiopian Cuisine</span>
              </div>
              <div className="brand-feature">
                <FaCheckCircle className="feature-check" />
                <span>Free Delivery Available</span>
              </div>
              <div className="brand-feature">
                <FaCheckCircle className="feature-check" />
                <span>24/7 Customer Support</span>
              </div>
            </div>

            <div className="brand-quote">
              "Experience the best city view while enjoying delicious Ethiopian cuisine."
            </div>

            <Link to="/menu" className="browse-menu">
              <MdRestaurantMenu /> Browse Menu
            </Link>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-container">
          <div className="form-wrapper">
            {/* Header */}
            <div className="form-header">
              <h2 className="form-title">
                {isLogin ? 'Welcome Back!' : 'Create Account'}
              </h2>
              <p className="form-subtitle">
                {isLogin 
                  ? 'Sign in to continue to SEWRICA Cafe' 
                  : 'Join us to enjoy exclusive offers and faster checkout'}
              </p>
            </div>

            {/* Social Login Buttons */}
            <div className="social-login">
              <button 
                className="social-btn google"
                onClick={() => handleSocialLogin('Google')}
              >
                <FaGoogle /> Google
              </button>
              <button 
                className="social-btn facebook"
                onClick={() => handleSocialLogin('Facebook')}
              >
                <FaFacebook /> Facebook
              </button>
            </div>

            <div className="divider">
              <span className="divider-line"></span>
              <span className="divider-text">or</span>
              <span className="divider-line"></span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="login-form">
              {!isLogin && (
                <>
                  {/* Name Field - Signup Only */}
                  <div className="form-group">
                    <label htmlFor="name">
                      <FaUser className="input-icon" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className={errors.name ? 'error' : ''}
                    />
                    {errors.name && <span className="error-message">{errors.name}</span>}
                  </div>

                  {/* Phone Field - Signup Only */}
                  <div className="form-group">
                    <label htmlFor="phone">
                      <FaPhone className="input-icon" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+251 911 234 567"
                      className={errors.phone ? 'error' : ''}
                    />
                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                  </div>
                </>
              )}

              {/* Email Field - Both */}
              <div className="form-group">
                <label htmlFor="email">
                  <FaEnvelope className="input-icon" />
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              {/* Password Field - Both */}
              <div className="form-group">
                <label htmlFor="password">
                  <FaLock className="input-icon" />
                  Password *
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className={errors.password ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              {/* Confirm Password Field - Signup Only */}
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    <FaLock className="input-icon" />
                    Confirm Password *
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className={errors.confirmPassword ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>
              )}

              {/* Remember Me & Forgot Password - Login Only */}
              {isLogin && (
                <div className="form-options">
                  <label className="remember-me">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="forgot-password">
                    Forgot Password?
                  </Link>
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Toggle between Login and Signup */}
            <div className="toggle-mode">
              <p>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button 
                  type="button"
                  onClick={toggleMode}
                  className="toggle-btn"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>

            {/* Terms and Privacy */}
            <p className="terms-text">
              By continuing, you agree to our{' '}
              <Link to="/terms">Terms of Service</Link> and{' '}
              <Link to="/privacy">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;