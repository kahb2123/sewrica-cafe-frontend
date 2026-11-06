// src/pages/admin/tabs/KitchenDisplayTab.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminService, staffService, getOrderNumberLabel } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { useLanguage } from '../../../context/useLanguage';
import './KitchenDisplayTab.css';

const KITCHEN_REFRESH_INTERVAL_MS = 15000;
const TICK_INTERVAL_MS = 1000;
const QUEUE_STATUSES = ['pending', 'confirmed', 'preparing', 'cooking'];
const KITCHEN_REFRESH_EVENTS = [
  'order-updated',
  'order-cancelled',
  'order-assigned-chef',
  'order-assigned-delivery',
  'order-assigned-waiter',
  'chef-accepted',
  'chef-rejected',
  'cooking-started'
];
const WARN_AFTER_MINUTES = 10;
const URGENT_AFTER_MINUTES = 20;
const hasAssignedStaff = (order) => Boolean(
  order.assignedChef || order.assignedWaiter || order.assignedDelivery
);

// Admin cannot jump straight from 'pending' to 'ready', so walk the chain one step at a time.
const ADMIN_PATH_TO_READY = {
  pending: ['confirmed', 'preparing', 'ready'],
  confirmed: ['preparing', 'ready'],
  preparing: ['ready'],
  cooking: ['ready']
};

const STATUS_LABELS = {
  pending: ['⏳', 'Pending'],
  confirmed: ['📋', 'Confirmed'],
  preparing: ['🔥', 'Preparing'],
  cooking: ['🔥', 'Cooking']
};

const statusLabel = (status, t) => {
  const [icon, label] = STATUS_LABELS[status] || ['', status];
  return `${icon} ${t(label)}`.trim();
};

