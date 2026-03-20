// src/pages/admin/tabs/OverviewTab.jsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../../services/api';
import './OverviewTab.css';

const OverviewTab = ({ stats, onRefresh }) => {
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
        <h1 className="page-title">Dashboard Overview</h1>
        <button className="btn-refresh" onClick={onRefresh} title="Refresh Data">
          🔄 Refresh
        </button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-details">
            <h3>Total Orders</h3>
            <p className="stat-number">{safeStats.totalOrders}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-details">
            <h3>Total Revenue</h3>
            <p className="stat-number">{safeStats.totalRevenue?.toLocaleString() || 0} ETB</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-details">
            <h3>Pending Orders</h3>
            <p className="stat-number">{safeStats.pendingOrders}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🍔</div>
          <div className="stat-details">
            <h3>Menu Items</h3>
            <p className="stat-number">{safeStats.totalMenuItems}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-details">
            <h3>Total Users</h3>
            <p className="stat-number">{safeStats.totalUsers}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-details">
            <h3>Today's Orders</h3>
            <p className="stat-number">{safeStats.todayOrders}</p>
          </div>
        </div>
      </div>

      <div className="recent-orders-section">
        <h2>Recent Orders</h2>
        {loading ? (
          <div className="table-loading">Loading recent orders...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map(order => (
                    <tr key={order._id}>
                      <td>#{order._id.slice(-6)}</td>
                      <td>{order.customer?.name || 'Guest'}</td>
                      <td>{order.items?.length || 0} items</td>
                      <td>{order.totalAmount} ETB</td>
                      <td>
                        <span className={`status-badge ${order.status}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <button className="action-btn view-btn">View</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">No recent orders</td>
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