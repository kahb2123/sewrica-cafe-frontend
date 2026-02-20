import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaShoppingCart, FaUser, FaBars, FaTimes, 
  FaUtensils, FaPhone, FaMapMarkerAlt, FaSignOutAlt,
  FaTachometerAlt  // Added for Admin Dashboard
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    // Load cart count from localStorage
    const updateCartCount = () => {
      try {
        const cart = localStorage.getItem('cart');
        if (cart) {
          const parsedCart = JSON.parse(cart);
          if (Array.isArray(parsedCart)) {
            const count = parsedCart.reduce((total, item) => {
              return total + (item?.quantity || 1);
            }, 0);
            setCartCount(count);
          } else {
            setCartCount(0);
          }
        } else {
          setCartCount(0);
        }
      } catch (error) {
        console.error('Error reading cart:', error);
        setCartCount(0);
      }
    };

    // Check login status from AuthContext
    const checkLoginStatus = () => {
      if (user) {
        // User is already available from useAuth
      }
    };

    updateCartCount();
    checkLoginStatus();

    // Listen for storage events (for multi-tab support)
    const handleStorageChange = (e) => {
      if (e.key === 'cart') {
        updateCartCount();
      }
      if (e.key === 'user' || e.key === 'token') {
        checkLoginStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event for cart updates (for same-tab updates)
    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    // Custom event for auth updates
    const handleAuthUpdate = () => {
      checkLoginStatus();
    };

    window.addEventListener('authUpdated', handleAuthUpdate);

    // Scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('authUpdated', handleAuthUpdate);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    // Prevent body scroll when menu is open
    if (!isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  const handleLogout = () => {
    try {
      logout(); // Clear token and user from localStorage
      navigate('/');
      setIsOpen(false);
      document.body.style.overflow = 'unset';
      
      // Dispatch custom event for other components
      window.dispatchEvent(new Event('authUpdated'));
      
      toast.success('Logged out successfully!');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Logout failed');
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    document.body.style.overflow = 'unset';
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <>
      {/* Top Bar with Address and Phone */}
      <div className="top-bar">
        <div className="top-bar-container">
          <div className="top-bar-info">
            <FaMapMarkerAlt className="top-bar-icon" />
            <span>Megenagna, Metebaber Building, 2nd Floor</span>
          </div>
          <div className="top-bar-info">
            <FaPhone className="top-bar-icon" />
            <span>+251 911 234 567</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          {/* Logo Section - Left Aligned */}
          <Link to="/" className="navbar-logo" onClick={closeMenu}>
            <div className="logo-circle">
              <FaUtensils className="logo-icon" />
            </div>
            <div className="logo-text">
              <span className="restaurant-name">SEWRICA</span>
              <span className="restaurant-cuisine">Cafe & Restaurant</span>
            </div>
          </Link>

          {/* Desktop Navigation - Centered */}
          <ul className="nav-menu-desktop">
            <li className="nav-item">
              <Link to="/" className={`nav-link ${isActive('/')}`}>
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/menu" className={`nav-link ${isActive('/menu')}`}>
                Menu
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/contact" className={`nav-link ${isActive('/contact')}`}>
                Contact
              </Link>
            </li>
          </ul>

          {/* Right Side Icons */}
          <div className="nav-right">
            {/* Cart Icon */}
            <Link to="/cart" className="nav-icon cart-icon-nav" title="Shopping Cart">
              <FaShoppingCart />
              {cartCount > 0 && <span className="cart-badge-nav">{cartCount}</span>}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="user-menu">
                <button className="user-menu-btn" title="User Menu">
                  <FaUser className="user-icon" />
                  <span className="user-name">{user?.name?.split(' ')[0] || 'User'}</span>
                </button>
                <div className="user-dropdown">
                  <Link to="/profile" className="dropdown-item" onClick={closeMenu}>
                    <FaUser /> My Profile
                  </Link>
                  
                  {/* Admin Dashboard Link - Updated with better styling */}
                  {user?.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="dropdown-item admin-dropdown-item" 
                      onClick={closeMenu}
                      style={{
                        background: '#f0f9ff',
                        borderLeft: '4px solid #27ae60',
                        fontWeight: '600'
                      }}
                    >
                      <FaTachometerAlt style={{ color: '#27ae60' }} /> Admin Dashboard
                    </Link>
                  )}
                  
                  {user?.role === 'cashier' && (
                    <Link to="/cashier" className="dropdown-item" onClick={closeMenu}>
                      <FaUtensils /> Cashier Panel
                    </Link>
                  )}
                  {user?.role === 'cook' && (
                    <Link to="/kitchen" className="dropdown-item" onClick={closeMenu}>
                      <FaUtensils /> Kitchen View
                    </Link>
                  )}
                  {user?.role === 'delivery' && (
                    <Link to="/delivery" className="dropdown-item" onClick={closeMenu}>
                      <FaUtensils /> Delivery Dashboard
                    </Link>
                  )}
                  <Link to="/orders" className="dropdown-item" onClick={closeMenu}>
                    <FaShoppingCart /> My Orders
                  </Link>
                  <button onClick={handleLogout} className="dropdown-item logout-item">
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="nav-icon user-icon-nav" title="Login">
                <FaUser />
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <div className="menu-icon" onClick={toggleMenu}>
              {isOpen ? <FaTimes /> : <FaBars />}
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`mobile-menu-overlay ${isOpen ? 'active' : ''}`}>
          <ul className="nav-menu-mobile">
            <li className="mobile-nav-item" style={{ '--i': 1 }}>
              <Link to="/" className="mobile-nav-link" onClick={closeMenu}>
                Home
              </Link>
            </li>
            <li className="mobile-nav-item" style={{ '--i': 2 }}>
              <Link to="/menu" className="mobile-nav-link" onClick={closeMenu}>
                Menu
              </Link>
            </li>
            <li className="mobile-nav-item" style={{ '--i': 3 }}>
              <Link to="/contact" className="mobile-nav-link" onClick={closeMenu}>
                Contact
              </Link>
            </li>
            
            {user && (
              <>
                <li className="mobile-nav-item" style={{ '--i': 4 }}>
                  <Link to="/profile" className="mobile-nav-link" onClick={closeMenu}>
                    My Profile
                  </Link>
                </li>
                <li className="mobile-nav-item" style={{ '--i': 5 }}>
                  <Link to="/orders" className="mobile-nav-link" onClick={closeMenu}>
                    My Orders
                  </Link>
                </li>
              </>
            )}
            
            {/* Admin Dashboard in Mobile Menu */}
            {user?.role === 'admin' && (
              <li className="mobile-nav-item" style={{ '--i': 6 }}>
                <Link 
                  to="/admin" 
                  className="mobile-nav-link admin-mobile-link" 
                  onClick={closeMenu}
                  style={{
                    background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                    color: 'white',
                    borderRadius: '8px',
                    margin: '5px 15px',
                    padding: '12px 20px',
                    fontWeight: 'bold'
                  }}
                >
                  <FaTachometerAlt style={{ marginRight: '10px' }} /> Admin Dashboard
                </Link>
              </li>
            )}
            
            {user?.role === 'cashier' && (
              <li className="mobile-nav-item" style={{ '--i': 6 }}>
                <Link to="/cashier" className="mobile-nav-link" onClick={closeMenu}>
                  Cashier Panel
                </Link>
              </li>
            )}
            
            {user?.role === 'cook' && (
              <li className="mobile-nav-item" style={{ '--i': 6 }}>
                <Link to="/kitchen" className="mobile-nav-link" onClick={closeMenu}>
                  Kitchen View
                </Link>
              </li>
            )}
            
            {user?.role === 'delivery' && (
              <li className="mobile-nav-item" style={{ '--i': 6 }}>
                <Link to="/delivery" className="mobile-nav-link" onClick={closeMenu}>
                  Delivery Dashboard
                </Link>
              </li>
            )}
            
            <li className="mobile-nav-item" style={{ '--i': 7 }}>
              <Link to="/cart" className="mobile-nav-link" onClick={closeMenu}>
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
            </li>
            
            {!user && (
              <li className="mobile-nav-item" style={{ '--i': 8 }}>
                <Link to="/login" className="mobile-nav-link" onClick={closeMenu}>
                  Login / Sign Up
                </Link>
              </li>
            )}
            
            {user && (
              <li className="mobile-nav-item" style={{ '--i': 9 }}>
                <button onClick={handleLogout} className="mobile-nav-link logout-mobile">
                  Logout
                </button>
              </li>
            )}
          </ul>
          
          {/* Mobile Address */}
          <div className="mobile-menu-address">
            <div className="mobile-address-item">
              <FaMapMarkerAlt className="mobile-address-icon" />
              <span>Megenagna, Metebaber Building, 2nd Floor</span>
            </div>
            <div className="mobile-address-item">
              <FaPhone className="mobile-address-icon" />
              <span>+251 911 234 567</span>
            </div>
            {user && (
              <div className="mobile-address-item user-info">
                <FaUser className="mobile-address-icon" />
                <span>Logged in as {user?.name}</span>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;