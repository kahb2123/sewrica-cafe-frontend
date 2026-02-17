import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaBars, FaTimes, FaUtensils, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getCartCount = () => {
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

    const checkLoginStatus = () => {
      try {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        
        if (token && token !== 'undefined' && token !== 'null') {
          setIsLoggedIn(true);
          setUserRole(role || 'customer');
        } else {
          setIsLoggedIn(false);
          setUserRole('');
        }
      } catch (error) {
        console.error('Error checking login:', error);
        setIsLoggedIn(false);
        setUserRole('');
      }
    };

    getCartCount();
    checkLoginStatus();

    const handleStorageChange = (e) => {
      if (e.key === 'cart') getCartCount();
      if (e.key === 'token' || e.key === 'userRole') checkLoginStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', getCartCount);

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', getCartCount);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      setIsLoggedIn(false);
      setUserRole('');
      navigate('/');
      setIsOpen(false);
      document.body.style.overflow = 'unset';
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error during logout:', error);
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
              <span className="restaurant-name">Megenagna</span>
              <span className="restaurant-cuisine">Ethiopian Cuisine</span>
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
            <Link to="/cart" className="nav-icon cart-icon-nav">
              <FaShoppingCart />
              {cartCount > 0 && <span className="cart-badge-nav">{cartCount}</span>}
            </Link>

            {/* User Icon / Login */}
            {isLoggedIn ? (
              <button onClick={handleLogout} className="nav-icon user-icon-nav" title="Logout">
                <FaUser />
              </button>
            ) : (
              <Link to="/login" className="nav-icon user-icon-nav" title="Login">
                <FaUser />
              </Link>
            )}

            {/* Admin Link - Only for admin */}
            {userRole === 'admin' && (
              <Link to="/admin" className="admin-link">
                Admin
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
            {userRole === 'admin' && (
              <li className="mobile-nav-item" style={{ '--i': 4 }}>
                <Link to="/admin" className="mobile-nav-link" onClick={closeMenu}>
                  Admin
                </Link>
              </li>
            )}
            <li className="mobile-nav-item" style={{ '--i': 5 }}>
              <Link to="/cart" className="mobile-nav-link" onClick={closeMenu}>
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
            </li>
            {!isLoggedIn && (
              <li className="mobile-nav-item" style={{ '--i': 6 }}>
                <Link to="/login" className="mobile-nav-link" onClick={closeMenu}>
                  Login
                </Link>
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
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;