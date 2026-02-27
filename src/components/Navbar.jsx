import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaShoppingCart, FaUser, FaBars, FaTimes, 
  FaPhone, FaMapMarkerAlt, FaSignOutAlt,
  FaTachometerAlt, FaUsers
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

    updateCartCount();

    // Listen for storage events (for multi-tab support)
    const handleStorageChange = (e) => {
      if (e.key === 'cart') {
        updateCartCount();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event for cart updates (for same-tab updates)
    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    // Scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
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
      logout();
      navigate('/');
      setIsOpen(false);
      document.body.style.overflow = 'unset';
      
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

  // Helper to check if user is staff
  const isStaff = () => {
    return user && ['cook', 'delivery', 'cashier', 'admin'].includes(user.role);
  };

  // Get staff dashboard link based on role
  const getStaffDashboardLink = () => {
    switch(user?.role) {
      case 'cook': return '/staff/kitchen';
      case 'delivery': return '/staff/delivery';
      case 'cashier': return '/staff/cashier';
      case 'admin': return '/admin';
      default: return '/staff/dashboard';
    }
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
          {/* Logo Section - Left Aligned with Image from Public Folder */}
          <Link to="/" className="navbar-logo" onClick={closeMenu}>
            <div className="logo-image-container">
              <img 
                src="/images/sewrica-logo.jpg" 
                alt="Sewrica Restaurant" 
                className="logo-image"
              />
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
                  
                  {/* Staff Portal Link */}
                  {isStaff() && (
                    <Link 
                      to={getStaffDashboardLink()} 
                      className="dropdown-item staff-dropdown-item" 
                      onClick={closeMenu}
                    >
                      <FaUsers /> 
                      {user.role === 'admin' ? 'Admin Dashboard' : 'My Staff Dashboard'}
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
              <div className="auth-links">
                <Link to="/login" className="nav-icon user-icon-nav" title="Customer Login">
                  <FaUser />
                </Link>
                <Link to="/staff/login" className="nav-icon staff-icon-nav" title="Staff Login">
                  <FaUsers />
                </Link>
              </div>
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
            
            {/* Staff Portal Link in Mobile Menu */}
            {isStaff() && (
              <li className="mobile-nav-item" style={{ '--i': 6 }}>
                <Link 
                  to={getStaffDashboardLink()} 
                  className="mobile-nav-link staff-mobile-link" 
                  onClick={closeMenu}
                >
                  <FaUsers /> 
                  {user.role === 'admin' ? 'Admin Dashboard' : 'My Staff Dashboard'}
                </Link>
              </li>
            )}
            
            <li className="mobile-nav-item" style={{ '--i': 7 }}>
              <Link to="/cart" className="mobile-nav-link" onClick={closeMenu}>
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
            </li>
            
            {!user && (
              <>
                <li className="mobile-nav-item" style={{ '--i': 8 }}>
                  <Link to="/login" className="mobile-nav-link" onClick={closeMenu}>
                    Customer Login
                  </Link>
                </li>
                <li className="mobile-nav-item" style={{ '--i': 9 }}>
                  <Link to="/staff/login" className="mobile-nav-link" onClick={closeMenu}>
                    👨‍🍳 Staff Login
                  </Link>
                </li>
              </>
            )}
            
            {user && (
              <li className="mobile-nav-item" style={{ '--i': 10 }}>
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
                <span>Logged in as {user?.name} ({user?.role})</span>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;