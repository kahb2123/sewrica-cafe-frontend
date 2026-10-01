// src/pages/admin/components/Sidebar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ activeTab, onMenuClick, mobileMenuOpen, user, onClose }) => {
  const navigate = useNavigate();
  const { canReadPage } = useAuth();

  const menuItems = [
    { id: 'overview', icon: '📊', label: 'Overview', page: 'adminDashboard' },
    { id: 'orders', icon: '📦', label: 'Orders', page: 'adminOrders' },
    { id: 'kitchen', icon: '🍳', label: 'Kitchen Display', page: 'staffOrdersCooking' },
    { id: 'staff', icon: '👨‍🍳', label: 'Staff', page: 'adminStaff' },
    { id: 'menu', icon: '🍽️', label: 'Menu Items', page: 'adminMenu' },
    { id: 'stock', icon: '🔄', label: 'Stock In / Out', page: 'adminIngredients' },
    { id: 'expenses', icon: '💸', label: 'Expenses', page: 'adminExpenses' },
    { id: 'reports', icon: '📈', label: 'Reports', page: 'adminReports' },
    { id: 'users', icon: '👥', label: 'Users', page: 'adminUsers' },
    { id: 'lottery', icon: '🎲', label: 'Lottery' },
    { id: 'giveaway', icon: '🎁', label: 'Giveaway' },
    { id: 'permissions', icon: '🔐', label: 'Permissions' }
  ];

  const visibleMenuItems = menuItems.filter(item => {
    if (!item.page) return true;
    return canReadPage(item.page);
  });

  return (
    <>
      <div className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Sewrica Cafe</h2>
          <p>Admin Panel</p>
        </div>
        
        <ul className="sidebar-menu">
          {visibleMenuItems.map(item => (
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