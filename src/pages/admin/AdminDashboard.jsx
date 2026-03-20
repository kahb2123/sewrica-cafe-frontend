// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import { useSocket } from '../../context/SocketContext';
import './AdminDashboard.css';

// Import components
import ConnectionStatus from './components/ConnectionStatus';
import Sidebar from './components/Sidebar';

// Import all tab components
import OverviewTab from './tabs/OverviewTab';
import OrdersTab from './tabs/OrdersTab';
import StaffTab from './tabs/StaffTab';
import MenuTab from './tabs/MenuTab';
import ReportsTab from './tabs/ReportsTab';
import UsersTab from './tabs/UsersTab';
import StaffReportsTab from './tabs/StaffReportsTab';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { onNewOrder, connected } = useSocket();
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalMenuItems: 0,
    totalUsers: 0,
    todayOrders: 0,
    todayRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  // Listen for new orders via socket
  useEffect(() => {
    if (connected && onNewOrder) {
      const unsubscribe = onNewOrder((data) => {
        toast.info(`🆕 New order #${data.orderNumber} received!`);
        if (activeTab === 'overview') {
          fetchDashboardStats();
        }
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [connected, activeTab, onNewOrder]);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return;
      }
      
      try {
        const userData = JSON.parse(userStr);
        if (userData.role !== 'admin') {
          toast.error('Admin access required');
          navigate('/');
        }
      } catch (error) {
        console.error('Error parsing user:', error);
        navigate('/login');
      }
    };
    
    checkAdmin();
  }, [navigate]);

  // Fetch dashboard stats
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleMenuClick = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth <= 768) {
      setMobileMenuOpen(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching stats from API...');
      const data = await adminService.getStats();
      console.log('✅ Stats received from API:', data);
      setStats(data);
    } catch (error) {
      console.error('❌ API Error:', error);
      if (error.response) {
        console.log('Error response:', error.response.status, error.response.data);
      }
      // Fallback mock data
      setStats({
        totalOrders: 156,
        totalRevenue: 45230,
        pendingOrders: 8,
        totalMenuItems: 42,
        totalUsers: 124,
        todayOrders: 12,
        todayRevenue: 3450
      });
      toast.warning('Using demo data - API connection issue');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} onRefresh={fetchDashboardStats} />;
      case 'orders':
        return <OrdersTab />;
      case 'staff':
        return <StaffTab />;
      case 'menu':
        return <MenuTab />;
      case 'reports':
        return <ReportsTab />;
      case 'users':
        return <UsersTab />;
      case 'staff-reports':
        return <StaffReportsTab />;
      default:
        return <OverviewTab stats={stats} onRefresh={fetchDashboardStats} />;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <ConnectionStatus connected={connected} />
      
      <button 
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? '✕' : '☰'}
      </button>

      <Sidebar 
        activeTab={activeTab}
        onMenuClick={handleMenuClick}
        mobileMenuOpen={mobileMenuOpen}
        user={user}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="admin-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;