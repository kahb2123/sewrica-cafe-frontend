// src/pages/admin/tabs/OverviewTab.jsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../../services/api';
import { useLanguage } from '../../../context/useLanguage';
import './OverviewTab.css';

const OverviewTab = ({ stats, onRefresh }) => {
  const { language, t } = useLanguage();
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      const data = await adminService.getRecentOrders();
      setRecentOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      setRecentOrders([
        { _id: 'ORD001', customer: { name: 'John Doe' }, items: [{ name: 'Burger' }], totalAmount: 450, status: 'pending', createdAt: new Date().toISOString() },
        { _id: 'ORD002', customer: { name: 'Jane Smith' }, items: [{ name: 'Pizza' }], totalAmount: 650, status: 'confirmed', createdAt: new Date().toISOString() },
        { _id: 'ORD003', customer: { name: 'Bob Johnson' }, items: [{ name: 'Pasta' }], totalAmount: 380, status: 'delivered', createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const locale = language === 'am' ? 'am-ET' : language === 'om' ? 'om-ET' : 'en-US';
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const safeStats = stats || {
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalMenuItems: 0,
    totalUsers: 0,
    todayOrders: 0,
    todayRevenue: 0
  };

  return (
    <div className="overview-tab">
      <div className="tab-header">
        <h1 className="page-title">{t('Dashboard Overview')}</h1>
        <button className="btn-refresh" onClick={onRefresh} title={t('Refresh Data')}>
          🔄 {t('Refresh')}
        </button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-details">
            <h3>{t('Total Orders')}</h3>
            <p className="stat-number">{safeStats.totalOrders}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-details">
            <h3>{t('Total Revenue')}</h3>
            <p className="stat-number">{safeStats.totalRevenue?.toLocaleString() || 0} ETB</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-details">
            <h3>{t('Pending Orders')}</h3>
            <p className="stat-number">{safeStats.pendingOrders}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🍔</div>
          <div className="stat-details">
            <h3>{t('Menu Items')}</h3>
            <p className="stat-number">{safeStats.totalMenuItems}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-details">
            <h3>{t('Total Users')}</h3>
            <p className="stat-number">{safeStats.totalUsers}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-details">
            <h3>{t("Today's Orders")}</h3>
            <p className="stat-number">{safeStats.todayOrders}</p>
          </div>
        </div>
      </div>

      <div className="recent-orders-section">
        <h2>{t('Recent Orders')}</h2>
        {loading ? (
          <div className="table-loading">{t('Loading recent orders...')}</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Order ID')}</th>
                  <th>{t('Customer')}</th>
                  <th>{t('Items')}</th>
                  <th>{t('Total')}</th>
                  <th>{t('Status')}</th>
                  <th>{t('Time')}</th>
                  <th>{t('Action')}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map(order => (
                    <tr key={order._id}>
                      <td>#{order._id.slice(-6)}</td>
                      <td>{order.customer?.name || t('Guest')}</td>
                      <td>{order.items?.length || 0} {t('items')}</td>
                      <td>{order.totalAmount} ETB</td>
                      <td>
                        <span className={`status-badge ${order.status}`}>
                          {t(order.status.charAt(0).toUpperCase() + order.status.slice(1))}
                        </span>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <button className="action-btn view-btn">{t('View')}</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">{t('No recent orders')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;