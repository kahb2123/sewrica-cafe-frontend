// src/components/StaffTaskCard.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/useLanguage';
import { PERMISSIONS } from '../services/api';
import PermissionGate from './PermissionGate';
import { toast } from 'react-toastify';
import './StaffTaskCard.css';

const StaffTaskCard = ({ 
  task, 
  type, 
  canWrite = false,
  onTaskUpdate,
  onChefAccept,
  onChefReject,
  onStartPreparing,
  onMarkReady,
  onDeliveryAccept,
  onDeliveryReject,
  onStartDelivery,
  onCompleteDelivery,
  onCompleteWaiterTask,
  onGroupDeliveryAction,
  onProcessPayment
}) => {
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [notes, setNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { hasPermission } = useAuth();
  const { t } = useLanguage();
  const sourceOrders = task.sourceOrders || [task];

  console.log('📋 StaffTaskCard - Task:', {
    id: task._id,
    orderNumber: task.orderNumber,
    status: task.status,
    chefAccepted: task.chefAccepted,
    chefRejected: task.chefRejected,
    cookingStartedAt: task.cookingStartedAt,
    cookingCompletedAt: task.cookingCompletedAt,
    deliveryAccepted: task.deliveryAccepted,
    deliveryStartedAt: task.deliveryStartedAt,
    deliveryCompletedAt: task.deliveryCompletedAt,
    type: type
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      confirmed: '#3498db',
      preparing: '#9b59b6',
      cooking: '#9b59b6',
      ready: '#2ecc71',
      delivered: '#27ae60',
      cancelled: '#e74c3c',
      'out-for-delivery': '#e67e22'
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      confirmed: '✅',
      preparing: '👨‍🍳',
      cooking: '👨‍🍳',
      ready: '🍽️',
      delivered: '🚚',
      cancelled: '❌',
      'out-for-delivery': '🛵'
    };
    return icons[status] || '📦';
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDeliveryAddress = (address) => {
    if (typeof address === 'string') return address;
    if (!address || typeof address !== 'object') return 'Address not provided';

    return [
      address.street,
      address.area,
      address.building,
      address.floor,
      address.city,
      address.additionalInfo
    ].filter(Boolean).join(', ') || 'Address not provided';
  };

  // ========== CHEF: ACCEPT ORDER ==========
  const handleChefAccept = async () => {
    if (!task._id || loading) return;
    
    setLoading(true);
    try {
      await onChefAccept(task._id);
       toast.success('Order accepted');
      if (onTaskUpdate) onTaskUpdate(task);
    } catch (error) {
      toast.error(error.message || 'Failed to accept order');
    } finally {
      setLoading(false);
    }
  };

  // ========== CHEF: REJECT ORDER ==========
  const handleChefReject = async () => {
    if (!task._id || !rejectionReason || loading) return;
    
    setLoading(true);
    try {
      await onChefReject(task._id, rejectionReason);
       toast.info('Order rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      if (onTaskUpdate) onTaskUpdate(task);
    } catch (error) {
      toast.error(error.message || 'Failed to reject order');
    } finally {
      setLoading(false);
    }
  };

  // ========== CHEF: START COOKING ==========
  const handleStartPreparing = async () => {
    if (!task._id || loading) return;
    
    setLoading(true);
    try {
      await onStartPreparing(task._id);
       toast.success('Cooking started');
      if (onTaskUpdate) onTaskUpdate(task);
    } catch (error) {
      toast.error(error.message || 'Failed to start cooking');
    } finally {
      setLoading(false);
    }
  };

  // ========== CHEF: MARK AS READY ==========
  const handleMarkReady = async () => {
    if (!task._id || loading) return;
    
    setLoading(true);
    try {
      await onMarkReady(task._id);
       toast.success('Order marked ready');
      if (onTaskUpdate) onTaskUpdate(task);
    } catch (error) {
      toast.error(error.message || 'Failed to mark ready');
    } finally {
      setLoading(false);
    }
  };

  // ========== DELIVERY: ACCEPT DELIVERY ==========
  const handleDeliveryAccept = async () => {
    if (!task._id || loading) return;
    
    setLoading(true);
    try {
      const readyOrders = sourceOrders.filter((order) =>
        order.status === 'ready' && !order.deliveryAccepted && !order.deliveryRejected
      );
      if (onGroupDeliveryAction) {
        await onGroupDeliveryAction('accept', readyOrders.map((order) => order._id));
      } else {
        await onDeliveryAccept(task._id);
        if (onTaskUpdate) onTaskUpdate(task);
      }
      toast.success('Delivery accepted');
    } catch (error) {
      toast.error(error.message || 'Failed to accept delivery');
    } finally {
      setLoading(false);
    }
  };

  // ========== DELIVERY: REJECT DELIVERY ==========
  const handleDeliveryReject = async () => {
    if (!task._id || !rejectionReason || loading) return;
    
    setLoading(true);
    try {
      const readyOrders = sourceOrders.filter((order) =>
        order.status === 'ready' && !order.deliveryAccepted && !order.deliveryRejected
      );
      if (onGroupDeliveryAction) {
        await onGroupDeliveryAction('reject', readyOrders.map((order) => order._id), rejectionReason);
      } else {
        await onDeliveryReject(task._id, rejectionReason);
        if (onTaskUpdate) onTaskUpdate(task);
      }
      toast.info('Delivery rejected');
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error) {
      toast.error(error.message || 'Failed to reject delivery');
    } finally {
      setLoading(false);
    }
  };

  // ========== DELIVERY: START DELIVERY ==========
  const handleStartDelivery = async () => {
    if (!task._id || loading) return;
    
    setLoading(true);
    try {
      const readyOrders = sourceOrders.filter((order) =>
        order.status === 'ready' && order.deliveryAccepted && !order.deliveryStartedAt
      );
      if (onGroupDeliveryAction) {
        await onGroupDeliveryAction('start', readyOrders.map((order) => order._id));
      } else {
        await onStartDelivery(task._id);
        if (onTaskUpdate) onTaskUpdate(task);
      }
      toast.success('Delivery started');
    } catch (error) {
      toast.error(error.message || 'Failed to start delivery');
    } finally {
      setLoading(false);
    }
  };

  // ========== DELIVERY: COMPLETE DELIVERY ==========
  const handleCompleteDelivery = async () => {
    if (!task._id || loading) return;
    
    setLoading(true);
    try {
       await onCompleteDelivery(sourceOrders.map((order) => order._id));
       toast.success('Order delivered');
    } catch (error) {
      toast.error(error.message || 'Failed to complete delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWaiterTask = async () => {
    if (!task._id || loading) return;

    setLoading(true);
    try {
      await onCompleteWaiterTask(sourceOrders.map((order) => order._id));
      toast.success(t('Task completed'));
    } catch (error) {
      toast.error(error.message || t('Failed to complete task'));
    } finally {
      setLoading(false);
    }
  };

  // ========== CASHIER: PROCESS PAYMENT ==========
  const handleProcessPayment = async () => {
    if (!task._id || loading) return;
    
    setLoading(true);
    try {
      await onProcessPayment(task._id, task.totalAmount);
       toast.success('Payment processed');
      if (onTaskUpdate) onTaskUpdate(task);
    } catch (error) {
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeSpent = () => {
    if (type === 'cook' && task.cookingStartedAt) {
      const start = new Date(task.cookingStartedAt);
      const now = new Date();
      const diffMs = now - start;
      return Math.floor(diffMs / 60000);
    } else if (type === 'delivery' && task.deliveryStartedAt) {
      const start = new Date(task.deliveryStartedAt);
      const now = new Date();
      const diffMs = now - start;
      return Math.floor(diffMs / 60000);
    }
    return 0;
  };

  const timeSpent = calculateTimeSpent();

  // ========== RENDER CHEF BUTTONS - FIXED LOGIC ==========
  const renderChefButtons = () => {
    console.log('🔍 Chef button check:', {
      status: task.status,
      chefAccepted: task.chefAccepted,
      chefRejected: task.chefRejected,
      cookingStartedAt: !!task.cookingStartedAt,
      cookingCompletedAt: !!task.cookingCompletedAt
    });

    // Case 1: Order confirmed, not accepted/rejected → Show Accept/Reject
    if (task.status === 'confirmed' && !task.chefAccepted && !task.chefRejected) {
      console.log('✅ Showing Accept/Reject buttons');
      return (
        <div className="button-group">
          <button 
            className="btn-accept" 
            onClick={handleChefAccept} 
            disabled={loading}
          >
            {loading ? 'Processing...' : '✅ Accept Order'}
          </button>
          <button 
            className="btn-reject" 
            onClick={() => setShowRejectModal(true)} 
            disabled={loading}
          >
            ❌ Reject Order
          </button>
        </div>
      );
    }
    
    // Case 2: Accepted and preparing, but cooking has not started
    if (task.status === 'preparing' && task.chefAccepted && !task.cookingStartedAt) {
      console.log('✅ Showing Start Cooking button');
      return (
        <button 
          className="btn-preparing" 
          onClick={handleStartPreparing} 
          disabled={loading}
        >
          {loading ? 'Starting...' : '👨‍🍳 Start Cooking'}
        </button>
      );
    }
    
    // Case 3: Status is 'cooking' and cooking is in progress
    if (task.status === 'cooking' && !task.cookingCompletedAt) {
      console.log('✅ Showing Mark as Ready button (status is cooking)');
      return (
        <button 
          className="btn-ready" 
          onClick={handleMarkReady} 
          disabled={loading}
        >
          {loading ? 'Marking...' : '✅ Mark as Ready'}
        </button>
      );
    }
    
    console.log('❌ No chef actions available');
    return null;
  };

  // ========== RENDER DELIVERY BUTTONS ==========
  const renderDeliveryButtons = () => {
    const activeOrders = sourceOrders.filter((order) => order.status !== 'cancelled');
    const readyOrders = activeOrders.filter((order) => order.status === 'ready');
    const canAccept = readyOrders.some((order) => !order.deliveryAccepted && !order.deliveryRejected);
    const canStart = readyOrders.some((order) => order.deliveryAccepted && !order.deliveryStartedAt);
    const allOutForDelivery = activeOrders.length > 0 &&
      activeOrders.every((order) => order.status === 'out-for-delivery');
    console.log('🔍 Delivery button check:', {
      status: task.status,
      deliveryAccepted: task.deliveryAccepted,
      deliveryRejected: task.deliveryRejected,
      deliveryStartedAt: !!task.deliveryStartedAt,
      deliveryCompletedAt: !!task.deliveryCompletedAt
    });
    
    // Case 1: Order ready, not accepted/rejected → Show Accept/Reject
    if (canAccept) {
      console.log('✅ Showing Accept/Reject buttons for delivery');
      return (
        <div className="button-group">
          <button 
            className="btn-accept" 
            onClick={handleDeliveryAccept} 
            disabled={loading}
          >
            {loading ? 'Processing...' : '✅ Accept Delivery'}
          </button>
          <button 
            className="btn-reject" 
            onClick={() => setShowRejectModal(true)} 
            disabled={loading}
          >
            ❌ Reject Delivery
          </button>
        </div>
      );
    }
    
    // Case 2: Accepted but not started
    if (canStart) {
      console.log('✅ Showing Start Delivery button');
      return (
        <button 
          className="btn-deliver" 
          onClick={handleStartDelivery} 
          disabled={loading}
        >
          {loading ? 'Starting...' : '🛵 Start Delivery'}
        </button>
      );
    }
    
    // Case 3: In progress
    if (allOutForDelivery) {
      console.log('✅ Showing Complete Delivery button');
      return (
        <button 
          className="btn-complete" 
          onClick={handleCompleteDelivery} 
          disabled={loading}
        >
          {loading ? 'Completing...' : '✅ Complete Delivery'}
        </button>
      );
    }
    
    console.log('❌ No delivery buttons to show');
    return null;
  };

  // ========== RENDER CASHIER BUTTONS ==========
  const renderCashierButtons = () => {
    if (task.paymentStatus === 'pending') {
      return (
        <button 
          className="btn-payment" 
          onClick={handleProcessPayment} 
          disabled={loading}
        >
          {loading ? 'Processing...' : '💰 Process Payment'}
        </button>
      );
    }
    return null;
  };

  const renderWaiterButtons = () => {
    if (task.waiterCompletedAt || sourceOrders.every((order) => order.status === 'cancelled')) return null;
    return (
      <button
        className="btn-complete"
        onClick={handleCompleteWaiterTask}
        disabled={loading}
      >
        {loading ? t('Completing...') : `✅ ${t('Complete Task')}`}
      </button>
    );
  };

  return (
    <div className={`staff-task-card ${type} ${task.status}`} data-status={task.status}>
      <div className="task-card-header">
        <div className="task-type-badge">
          {type === 'cook' ? `👨‍🍳 ${t('Kitchen')}` : type === 'delivery' ? `🚚 ${t('Delivery')}` : type === 'waiter' ? `🧑‍🍽️ ${t('Waiter')}` : `💰 ${t('Cashier')}`}
        </div>
        <div className="task-status" style={{ backgroundColor: getStatusColor(task.status || task.paymentStatus) }}>
          {getStatusIcon(task.status || task.paymentStatus)} {task.status === 'multiple' ? t('Multiple statuses') : task.status || task.paymentStatus || 'pending'}
        </div>
      </div>

      <div className="task-card-body">
        <div className="order-info">
          <h3 className="order-number">
            {task.orderCount > 1
              ? `${t('Orders')} #${task.orderNumber}`
              : `Order #${task.orderNumber || task._id?.slice(-6)}`}
          </h3>
          <span className="order-time">{formatDate(task.createdAt)}</span>
        </div>

        <div className="customer-info">
          {type !== 'waiter' && (
            <p><span className="info-label">👤 {t('Customer:')}</span> {task.customerName || task.customer?.name || t('Guest')}</p>
          )}
          <p><span className="info-label">📞 {t('Phone:')}</span> {task.customerPhone || task.customer?.phone || 'N/A'}</p>
          {task.tableNumber && (
            <p><span className="info-label">🍽️ {t('Table number:')}</span> {task.tableNumber}</p>
          )}
          {type === 'delivery' && task.deliveryAddress && (
            <p><span className="info-label">📍 {t('Address:')}</span> {formatDeliveryAddress(task.deliveryAddress)}</p>
          )}
          <p><span className="info-label">💰 {t('Total:')}</span> ETB {Number(task.totalAmount || 0).toFixed(2)}</p>
        </div>

        <div className="items-section">
          <h4>{t(type === 'cook' ? 'Items to prepare:' : type === 'delivery' ? 'Items to deliver:' : type === 'waiter' ? 'Items in order:' : 'Items to process:')}</h4>
          <div className="items-list">
            {task.items?.map((item, idx) => (
              <div key={idx} className="item-row">
                <span className="item-name">{item.quantity}x {item.name}</span>
                <span className="item-price">ETB {(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="order-total">
            <strong>{t('Total:')} ETB {Number(task.totalAmount || 0).toFixed(2)}</strong>
          </div>
        </div>

        {task.specialRequests && (
          <div className="special-requests">
            <span className="requests-label">📋 {t('Special Requests:')}</span>
            <p>{task.specialRequests}</p>
          </div>
        )}

        {(type === 'cook' && task.cookingStartedAt && !task.cookingCompletedAt) ||
         (type === 'delivery' && task.deliveryStartedAt && !task.deliveryCompletedAt) ? (
          <div className="timer-section">
            <div className="timer">
              <span className="timer-icon">⏱️</span>
              <span className="timer-value">{timeSpent} min</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="task-card-footer">
        {canWrite && type === 'cook' && hasPermission(PERMISSIONS.ORDERS_ACCEPT) && renderChefButtons()}
        {canWrite && type === 'delivery' && hasPermission(PERMISSIONS.ORDERS_ACCEPT) && renderDeliveryButtons()}
        {canWrite && type === 'waiter' && renderWaiterButtons()}
        {canWrite && type === 'cashier' && hasPermission(PERMISSIONS.PAYMENTS_PROCESS) && renderCashierButtons()}
        
        <button 
          className="btn-details"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? t('Hide Notes') : t('Add Notes')}
        </button>
      </div>

      {/* Notes section */}
      {showDetails && (
        <div className="notes-section">
          <textarea
            placeholder="Add notes (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="2"
          />
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content reject-modal" onClick={e => e.stopPropagation()}>
            <h2>Reject Order #{task.orderNumber || task._id?.slice(-6)}</h2>
            <p className="warning-text">Are you sure you want to reject this order?</p>
            
            <div className="form-group">
              <label>Reason for rejection *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Out of stock, Too busy, Delivery area too far, etc."
                rows="3"
                className="form-control"
                required
              />
            </div>
            
            <div className="modal-actions">
              <button onClick={() => setShowRejectModal(false)} className="btn-cancel">
                Cancel
              </button>
              <button 
                onClick={type === 'cook' ? handleChefReject : handleDeliveryReject} 
                className="btn-confirm-reject" 
                disabled={!rejectionReason}
              >
                Yes, Reject Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion badges */}
      {type === 'cook' && task.cookingCompletedAt && (
        <div className="completion-badge">
          ✅ Completed at {formatTime(task.cookingCompletedAt)} ({task.cookingTime || '?'} min)
        </div>
      )}

      {type === 'delivery' && task.deliveryCompletedAt && (
        <div className="completion-badge">
          ✅ Delivered at {formatTime(task.deliveryCompletedAt)} ({task.deliveryTime || '?'} min)
        </div>
      )}

      {type === 'waiter' && task.waiterCompletedAt && (
        <div className="completion-badge">
          ✅ {t('Completed at')} {formatTime(task.waiterCompletedAt)}
        </div>
      )}

      {type === 'delivery' && task.orderCount > 1 && task.deliveryCompletedAt && (
        <div className="completion-badge">
          ✅ {t('Delivery group completed')} {formatTime(task.deliveryCompletedAt)}
        </div>
      )}
    </div>
  );
};

export default StaffTaskCard;