const formatClock = (value, language) => {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString(language === 'am' ? 'am-ET' : undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
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

const KitchenDisplayTab = ({ readOnly = false, tvMode = false }) => {
  const location = useLocation();
  const { language, t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [busyChefIds, setBusyChefIds] = useState(new Set());
  const [busyDeliveryIds, setBusyDeliveryIds] = useState(new Set());
  const [busyWaiterIds, setBusyWaiterIds] = useState(new Set());
  const [now, setNow] = useState(() => Date.now());
  const { user } = useAuth();
  const { connected, socket } = useSocket();
  const visibleOrders = useMemo(
    () => tvMode ? orders.filter(hasAssignedStaff) : orders,
    [orders, tvMode]
  );

  const loadOrders = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await staffService.getKitchenOrders();
      const allOrders = Array.isArray(response) ? response : response?.data || response?.orders || [];
      setOrders(allOrders.filter((order) => QUEUE_STATUSES.includes(order.status)));
    } catch (error) {
      console.error('Kitchen: failed to load orders', error);
      toast.error(t('Failed to load orders'));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadOrders();
    staffService
      .getStaffByRole('cook')
      .then((response) => setChefs(response?.staff || []))
      .catch((error) => console.error('Kitchen: failed to load chefs', error));
    staffService
      .getStaffByRole('delivery')
      .then((response) => setDeliveries(response?.staff || []))
      .catch((error) => console.error('Kitchen: failed to load deliveries', error));
    staffService
      .getStaffByRole('waiter')
      .then((response) => setWaiters(response?.staff || []))
      .catch((error) => console.error('Kitchen: failed to load waiters', error));
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
      if (!tvMode || hasAssignedStaff(data || {})) {
        toast.info(`${t('New order')} #${getOrderNumberLabel(data?.orderNumber)} ${t('in kitchen')}`);
      }
      loadOrders(false);
    };

    const refreshOrders = () => loadOrders(false);
    const removeReadyOrder = (data) => {
      setOrders((prev) => prev.filter((order) => order._id !== data.orderId));
    };

    socket.on('new-order', handleNewOrder);
    socket.on('order-ready', removeReadyOrder);
    KITCHEN_REFRESH_EVENTS.forEach((eventName) => socket.on(eventName, refreshOrders));
    loadOrders(false);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('order-ready', removeReadyOrder);
      KITCHEN_REFRESH_EVENTS.forEach((eventName) => socket.off(eventName, refreshOrders));
    };
  }, [connected, socket, loadOrders, tvMode, t]);

   const completeOrder = async (order) => {
     if (readOnly || busyChefIds.size > 0 || busyDeliveryIds.size > 0) return;
    setBusyChefIds(new Set([order._id]));

    try {
      const steps = ADMIN_PATH_TO_READY[order.status] || [];
      for (const step of steps) {
        await staffService.updateKitchenOrderStatus(order._id, step);
      }
      setOrders((prev) => prev.filter((item) => item._id !== order._id));
    } catch (error) {
      console.error('Kitchen: failed to complete order', error);
      toast.error(t('Failed to complete order'));
      loadOrders(false);
    } finally {
      setBusyChefIds(new Set());
    }
  };

  const assignChefToOrder = async (orderId, chefId) => {
    if (readOnly || !chefId) return;
    setBusyChefIds((prev) => new Set([...prev, orderId]));
    try {
      const response = await staffService.assignChef(orderId, chefId);
      const updated = response?.order || response?.data;
      if (updated) {
        setOrders((prev) => prev.map((order) => (
          order._id === orderId ? { ...order, ...updated, items: order.items } : order
        )));
      }
    } catch (error) {
      console.error('Kitchen: failed to assign chef', error);
      toast.error(t('Failed to assign chef'));
      loadOrders(false);
    } finally {
      setBusyChefIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const assignDeliveryToOrder = async (orderId, deliveryId) => {
    if (readOnly || user?.role !== 'admin' || !deliveryId) return;
    setBusyDeliveryIds((prev) => new Set([...prev, orderId]));
    try {
      const response = await staffService.assignDelivery(orderId, deliveryId);
      const updated = response?.order || response?.data;
      if (updated) {
        setOrders((prev) => prev.map((order) => (
          order._id === orderId ? { ...order, ...updated, items: order.items } : order
        )));
      }
    } catch (error) {
      console.error('Kitchen: failed to assign delivery', error);
      toast.error(t('Failed to assign delivery person'));
      loadOrders(false);
    } finally {
      setBusyDeliveryIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const assignWaiterToOrder = async (orderId, waiterId) => {
    if (readOnly || user?.role !== 'admin' || !waiterId) return;
    setBusyWaiterIds((prev) => new Set([...prev, orderId]));
    try {
      const response = await adminService.assignWaiter(orderId, waiterId);
      const updated = response?.order;
      if (updated) {
        setOrders((prev) => prev.map((order) => (
          order._id === orderId ? { ...order, ...updated, items: order.items } : order
        )));
      }
    } catch (error) {
      console.error('Kitchen: failed to assign waiter', error);
      toast.error(t('Failed to assign waiter'));
      loadOrders(false);
    } finally {
      setBusyWaiterIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const queue = useMemo(() => {
    const filtered = visibleOrders.filter((order) => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'assigned') return tvMode ? hasAssignedStaff(order) : Boolean(order.assignedChef);
      if (filterStatus === 'unassigned') return tvMode ? !hasAssignedStaff(order) : !order.assignedChef;
      return order.status === filterStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      if (aTime !== bTime) return aTime - bTime;
      return getOrderNumberLabel(a.orderNumber).localeCompare(getOrderNumberLabel(b.orderNumber));
    });

    return sorted.map((order, index) => ({ order, position: index + 1 }));
  }, [visibleOrders, filterStatus, tvMode]);

  const urgentCount = useMemo(
    () => queue.filter(({ order }) => urgencyLevel(new Date(order.createdAt).getTime(), now) === 'urgent').length,
    [queue, now]
  );

  const unassignedCount = visibleOrders.filter((order) => !order.assignedChef).length;
  const tvModeSearch = new URLSearchParams(location.search);
  tvModeSearch.set('mode', 'tv');
  const tvModeUrl = `${location.pathname}?${tvModeSearch.toString()}${location.hash}`;

  const openTvMode = () => {
    const tvWindow = window.open(tvModeUrl, '_blank');
    if (!tvWindow) {
      toast.warn(t('Allow pop-ups to open the kitchen TV display in a new tab.'));
      return;
    }
    tvWindow.opener = null;
  };

  if (loading) {
    return (
      <div className={`kitchen-display-tab ${tvMode ? 'tv-mode' : ''}`}>
        <div className="kds-loading">{t('Loading kitchen orders...')}</div>
      </div>
    );
  }

  return (
    <div className={`kitchen-display-tab ${tvMode ? 'tv-mode' : ''}`}>
      <div className="kds-header">
        <div>
          <h1 className="kds-title">🍳 {t('Kitchen Display System')}</h1>
          <p className="kds-subtitle">{t('Manage orders and assign chefs to cooking tasks')}</p>
        </div>
        <div className="kds-header-actions">
          <span className={`kds-connection ${connected ? 'online' : 'offline'}`}>
            {connected ? `● ${t('Live')}` : `○ ${t('Reconnecting')}`}
          </span>
          {!tvMode && (
            <>
              <button
                className="kds-tv-mode"
                type="button"
                onClick={openTvMode}
              >
                📺 {t('Open TV mode')}
              </button>
              <button className="kds-refresh" onClick={() => loadOrders(false)}>🔄 {t('Refresh')}</button>
            </>
          )}
        </div>
      </div>

      <div className="kds-stats">
        <div className="kds-stat-card">
          <span className="kds-stat-icon">📦</span>
          <span className="kds-stat-label">{t('In Queue')}</span>
          <span className="kds-stat-value">{visibleOrders.length}</span>
        </div>
        <div className="kds-stat-card pending">
          <span className="kds-stat-icon">⏳</span>
          <span className="kds-stat-label">{t('Pending')}</span>
          <span className="kds-stat-value">{visibleOrders.filter((o) => o.status === 'pending').length}</span>
        </div>
        <div className="kds-stat-card cooking">
          <span className="kds-stat-icon">🔥</span>
          <span className="kds-stat-label">{t('Cooking')}</span>
          <span className="kds-stat-value">{visibleOrders.filter((o) => o.status === 'preparing' || o.status === 'cooking').length}</span>
        </div>
        <div className="kds-stat-card unassigned">
          <span className="kds-stat-icon">🧑‍🍳</span>
          <span className="kds-stat-label">{t('No Chef')}</span>
          <span className="kds-stat-value">{unassignedCount}</span>
        </div>
        <div className="kds-stat-card urgent">
          <span className="kds-stat-icon">⏰</span>
          <span className="kds-stat-label">{t('Over')} {URGENT_AFTER_MINUTES}{t('m')}</span>
          <span className="kds-stat-value">{urgentCount}</span>
        </div>
      </div>

      <div className="kds-controls">
        <div className="filter-group">
          <label>{t('Filter by Status')}</label>
          <div className="filter-buttons">
            {['all', 'pending', 'confirmed', 'preparing', 'cooking', 'assigned', 'unassigned'].map((status) => (
              <button
                key={status}
                className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {t(
                  status === 'all'
                    ? 'All'
                    : status === 'assigned'
                      ? 'Assigned'
                      : status === 'unassigned'
                        ? 'Unassigned'
                        : STATUS_LABELS[status]?.[1] || status
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="kds-container">
        <div className="kds-board">
          {queue.length === 0 ? (
            <div className="kds-empty">
              <p>🎉 {t('No orders in kitchen! Everything is caught up!')}</p>
            </div>
          ) : (
            <>
              <div className="kds-queue-head">
                <span className="kds-col-position">#</span>
                <span className="kds-col-order">{t('Order')}</span>
                <span className="kds-col-items">{t('Items')}</span>
                <span className="kds-col-ordered">{t('Ordered')}</span>
                <span className="kds-col-elapsed">{t('Elapsed')}</span>
                <span className="kds-col-chef">{t('Chef')}</span>
                <span className="kds-col-delivery">{t('Wait / Delivery')}</span>
                <span className="kds-col-action">{t('Action')}</span>
              </div>

              {queue.map(({ order, position }) => {
                const startMs = new Date(order.createdAt).getTime();
                const urgency = Number.isNaN(startMs) ? 'normal' : urgencyLevel(startMs, now);
                const isBusy = busyChefIds.has(order._id) || busyDeliveryIds.has(order._id) || busyWaiterIds.has(order._id);

                return (
                  <div key={order._id} className={`kds-row status-${order.status} urgency-${urgency}`}>
                    <div className="kds-col-position" data-label={t('Position')}>
                      <span className="kds-position-badge">{position}</span>
                    </div>

                    <div className="kds-col-order" data-label={t('Order')}>
                      <strong className="kds-order-number">#{getOrderNumberLabel(order.orderNumber)}</strong>
                      <span className={`kds-status-badge ${order.status}`}>{statusLabel(order.status, t)}</span>
                    </div>

                    <ul className="kds-col-items" data-label={t('Items')}>
                      {(order.items || []).map((item, index) => (
                        <li key={item.menuItem?._id || item.menuItem || index} className="kds-item">
                          <span className="kds-item-qty">{item.quantity}×</span>
                          <span className="kds-item-name">
                            {language === 'am' ? item.menuItem?.nameAm || item.name : item.name}
                          </span>
                        </li>
                      ))}
                      <li className="kds-customer-name">
                        {t('Customer')}: {order.customerName || order.customer?.name || t('Guest')}
                      </li>
                    </ul>

                    <div className="kds-col-ordered" data-label={t('Ordered')}>
                      <span className="kds-ordered-time">{formatClock(order.createdAt, language)}</span>
                    </div>

                    <div className="kds-col-elapsed" data-label={t('Elapsed')}>
                      <span className="kds-elapsed-time">
                        {Number.isNaN(startMs) ? '--:--' : formatElapsed(startMs, now)}
                      </span>
                    </div>

                    <div className="kds-col-chef" data-label={t('Chef')}>
                      {readOnly ? (
                        <span className="kds-chef-name">
                          {order.assignedChef ? order.assignedChef.name : '—'}
                        </span>
                      ) : (
                        <select
                          className="kds-chef-select"
                          value={order.assignedChef?._id || ''}
                          onChange={(event) => assignChefToOrder(order._id, event.target.value)}
                          aria-label={`${t('Assign chef')} #${getOrderNumberLabel(order.orderNumber)}`}
                        >
                          <option value="">{t('No chef assigned')}</option>
                          {chefs.map((chef) => (
                            <option key={chef._id} value={chef._id}>
                              {chef.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="kds-col-delivery" data-label={t('Wait / Delivery')}>
                      {readOnly ? (
                        <span className="kds-delivery-name">
                          {[
                            order.assignedWaiter?.name && `${t('Waiter')}: ${order.assignedWaiter.name}`,
                            order.assignedDelivery?.name && `${t('Delivery')}: ${order.assignedDelivery.name}`
                          ].filter(Boolean).join(' / ') || '—'}
                        </span>
                      ) : (
                        <div>
                          {user?.role === 'admin' ? (
                            <select
                              className="kds-delivery-select"
                              value={order.assignedWaiter?._id || ''}
                              onChange={(event) => assignWaiterToOrder(order._id, event.target.value)}
                              aria-label={`${t('Assign waiter')} #${getOrderNumberLabel(order.orderNumber)}`}
                              disabled={busyWaiterIds.has(order._id)}
                            >
                              <option value="">👤 {t('Assign waiter')}</option>
                              {waiters.map((waiter) => (
                                <option key={waiter._id} value={waiter._id}>
                                  {waiter.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="kds-delivery-name">
                              {[
                                order.assignedWaiter?.name && `${t('Waiter')}: ${order.assignedWaiter.name}`,
                                order.assignedDelivery?.name && `${t('Delivery')}: ${order.assignedDelivery.name}`
                              ].filter(Boolean).join(' / ') || '—'}
                            </span>
                          )}
                          {user?.role === 'admin' && (
                            <select
                              className="kds-delivery-select"
                              value={order.assignedDelivery?._id || ''}
                              onChange={(event) => assignDeliveryToOrder(order._id, event.target.value)}
                              aria-label={`${t('Assign delivery')} #${getOrderNumberLabel(order.orderNumber)}`}
                            >
                              <option value="">{t('Assign delivery')}</option>
                              {deliveries.map((delivery) => (
                                <option key={delivery._id} value={delivery._id}>
                                  {delivery.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="kds-col-action">
                      {!readOnly && (
                        <button
                          className="kds-complete-btn"
                          onClick={() => completeOrder(order)}
                          disabled={isBusy}
                          aria-label={`${t('Mark order ready')} #${getOrderNumberLabel(order.orderNumber)}`}
                        >
                          {isBusy ? `⏳ ${t('Saving…')}` : `✅ ${t('Complete')}`}
                        </button>
                      )}
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
