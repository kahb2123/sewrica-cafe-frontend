// src/pages/StaffKitchenDisplay.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { orderService, staffService } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-toastify';
import './StaffKitchenDisplay.css';

const StaffKitchenDisplay = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [myOrders, setMyOrders] = useState(0);
  const { connected, socket } = useSocket();

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'cook') {
      navigate('/staff/login');
    } else {
      loadOrders();
    }
  }, [isAuthenticated, user, navigate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAllOrders();
      const kitchenOrders = response.data?.filter(order =>
        ['pending', 'preparing', 'ready'].includes(order.status)
      ) || [];
      setOrders(kitchenOrders);
      
      // Count orders assigned to current chef
      const assignedToMe = kitchenOrders.filter(order => 
        order.assignedChef?._id === user._id || order.assignedChef?.email === user.email
      ).length;
      setMyOrders(assignedToMe);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && socket) {
      socket.on('orderUpdated', (data) => {
        setOrders(prev => prev.map(o => o._id === data._id ? data : o));
      });

      socket.on('newOrder', (data) => {
        if (['pending', 'preparing', 'ready'].includes(data.status)) {
          setOrders(prev => [data, ...prev]);
          toast.info(`🆕 New order #${data.orderNumber} in kitchen!`);
        }
      });

      socket.on('orderAssigned', (data) => {
        if (data.assignedChef?._id === user._id) {
          toast.info(`📝 Order #${data.orderNumber} assigned to you!`);
          loadOrders();
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('orderUpdated');
        socket.off('newOrder');
        socket.off('orderAssigned');
      }
    };
  }, [connected, socket, user]);

  const markItemReady = async (orderId, itemId) => {
    try {
      const response = await orderService.updateOrderItemStatus(orderId, itemId, 'ready');
      setOrders(prev => prev.map(o => o._id === orderId ? response.data : o));
      toast.success('Item marked as ready!');
    } catch (error) {
      console.error('Error updating item status:', error);
      toast.error('Failed to update item status');
    }
  };

  const completeOrder = async (orderId) => {
    try {
      const response = await orderService.updateOrder(orderId, { status: 'ready' });
      setOrders(prev => prev.map(o => o._id === orderId ? response.data : o));
      toast.success('Order marked as ready for pickup!');
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error('Failed to complete order');
    }
  };

  const assignOrderToMe = async (orderId) => {
    try {
      const response = await orderService.assignChef(orderId, user._id);
      setOrders(prev => prev.map(o => o._id === orderId ? response.data : o));
      loadOrders();
      toast.success('Order assigned to you!');
    } catch (error) {
      console.error('Error assigning order:', error);
      toast.error('Failed to assign order');
    }
  };

  const myAssignedOrders = orders.filter(order =>
    order.assignedChef?._id === user._id || order.assignedChef?.email === user.email
  );

  const unassignedOrders = orders.filter(order => !order.assignedChef);

  if (loading) {
    return (
      <div className="staff-kitchen-display">
        <div className="skd-loading">Loading kitchen orders...</div>
      </div>
    );
  }

  return (
    <div className="staff-kitchen-display">
      {/* Header */}
      <div className="skd-header">
        <div className="skd-title-section">
          <h1>👨‍🍳 Kitchen Display System</h1>
          <p>Welcome, {user?.name}! Here are your cooking tasks</p>
        </div>
        <button className="skd-back-btn" onClick={() => navigate('/staff')}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Quick Stats */}
      <div className="skd-quick-stats">
        <div className="quick-stat">
          <span className="stat-icon">📦</span>
          <span className="stat-label">My Orders</span>
          <span className="stat-value">{myAssignedOrders.length}</span>
        </div>
        <div className="quick-stat">
          <span className="stat-icon">🆓</span>
          <span className="stat-label">Unassigned</span>
          <span className="stat-value">{unassignedOrders.length}</span>
        </div>
        <div className="quick-stat">
          <span className="stat-icon">🔥</span>
          <span className="stat-label">All In Kitchen</span>
          <span className="stat-value">{orders.length}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="skd-main">
        {/* My Orders Section */}
        <div className="orders-section">
          <div className="section-header">
            <h2>🎯 My Assigned Orders ({myAssignedOrders.length})</h2>
            <button className="refresh-btn" onClick={loadOrders}>🔄</button>
          </div>

          {myAssignedOrders.length === 0 ? (
            <div className="empty-section">
              <p>No orders assigned to you yet. Good job! 🎉</p>
            </div>
          ) : (
            <div className="orders-grid">
              {myAssignedOrders.map(order => (
                <div 
                  key={order._id} 
                  className={`order-card-mini ${order.status}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="order-header">
                    <h3>Order #{order.orderNumber}</h3>
                    <span className={`status-badge ${order.status}`}>
                      {order.status === 'preparing' && '🔥 Preparing'}
                      {order.status === 'ready' && '✅ Ready'}
                      {order.status === 'pending' && '⏳ Pending'}
                    </span>
                  </div>

                  <div className="order-body">
                    <div className="item-count">
                      <span className="label">Items:</span>
                      <span className="count">{order.items?.length || 0}</span>
                    </div>
                    <div className="order-time">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </div>

                    <div className="items-summary">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="item-summary">
                          <span>• {item.name} x{item.quantity}</span>
                          <span className="item-status">
                            {item.status === 'ready' ? '✅' : '⏳'}
                          </span>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="items-more">
                          +{order.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    className="action-btn details-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order);
                    }}
                  >
                    View Details →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unassigned Orders Section */}
        {unassignedOrders.length > 0 && (
          <div className="orders-section">
            <div className="section-header">
              <h2>📋 Available Orders ({unassignedOrders.length})</h2>
            </div>

            <div className="orders-grid">
              {unassignedOrders.map(order => (
                <div 
                  key={order._id} 
                  className="order-card-mini available"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="order-header">
                    <h3>Order #{order.orderNumber}</h3>
                    <span className="available-badge">Available</span>
                  </div>

                  <div className="order-body">
                    <div className="item-count">
                      <span className="label">Items:</span>
                      <span className="count">{order.items?.length || 0}</span>
                    </div>
                    <div className="order-time">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <button 
                    className="action-btn take-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      assignOrderToMe(order._id);
                    }}
                  >
                    Take This Order 🚀
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="skd-modal">
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)} />
          <div className="modal-content">
            <div className="modal-header">
              <h2>Order #{selectedOrder.orderNumber}</h2>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Order Info */}
              <section className="info-section">
                <h3>📋 Order Details</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Status</span>
                    <span className={`status-badge ${selectedOrder.status}`}>
                      {selectedOrder.status === 'preparing' && '🔥 Preparing'}
                      {selectedOrder.status === 'ready' && '✅ Ready'}
                      {selectedOrder.status === 'pending' && '⏳ Pending'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Type</span>
                    <span>{selectedOrder.orderType === 'dine-in' ? '🍽️ Dine-in' : '📦 Delivery'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Time</span>
                    <span>{new Date(selectedOrder.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Customer</span>
                    <span>{selectedOrder.customer?.name || 'Unknown'}</span>
                  </div>
                </div>
              </section>

              {/* Items to Cook */}
              <section className="items-section">
                <h3>🍽️ Items to Prepare</h3>
                <div className="items-list-detailed">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className={`item-card ${item.status || 'pending'}`}>
                      <div className="item-main">
                        <div className="item-name-qty">
                          <strong>{item.name}</strong>
                          <span className="qty">x{item.quantity}</span>
                        </div>
                        {item.specialInstructions && (
                          <div className="item-instructions">
                            📝 {item.specialInstructions}
                          </div>
                        )}
                      </div>

                      {item.status !== 'ready' && (
                        <button
                          className="mark-ready-btn"
                          onClick={() => markItemReady(selectedOrder._id, item._id || idx)}
                        >
                          Mark Ready
                        </button>
                      )}
                      {item.status === 'ready' && (
                        <span className="ready-badge">✅ Ready</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-complete"
                onClick={() => completeOrder(selectedOrder._id)}
                disabled={selectedOrder.status === 'ready'}
              >
                ✅ Complete Order
              </button>
              <button 
                className="btn-close"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffKitchenDisplay;
