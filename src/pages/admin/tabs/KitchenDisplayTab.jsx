// src/pages/admin/tabs/KitchenDisplayTab.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { staffService, orderService, getOrderNumberLabel } from '../../../services/api';
import { useSocket } from '../../../context/SocketContext';
import './KitchenDisplayTab.css';

const KITCHEN_REFRESH_INTERVAL_MS = 15000;
const TICK_INTERVAL_MS = 1000;
const QUEUE_STATUSES = ['pending', 'confirmed', 'preparing', 'cooking'];
const WARN_AFTER_MINUTES = 10;
const URGENT_AFTER_MINUTES = 20;

// Admin cannot jump straight from 'pending' to 'ready', so walk the chain one step at a time.
const ADMIN_PATH_TO_READY = {
  pending: ['confirmed', 'preparing', 'ready'],
  confirmed: ['preparing', 'ready'],
  preparing: ['ready'],
  cooking: ['ready']
};

const STATUS_LABELS = {
  pending: '⏳ Pending',
  confirmed: '📋 Confirmed',
  preparing: '🔥 Preparing',
  cooking: '🔥 Cooking'
};

const statusLabel = (status) => STATUS_LABELS[status] || status;

const formatClock = (value) => {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatElapsed = (startMs, nowMs) => {
  const totalSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
};

const urgencyLevel = (startMs, nowMs) => {
  const minutes = (nowMs - startMs) / 60000;
  if (minutes >= URGENT_AFTER_MINUTES) return 'urgent';
  if (minutes >= WARN_AFTER_MINUTES) return 'warn';
  return 'normal';
};

const KitchenDisplayTab = () => {
  const [orders, setOrders] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const { connected, socket } = useSocket();

  const loadOrders = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await staffService.getKitchenOrders();
      const allOrders = Array.isArray(response) ? response : response?.data || response?.orders || [];
      setOrders(allOrders.filter((order) => QUEUE_STATUSES.includes(order.status)));
    } catch (error) {
      console.error('Kitchen: failed to load orders', error);
      toast.error('Failed to load orders');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    staffService
      .getStaffByRole('cook')
      .then((response) => setChefs(response?.staff || []))
      .catch((error) => console.error('Kitchen: failed to load chefs', error));
  }, [loadOrders]);

  useEffect(() => {
    const interval = setInterval(() => loadOrders(false), KITCHEN_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadOrders]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!connected || !socket) return undefined;

    const handleNewOrder = (data) => {
      toast.info(`🆕 New order #${getOrderNumberLabel(data?.orderNumber)} in kitchen!`);
      loadOrders(false);
    };

    const removeIfReady = (data) => {
      if (data?.status === 'ready') {
        setOrders((prev) => prev.filter((order) => order._id !== data.orderId));
      }
    };

    socket.on('new-order', handleNewOrder);
    socket.on('order-updated', removeIfReady);
    socket.on('order-ready', removeIfReady);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('order-updated', removeIfReady);
      socket.off('order-ready', removeIfReady);
    };
  }, [connected, socket, loadOrders]);

  const completeOrder = async (order) => {
    if (busyId) return;
    setBusyId(order._id);

    try {
      const steps = ADMIN_PATH_TO_READY[order.status] || [];
      for (const step of steps) {
        await orderService.updateOrderStatus(order._id, step);
      }
      setOrders((prev) => prev.filter((item) => item._id !== order._id));
      toast.success(`✅ Order #${getOrderNumberLabel(order.orderNumber)} marked ready`);
    } catch (error) {
      console.error('Kitchen: failed to complete order', error);
      toast.error(error?.message || 'Failed to complete order');
      loadOrders(false);
    } finally {
      setBusyId(null);
    }
  };

  const assignChefToOrder = async (orderId, chefId) => {
    if (!chefId) return;
    try {
      const response = await staffService.assignChef(orderId, chefId);
      const updated = response?.order || response?.data;
      if (updated) {
        setOrders((prev) => prev.map((order) => (order._id === orderId ? updated : order)));
      }
      toast.success('Chef assigned');
    } catch (error) {
      console.error('Kitchen: failed to assign chef', error);
      toast.error(error?.message || 'Failed to assign chef');
      loadOrders(false);
    }
  };

  const queue = useMemo(() => {
    const filtered = orders.filter((order) => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'assigned') return Boolean(order.assignedChef);
      if (filterStatus === 'unassigned') return !order.assignedChef;
      return order.status === filterStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      if (aTime !== bTime) return aTime - bTime;
      return getOrderNumberLabel(a.orderNumber).localeCompare(getOrderNumberLabel(b.orderNumber));
    });

    return sorted.map((order, index) => ({ order, position: index + 1 }));
  }, [orders, filterStatus]);

  const urgentCount = useMemo(
    () => queue.filter(({ order }) => urgencyLevel(new Date(order.createdAt).getTime(), now) === 'urgent').length,
    [queue, now]
  );

  const unassignedCount = orders.filter((order) => !order.assignedChef).length;

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
        <div className="kds-header-actions">
          <span className={`skd-connection ${connected ? 'online' : 'offline'}`}>
            {connected ? '● Live' : '○ Reconnecting'}
          </span>
          <button className="kds-refresh" onClick={() => loadOrders(false)}>🔄 Refresh</button>
        </div>
      </div>

      <div className="kds-stats">
        <div className="stat-card">
          <span className="stat-icon">📦</span>
          <span className="stat-label">In Queue</span>
          <span className="stat-value">{orders.length}</span>
        </div>
        <div className="stat-card pending">
          <span className="stat-icon">⏳</span>
          <span className="stat-label">Pending</span>
          <span className="stat-value">{orders.filter((o) => o.status === 'pending').length}</span>
        </div>
        <div className="stat-card cooking">
          <span className="stat-icon">🔥</span>
          <span className="stat-label">Cooking</span>
          <span className="stat-value">{orders.filter((o) => o.status === 'preparing' || o.status === 'cooking').length}</span>
        </div>
        <div className="stat-card unassigned">
          <span className="stat-icon">🧑‍🍳</span>
          <span className="stat-label">No Chef</span>
          <span className="stat-value">{unassignedCount}</span>
        </div>
        <div className="stat-card urgent">
          <span className="stat-icon">⏰</span>
          <span className="stat-label">Over {URGENT_AFTER_MINUTES}m</span>
          <span className="stat-value">{urgentCount}</span>
        </div>
      </div>

      <div className="kds-controls">
        <div className="filter-group">
          <label>Filter by Status</label>
          <div className="filter-buttons">
            {['all', 'pending', 'confirmed', 'preparing', 'cooking', 'assigned', 'unassigned'].map((status) => (
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

      <div className="kds-container">
        <div className="kds-board">
          {queue.length === 0 ? (
            <div className="kds-empty">
              <p>🎉 No orders in kitchen! Everything is caught up!</p>
            </div>
          ) : (
            <>
              <div className="kds-queue-head">
                <span className="kds-col-position">#</span>
                <span className="kds-col-order">Order</span>
                <span className="kds-col-items">Items</span>
                 <span className="kds-col-ordered">Ordered</span>
                     <span className="kds-col-elapsed">Elapsed</span>
                     <span className="kds-col-chef">Chef</span>
                     <span className="kds-col-delivery">Wait / Delivery</span>
                     <span className="kds-col-action">Action</span>
              </div>

              {queue.map(({ order, position }) => {
                const startMs = new Date(order.createdAt).getTime();
                const urgency = Number.isNaN(startMs) ? 'normal' : urgencyLevel(startMs, now);
                const isBusy = busyId === order._id;

                return (
                  <div key={order._id} className={`kds-row status-${order.status} urgency-${urgency}`}>
                    <div className="kds-col-position">
                      <span className="kds-position-badge">{position}</span>
                    </div>

                    <div className="kds-col-order">
                      <strong className="kds-order-number">#{getOrderNumberLabel(order.orderNumber)}</strong>
                      <span className={`status-badge ${order.status}`}>{statusLabel(order.status)}</span>
                    </div>

                    <ul className="kds-col-items">
                      {(order.items || []).map((item, index) => (
                        <li key={item.menuItem?._id || item.menuItem || index} className="kds-item">
                          <span className="kds-item-qty">{item.quantity}×</span>
                          <span className="kds-item-name">{item.name}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="kds-col-ordered">
                      <span className="kds-ordered-time">{formatClock(order.createdAt)}</span>
                    </div>

                    <div className="kds-col-elapsed">
                      <span className="kds-elapsed-time">
                        {Number.isNaN(startMs) ? '--:--' : formatElapsed(startMs, now)}
                      </span>
                    </div>

                     <div className="kds-col-chef">
                      <select
                        className="kds-chef-select"
                        value={order.assignedChef?._id || ''}
                        onChange={(event) => assignChefToOrder(order._id, event.target.value)}
                        aria-label={`Assign chef to order ${getOrderNumberLabel(order.orderNumber)}`}
                      >
                        <option value="">-- No chef --</option>
                        {chefs.map((chef) => (
                          <option key={chef._id} value={chef._id}>
                            {chef.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="kds-col-delivery">
                      {order.assignedDelivery ? (
                        <span className="kds-delivery-name">
                          {order.assignedDelivery.name || 'Assigned'}
                        </span>
                      ) : (
                        <span className="kds-delivery-name unassigned">
                          ⏳ Waiting for assignment
                        </span>
                      )}
                    </div>

                    <div className="kds-col-action">
                      <button
                        className="kds-complete-btn"
                        onClick={() => completeOrder(order)}
                        disabled={Boolean(busyId)}
                        aria-label={`Mark order ${getOrderNumberLabel(order.orderNumber)} ready`}
                      >
                        {isBusy ? '⏳ Saving…' : '✅ Complete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default KitchenDisplayTab;
