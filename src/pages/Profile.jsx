import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/api';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserOrders();
  }, [user, navigate]);

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getUserOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load your orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      confirmed: '#3498db',
      preparing: '#9b59b6',
      ready: '#2ecc71',
      delivered: '#27ae60',
      cancelled: '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>Welcome back, {user.name}!</p>
        </div>

        <div className="profile-content">
          <div className="profile-sidebar">
            <div className="user-info-card">
              <div className="user-avatar">
                <span>{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="user-details">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
                <p>{user.phone}</p>
                <span className="user-role">{user.role}</span>
              </div>
            </div>

            <div className="profile-nav">
              <button
                className={activeTab === 'orders' ? 'active' : ''}
                onClick={() => setActiveTab('orders')}
              >
                📦 My Orders
              </button>
              <button
                className={activeTab === 'account' ? 'active' : ''}
                onClick={() => setActiveTab('account')}
              >
                👤 Account Settings
              </button>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>

          <div className="profile-main">
            {activeTab === 'orders' && (
              <div className="orders-section">
                <h2>My Orders</h2>

                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading your orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="empty-orders">
                    <div className="empty-icon">📦</div>
                    <h3>No orders yet</h3>
                    <p>You haven't placed any orders yet.</p>
                    <button
                      className="btn-primary"
                      onClick={() => navigate('/menu')}
                    >
                      Browse Menu
                    </button>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.map((order) => (
                      <div key={order._id} className="order-card">
                        <div className="order-header">
                          <div className="order-info">
                            <h3>Order #{order.orderNumber}</h3>
                            <p className="order-date">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="order-status">
                            <span
                              className="status-badge"
                              style={{ backgroundColor: getStatusColor(order.status) }}
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        <div className="order-items">
                          {order.items.map((item, index) => (
                            <div key={index} className="order-item">
                              <div className="item-info">
                                <span className="item-name">{item.name}</span>
                                <span className="item-quantity">×{item.quantity}</span>
                              </div>
                              <span className="item-price">{item.price} ETB</span>
                            </div>
                          ))}
                        </div>

                        <div className="order-footer">
                          <div className="order-total">
                            <strong>Total: {order.totalAmount} ETB</strong>
                          </div>
                          <div className="order-actions">
                            <button className="btn-secondary">
                              View Details
                            </button>
                            {order.status === 'pending' && (
                              <button
                                className="btn-danger"
                                onClick={() => {
                                  // Cancel order functionality
                                  toast.info('Cancel order functionality coming soon');
                                }}
                              >
                                Cancel Order
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'account' && (
              <div className="account-section">
                <h2>Account Settings</h2>

                <div className="account-form">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={user.name}
                      readOnly
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={user.email}
                      readOnly
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={user.phone}
                      readOnly
                      className="form-control"
                    />
                  </div>

                  <div className="account-note">
                    <p>
                      <strong>Note:</strong> Account information can only be updated by contacting our support team.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;