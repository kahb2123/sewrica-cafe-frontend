// src/pages/StaffKitchenDisplay.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { staffService } from '../services/api';
import './StaffKitchenDisplay.css';

const KITCHEN_REFRESH_INTERVAL_MS = 15000;
const TICK_INTERVAL_MS = 1000;
const COOK_ROLES = ['cook', 'chef'];
const QUEUE_STATUSES = ['pending', 'confirmed', 'preparing', 'cooking'];
const WARN_AFTER_MINUTES = 10;
const URGENT_AFTER_MINUTES = 20;

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

const StaffKitchenDisplay = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { connected, socket } = useSocket();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const userRole = user?.role ? String(user.role).toLowerCase() : null;
  const isCook = Boolean(user) && COOK_ROLES.includes(userRole);

  const loadOrders = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await staffService.getMyCookingOrders();
      const list = Array.isArray(response) ? response : response?.orders || [];
      setOrders(list.filter((order) => QUEUE_STATUSES.includes(order.status)));
    } catch (error) {
      console.error('Kitchen: failed to load orders', error);
      toast.error('Failed to load kitchen orders');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !isCook) {
      navigate('/staff/login', { replace: true });
      return;
    }
    loadOrders();
  }, [authLoading, isAuthenticated, isCook, navigate, loadOrders]);

  useEffect(() => {
    if (!isCook) return undefined;
    const interval = setInterval(() => loadOrders(false), KITCHEN_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isCook, loadOrders]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!connected || !socket || !isCook) return undefined;

    const handleOrderAssigned = (data) => {
      const assignedToMe = data?.assignedChef?._id === user?._id || data?.chefId === user?._id;
      if (assignedToMe) {
        toast.info(`📝 Order #${data.orderNumber} assigned to you`);
        loadOrders(false);
      }
    };

    const handleOrderCancelled = (data) => {
      setOrders((prev) => prev.filter((order) => order._id !== data?.orderId));
    };

    socket.on('order-assigned', handleOrderAssigned);
    socket.on('order-cancelled', handleOrderCancelled);

    return () => {
      socket.off('order-assigned', handleOrderAssigned);
      socket.off('order-cancelled', handleOrderCancelled);
    };
  }, [connected, socket, isCook, user, loadOrders]);

  const completeOrder = async (order) => {
    if (completingId) return;
    setCompletingId(order._id);

    try {
      if (order.status === 'confirmed') {
        await staffService.chefAcceptOrder(order._id);
      }
      if (order.status === 'confirmed' || order.status === 'preparing') {
        await staffService.startCooking(order._id);
      }
      await staffService.completeCooking(order._id);

      setOrders((prev) => prev.filter((item) => item._id !== order._id));
      toast.success(`✅ Order #${order.orderNumber} completed — ready for delivery`);
    } catch (error) {
      console.error('Kitchen: failed to complete order', error);
      toast.error(error?.message || 'Failed to complete order');
      loadOrders(false);
    } finally {
      setCompletingId(null);
    }
  };

  const queue = useMemo(() => {
    const sorted = [...orders].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      if (aTime !== bTime) return aTime - bTime;
      return String(a.orderNumber).localeCompare(String(b.orderNumber));
    });
    return sorted.map((order, index) => ({ order, position: index + 1 }));
  }, [orders]);

  const urgentCount = useMemo(
    () => queue.filter(({ order }) => urgencyLevel(new Date(order.createdAt).getTime(), now) === 'urgent').length,
    [queue, now]
  );

  if (authLoading) {
    return (
      <div className="staff-kitchen-display">
        <div className="skd-loading">Loading kitchen orders...</div>
      </div>
    );
  }

  if (!isAuthenticated || !isCook) {
    return (
      <div className="staff-kitchen-display">
        <div className="skd-loading">Redirecting to staff login...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="staff-kitchen-display">
        <div className="skd-loading">Loading kitchen orders...</div>
      </div>
    );
  }

  return (
    <div className="staff-kitchen-display">
      <div className="skd-header">
        <div className="skd-title-section">
          <h1>👨‍🍳 Kitchen Display</h1>
          <p>Cooking queue for {user.name} — oldest order first</p>
        </div>
        <div className="skd-header-actions">
          <span className={`skd-connection ${connected ? 'online' : 'offline'}`}>
            {connected ? '● Live' : '○ Reconnecting'}
          </span>
          <button className="skd-back-btn" onClick={() => navigate('/staff')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="skd-quick-stats">
        <div className="quick-stat">
          <span className="stat-icon">🔥</span>
          <span className="stat-label">In Queue</span>
          <span className="stat-value">{queue.length}</span>
        </div>
        <div className="quick-stat">
          <span className="stat-icon">⏰</span>
          <span className="stat-label">Over {URGENT_AFTER_MINUTES}m</span>
          <span className="stat-value">{urgentCount}</span>
        </div>
      </div>

      <div className="orders-section">
        <div className="section-header">
          <h2>Cooking Queue ({queue.length})</h2>
          <button className="refresh-btn" onClick={() => loadOrders(false)} aria-label="Refresh queue">
            🔄
          </button>
        </div>

        {queue.length === 0 ? (
          <div className="empty-section">
            <p>Queue is clear. No orders waiting. 🎉</p>
          </div>
        ) : (
          <div className="skd-queue">
            <div className="skd-queue-head">
              <span className="skd-col-position">#</span>
              <span className="skd-col-order">Order</span>
              <span className="skd-col-items">Items</span>
              <span className="skd-col-ordered">Ordered</span>
              <span className="skd-col-elapsed">Elapsed</span>
              <span className="skd-col-action">Action</span>
            </div>

            {queue.map(({ order, position }) => {
              const startMs = new Date(order.createdAt).getTime();
              const urgency = Number.isNaN(startMs) ? 'normal' : urgencyLevel(startMs, now);
              const isCompleting = completingId === order._id;

              return (
                <div key={order._id} className={`skd-row status-${order.status} urgency-${urgency}`}>
                  <div className="skd-col-position">
                    <span className="skd-position-badge">{position}</span>
                  </div>

                  <div className="skd-col-order">
                    <strong className="skd-order-number">#{order.orderNumber}</strong>
                    <span className={`status-badge ${order.status}`}>{statusLabel(order.status)}</span>
                  </div>

                  <ul className="skd-col-items">
                    {(order.items || []).map((item, index) => (
                      <li key={item.menuItem?._id || item.menuItem || index} className="skd-item">
                        <span className="skd-item-qty">{item.quantity}×</span>
                        <span className="skd-item-name">{item.name}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="skd-col-ordered">
                    <span className="skd-ordered-time">{formatClock(order.createdAt)}</span>
                  </div>

                  <div className="skd-col-elapsed">
                    <span className="skd-elapsed-time">
                      {Number.isNaN(startMs) ? '--:--' : formatElapsed(startMs, now)}
                    </span>
                  </div>

                  <div className="skd-col-action">
                    <button
                      className="skd-complete-btn"
                      onClick={() => completeOrder(order)}
                      disabled={Boolean(completingId)}
                      aria-label={`Mark order ${order.orderNumber} complete`}
                    >
                      {isCompleting ? '⏳ Saving…' : '✅ Complete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffKitchenDisplay;
