// src/pages/admin/components/Sidebar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ activeTab, onMenuClick, mobileMenuOpen, user, onClose }) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'orders', icon: '📦', label: 'Orders' },
    { id: 'staff', icon: '👨‍🍳', label: 'Staff' },
    { id: 'menu', icon: '🍽️', label: 'Menu Items' },
    { id: 'inventory', icon: '📦', label: 'Inventory' },
    { id: 'reports', icon: '📈', label: 'Reports' },
    { id: 'users', icon: '👥', label: 'Users' },
    { id: 'staff-reports', icon: '📋', label: 'Staff Reports' },
    { id: 'lottery', icon: '🎲', label: 'Lottery' },
    { id: 'giveaway', icon: '🎁', label: 'Giveaway' }
  ];

  return (
    <>
      <div className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Sewrica Cafe</h2>
          <p>Admin Panel</p>
        </div>
        
        <ul className="sidebar-menu">
          {menuItems.map(item => (
            <li 
              key={item.id}
              className={activeTab === item.id ? 'active' : ''} 
              onClick={() => onMenuClick(item.id)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-text">{item.label}</span>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.name || 'Admin'}</span>
            <span className="user-role">{user?.role || 'admin'}</span>
          </div>
          <button className="logout-btn" onClick={() => navigate('/')}>
            ← Back to Site
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="sidebar-overlay" onClick={onClose}></div>
      )}
    </>
  );
};

export default Sidebar;