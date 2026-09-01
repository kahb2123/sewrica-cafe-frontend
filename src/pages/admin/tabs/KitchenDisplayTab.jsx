// src/pages/admin/tabs/KitchenDisplayTab.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { staffService, orderService } from '../../../services/api';
import { useSocket } from '../../../context/SocketContext';
import './KitchenDisplayTab.css';

const KitchenDisplayTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [chefs, setChefs] = useState([]);
  const [activeChef, setActiveChef] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const { connected, socket } = useSocket();

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAllOrders();
      // Filter only orders that are being prepared or in kitchen
      const kitchenOrders = response.data?.filter(order =>
        ['pending', 'preparing', 'ready'].includes(order.status)
      ) || [];
      setOrders(kitchenOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadChefs = async () => {
    try {
      const response = await staffService.getStaffByRole('cook');
      setChefs(response.staff || []);
    } catch (error) {
      console.error('Error loading chefs:', error);
    }
  };

  useEffect(() => {
    loadOrders();
    loadChefs();
  }, []);

  // Listen for real-time order updates
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
    }

    return () => {
      if (socket) {
        socket.off('orderUpdated');
        socket.off('newOrder');
      }
    };
  }, [connected, socket]);

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

  const assignChefToOrder = async (orderId, chefId) => {
    try {
      const response = await orderService.assignChef(orderId, chefId);
      setOrders(prev => prev.map(o => o._id === orderId ? response.data : o));
      toast.success('Chef assigned successfully!');
    } catch (error) {
      console.error('Error assigning chef:', error);
      toast.error('Failed to assign chef');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'assigned') return order.assignedChef;
    if (filterStatus === 'unassigned') return !order.assignedChef;
    return order.status === filterStatus;
  });

  const stats = {
    total: orders.length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    pending: orders.filter(o => o.status === 'pending').length,
  };

  if (loading) {
    return (
      <div className="kitchen-display-tab">
        <div className="kds-loading">Loading kitchen orders...</div>
      </div>
    );
  }

  return (
    <div className="kitchen-display-tab">
      <div className="kds-header">
        <div>
          <h1 className="kds-title">🍳 Kitchen Display System</h1>
          <p className="kds-subtitle">Manage orders and assign chefs to cooking tasks</p>
        </div>
        <button className="kds-refresh" onClick={loadOrders}>🔄 Refresh Orders</button>
      </div>

      {/* Stats Cards */}
      <div className="kds-stats">
        <div className="stat-card">
          <span className="stat-icon">📦</span>
          <span className="stat-label">Total Orders</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card pending">
          <span className="stat-icon">⏳</span>
          <span className="stat-label">Pending</span>
          <span className="stat-value">{stats.pending}</span>
        </div>
        <div className="stat-card cooking">
          <span className="stat-icon">🔥</span>
          <span className="stat-label">Preparing</span>
          <span className="stat-value">{stats.preparing}</span>
        </div>
        <div className="stat-card ready">
          <span className="stat-icon">✅</span>
          <span className="stat-label">Ready</span>
          <span className="stat-value">{stats.ready}</span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="kds-controls">
        <div className="filter-group">
          <label>Filter by Status</label>
          <div className="filter-buttons">
            {['all', 'pending', 'preparing', 'ready', 'assigned', 'unassigned'].map(status => (
              <button
                key={status}
                className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kitchen Orders Display */}
      <div className="kds-container">
        <div className="kds-board">
          {filteredOrders.length === 0 ? (
            <div className="kds-empty">
              <p>🎉 No orders in kitchen! Everything is caught up!</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div 
                key={order._id} 
                className={`kds-order-card ${order.status} ${order.assignedChef ? 'assigned' : 'unassigned'}`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="order-card-header">
                  <div className="order-number">
                    Order #{order.orderNumber}
                  </div>
                  <div className="order-status">
                    <span className={`status-badge ${order.status}`}>
                      {order.status === 'pending' && '⏳ Pending'}
                      {order.status === 'preparing' && '🔥 Preparing'}
                      {order.status === 'ready' && '✅ Ready'}
                    </span>
                  </div>
                </div>

                <div className="order-details">
                  <div className="detail-row">
                    <span className="label">Time:</span>
                    <span className="value">{new Date(order.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Items:</span>
                    <span className="value">{order.items?.length || 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Type:</span>
                    <span className="value">
                      {order.orderType === 'dine-in' ? '🍽️ Dine-in' : '📦 Delivery'}
                    </span>
                  </div>
                </div>

                {/* Chef Assignment */}
                <div className="chef-assignment">
                  <span className="assignment-label">Chef:</span>
                  {order.assignedChef ? (
                    <span className="assigned-chef">
                      👨‍🍳 {order.assignedChef.name}
                    </span>
                  ) : (
                    <span className="unassigned-chef">No chef assigned</span>
                  )}
                </div>

                {/* Items List */}
                <div className="order-items">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className={`item-row ${item.status || 'pending'}`}>
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty">x{item.quantity}</span>
                      <span className={`item-status ${item.status || 'pending'}`}>
                        {item.status === 'ready' && '✅'}
                        {!item.status || item.status === 'pending' && '⏳'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="quick-actions">
                  {order.status !== 'ready' && (
                    <button 
                      className="action-btn complete"
                      onClick={(e) => {
                        e.stopPropagation();
                        completeOrder(order._id);
                      }}
                    >
                      ✅ Mark Ready
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Detail Panel */}
        {selectedOrder && (
          <div className="kds-detail-panel">
            <div className="detail-header">
              <h2>Order #{selectedOrder.orderNumber}</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedOrder(null)}
              >
                ✕
              </button>
            </div>

            <div className="detail-content">
              {/* Order Info */}
              <div className="detail-section">
                <h3>📋 Order Information</h3>
                <div className="info-table">
                  <div className="info-row">
                    <span className="info-label">Status:</span>
                    <span className={`status-badge ${selectedOrder.status}`}>
                      {selectedOrder.status === 'pending' && '⏳ Pending'}
                      {selectedOrder.status === 'preparing' && '🔥 Preparing'}
                      {selectedOrder.status === 'ready' && '✅ Ready'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Type:</span>
                    <span>{selectedOrder.orderType === 'dine-in' ? '🍽️ Dine-in' : '📦 Delivery'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Customer:</span>
                    <span>{selectedOrder.customer?.name || 'Unknown'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Time Received:</span>
                    <span>{new Date(selectedOrder.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Chef Assignment */}
              <div className="detail-section">
                <h3>👨‍🍳 Assign Chef</h3>
                <select
                  className="chef-select"
                  value={selectedOrder.assignedChef?._id || ''}
                  onChange={(e) => assignChefToOrder(selectedOrder._id, e.target.value)}
                >
                  <option value="">-- Select a chef --</option>
                  {chefs.map(chef => (
                    <option key={chef._id} value={chef._id}>
                      {chef.name} {chef.currentLoad ? `(${chef.currentLoad} orders)` : '(available)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List */}
              <div className="detail-section">
                <h3>🍽️ Items to Prepare</h3>
                <div className="items-list">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className={`item-detail ${item.status || 'pending'}`}>
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                        <span className="item-qty">Qty: {item.quantity}</span>
                        {item.specialInstructions && (
                          <span className="item-notes">📝 {item.specialInstructions}</span>
                        )}
                      </div>
                      <div className="item-actions">
                        {item.status !== 'ready' && (
                          <button
                            className="item-ready-btn"
                            onClick={() => markItemReady(selectedOrder._id, item._id || idx)}
                          >
                            Mark Ready
                          </button>
                        )}
                        {item.status === 'ready' && (
                          <span className="item-status-badge ready">✅ Ready</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="detail-actions">
                {selectedOrder.status !== 'ready' && (
                  <button 
                    className="action-btn complete"
                    onClick={() => completeOrder(selectedOrder._id)}
                  >
                    ✅ Complete Order
                  </button>
                )}
                <button 
                  className="action-btn cancel"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplayTab;
