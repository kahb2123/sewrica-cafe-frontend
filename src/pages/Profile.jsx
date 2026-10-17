import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/api';
import { toast } from 'react-toastify';
import scrollToPageTop from '../utils/scrollToPageTop';
import { useLanguage } from '../context/useLanguage';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      scrollToPageTop();
      setActiveTab(tab);
    }
  };

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
      setOrders(Array.isArray(data) ? data : data?.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error(t('Failed to load your orders'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(t('Are you sure you want to cancel this order?'))) {
      return;
    }

    try {
      await orderService.cancelOrder(orderId);
      toast.success(t('Order cancelled successfully'));
      fetchUserOrders(); // Refresh orders
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.message || t('Failed to cancel order'));
    }
  };

  const handleReorder = (order) => {
    // Clear existing cart
    localStorage.removeItem('cart');
    
    // Add items to cart
    const cartItems = order.items.map(item => ({
      id: item.menuItem?._id || item.menuItem,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.menuItem?.image
    }));
    
    localStorage.setItem('cart', JSON.stringify(cartItems));
    window.dispatchEvent(new Event('cartUpdated'));
    
    toast.success(t('Items added to cart!'));
    navigate('/cart');
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

  const getPaymentIcon = (method) => {
    switch(method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'tele_birr': return '📱';
      default: return '💳';
    }
  };

  const translateLabel = (value) => {
    if (!value) return value;
    const label = value.replace(/[_-]+/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
    return t(label);
  };

  const formatDeliveryAddress = (address) => {
    if (typeof address === 'string') return address;
    if (!address || typeof address !== 'object')     return t('Megenagna, Metebaber Building');

    return [
      address.street,
      address.area,
      address.building,
      address.floor,
      address.city,
      address.additionalInfo
    ].filter(Boolean).join(', ') || t('Address not provided');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const locale = language === 'am' ? 'am-ET' : language === 'om' ? 'om-ET' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotalSpent = () => {
    return orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success(t('Logged out successfully'));
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>{t('My Profile')}</h1>
          <p>{t('Welcome back,')} {user.name}!</p>
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
                <span className="user-role">{translateLabel(user.role)}</span>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="user-stats">
              <div className="stat-item">
                <span className="stat-value">{orders.length}</span>
                <span className="stat-label">{t('Total Orders')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {orders.filter(o => o.status === 'delivered').length}
                </span>
                <span className="stat-label">{t('Delivered')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{calculateTotalSpent()} ETB</span>
                <span className="stat-label">{t('Total Spent')}</span>
              </div>
            </div>

            <div className="profile-nav">
              <button
                className={activeTab === 'orders' ? 'active' : ''}
                onClick={() => handleTabChange('orders')}
              >
                📦 {t('My Orders')}
              </button>
              <button
                className={activeTab === 'account' ? 'active' : ''}
                onClick={() => handleTabChange('account')}
              >
                👤 {t('Account Settings')}
              </button>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              🚪 {t('Logout')}
            </button>
          </div>

          <div className="profile-main">
            {activeTab === 'orders' && (
              <div className="orders-section">
                <h2>{t('My Orders')}</h2>

                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>{t('Loading your orders...')}</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="empty-orders">
                    <div className="empty-icon">📦</div>
                    <h3>{t('No orders yet')}</h3>
                    <p>{t("You haven't placed any orders yet.")}</p>
                    <button
                      className="btn-primary"
                      onClick={() => navigate('/menu')}
                    >
                      {t('Browse Menu')}
                    </button>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.map((order) => (
                      <div key={order._id} className="order-card">
                        <div className="order-header">
                          <div className="order-info">
                            <h3>{t('Order #')}{order.orderNumber || order._id.slice(-8)}</h3>
                            <p className="order-date">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="order-status">
                            <span
                              className="status-badge"
                              style={{ backgroundColor: getStatusColor(order.status) }}
                            >
                              {t(order.status.charAt(0).toUpperCase() + order.status.slice(1))}
                            </span>
                          </div>
                        </div>

                        <div className="order-items">
                          {order.items?.map((item, index) => (
                            <div key={index} className="order-item">
                              <div className="item-info">
                                <span className="item-name">{item.name}</span>
                                <span className="item-quantity">×{item.quantity}</span>
                              </div>
                              <span className="item-price">{item.price * item.quantity} ETB</span>
                            </div>
                          ))}
                        </div>

                        {/* Payment Info */}
                        <div className="order-payment-info">
                          <span className="payment-method">
                            {getPaymentIcon(order.paymentMethod)} {translateLabel(order.paymentMethod)}
                          </span>
                          <span className={`payment-status ${order.paymentStatus}`}>
                            {translateLabel(order.paymentStatus)}
                          </span>
                        </div>

                        <div className="order-footer">
                          <div className="order-total">
                            <strong>{t('Total:')} {order.totalAmount} ETB</strong>
                          </div>
                          <div className="order-actions">
                            <button 
                              className="btn-secondary"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowModal(true);
                              }}
                            >
                              {t('View Details')}
                            </button>
                            
                            {order.status === 'pending' && (
                              <button
                                className="btn-danger"
                                onClick={() => handleCancelOrder(order._id)}
                              >
                                {t('Cancel Order')}
                              </button>
                            )}
                            
                            {(order.status === 'delivered' || order.status === 'cancelled') && (
                              <button
                                className="btn-reorder"
                                onClick={() => handleReorder(order)}
                              >
                                🔄 {t('Reorder')}
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
                <h2>{t('Account Settings')}</h2>

                <div className="account-form">
                  <div className="form-group">
                    <label>{t('Name')}</label>
                    <input
                      type="text"
                      value={user.name}
                      readOnly
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('Email')}</label>
                    <input
                      type="email"
                      value={user.email}
                      readOnly
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('Phone')}</label>
                    <input
                      type="tel"
                      value={user.phone}
                      readOnly
                      className="form-control"
                    />
                  </div>

                  <div className="account-note">
                    <p>
                      <strong>{t('Note:')}</strong> {t('Account information can only be updated by contacting our support team.')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{t('Order Details')}</h2>
            <p className="order-number">{t('Order #')}{selectedOrder.orderNumber || selectedOrder._id.slice(-8)}</p>
            
            <div className="modal-section">
              <h3>{t('Items')}</h3>
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="modal-item">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{item.price * item.quantity} ETB</span>
                </div>
              ))}
            </div>

            <div className="modal-section">
              <h3>{t('Summary')}</h3>
              <p><strong>{t('Subtotal:')}</strong> {selectedOrder.subtotal || selectedOrder.totalAmount} ETB</p>
              <p><strong>{t('Delivery:')}</strong> {t('FREE')}</p>
              <p><strong>{t('Total:')}</strong> {selectedOrder.totalAmount} ETB</p>
            </div>

            <div className="modal-section">
              <h3>{t('Payment')}</h3>
              <p><strong>{t('Method:')}</strong> {translateLabel(selectedOrder.paymentMethod)}</p>
              <p><strong>{t('Status:')}</strong> {translateLabel(selectedOrder.paymentStatus)}</p>
              {selectedOrder.paidAt && (
                <p><strong>{t('Paid At:')}</strong> {formatDate(selectedOrder.paidAt)}</p>
              )}
            </div>

            <div className="modal-section">
              <h3>{t('Delivery')}</h3>
              <p><strong>{t('Method:')}</strong> {translateLabel(selectedOrder.deliveryMethod)}</p>
              <p><strong>{t('Address:')}</strong> {formatDeliveryAddress(selectedOrder.deliveryAddress)}</p>
            </div>

            <button className="modal-close" onClick={() => setShowModal(false)}>
              {t('Close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;