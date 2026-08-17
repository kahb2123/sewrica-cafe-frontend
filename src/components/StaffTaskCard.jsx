// src/components/StaffTaskCard.jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './StaffTaskCard.css';

const StaffTaskCard = ({ 
  task, 
  type, 
  onTaskUpdate,
  onChefAccept,
  onChefReject,
  onStartPreparing,
  onMarkReady,
  onDeliveryAccept,
  onDeliveryReject,
  onStartDelivery,
  onCompleteDelivery,
  onProcessPayment
}) => {
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [notes, setNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

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

  // ========== CHEF: ACCEPT ORDER ==========
  const handleChefAccept = async () => {
    if (!task._id || loading) return;
    
    setLoading(true);
    try {
      await onChefAccept(task._id);
      toast.success('✅ Order accepted successfully!');
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
      toast.error('❌ Order rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      if (onTaskUpdate) onTaskUpdate(task);
    } catch (error) {
      toast.error(error.message || 'Failed to reject order');
    } finally {
      setLoading(false);
    }
  };

  // ========== CHEF: START PREPARING ==========
  const handleStartPreparing = async () => {
    if (!task._id || loading) return;
    
    setLoading(true);
    try {
      await onStartPreparing(task._id);
      toast.success('👨‍🍳 Started preparing!');
      if (onTaskUpdate) onTaskUpdate(task);
    } catch (error) {
      toast.error(error.message || 'Failed to start preparing');
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
      toast.success('✅ Order ready for delivery!');
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
      await onDeliveryAccept(task._id);
      toast.success('✅ Delivery accepted!');
      if (onTaskUpdate) onTaskUpdate(task);
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
      await onDeliveryReject(task._id, rejectionReason);
      toast.error('❌ Delivery rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      if (onTaskUpdate) onTaskUpdate(task);
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
      await onStartDelivery(task._id);
      toast.success('🛵 Started delivery!');
      if (onTaskUpdate) onTaskUpdate(task);
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
      await onCompleteDelivery(task._id);
      toast.success('✅ Order delivered successfully!');
      if (onTaskUpdate) onTaskUpdate(task);
    } catch (error) {
      toast.error(error.message || 'Failed to complete delivery');
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
      toast.success('💰 Payment processed successfully!');
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

  // ========== RENDER CHEF BUTTONS ==========
  const renderChefButtons = () => {
    // Case 1: Order confirmed, not accepted/rejected → Show Accept/Reject
    if (task.status === 'confirmed' && !task.chefAccepted && !task.chefRejected) {
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
    
    // Case 2: Accepted but not started preparing
    if (task.status === 'confirmed' && task.chefAccepted && !task.cookingStartedAt) {
      return (
        <button 
          className="btn-preparing" 
          onClick={handleStartPreparing} 
          disabled={loading}
        >
          {loading ? 'Starting...' : '👨‍🍳 Start Preparing'}
        </button>
      );
    }
    
    // Case 3: Preparing in progress
    if ((task.status === 'preparing' || task.status === 'cooking') && 
        task.cookingStartedAt && !task.cookingCompletedAt) {
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
    
    return null;
  };

  // ========== RENDER DELIVERY BUTTONS ==========
  const renderDeliveryButtons = () => {
    // Case 1: Order ready, not accepted/rejected → Show Accept/Reject
    if (task.status === 'ready' && !task.deliveryAccepted && !task.deliveryRejected) {
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
    if (task.status === 'ready' && task.deliveryAccepted && !task.deliveryStartedAt) {
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
    if (task.status === 'out-for-delivery' && 
        task.deliveryStartedAt && !task.deliveryCompletedAt) {
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

  return (
    <div className={`staff-task-card ${type} ${task.status}`} data-status={task.status}>
      <div className="task-card-header">
        <div className="task-type-badge">
          {type === 'cook' ? '👨‍🍳 Kitchen' : type === 'delivery' ? '🚚 Delivery' : '💰 Cashier'}
        </div>
        <div className="task-status" style={{ backgroundColor: getStatusColor(task.status || task.paymentStatus) }}>
          {getStatusIcon(task.status || task.paymentStatus)} {task.status || task.paymentStatus || 'pending'}
        </div>
      </div>

      <div className="task-card-body">
        <div className="order-info">
          <h3 className="order-number">Order #{task.orderNumber || task._id?.slice(-6)}</h3>
          <span className="order-time">{formatDate(task.createdAt)}</span>
        </div>

        <div className="customer-info">
          <p><span className="info-label">👤 Customer:</span> {task.customerName || task.customer?.name || 'Guest'}</p>
          <p><span className="info-label">📞 Phone:</span> {task.customerPhone || task.customer?.phone || 'N/A'}</p>
          {type === 'delivery' && task.deliveryAddress && (
            <p><span className="info-label">📍 Address:</span> {task.deliveryAddress}</p>
          )}
          <p><span className="info-label">💰 Total:</span> ETB {task.totalAmount}</p>
        </div>

        <div className="items-section">
          <h4>Items to {type === 'cook' ? 'prepare' : type === 'delivery' ? 'deliver' : 'process'}:</h4>
          <div className="items-list">
            {task.items?.map((item, idx) => (
              <div key={idx} className="item-row">
                <span className="item-name">{item.quantity}x {item.name}</span>
                <span className="item-price">ETB {item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="order-total">
            <strong>Total: ETB {task.totalAmount}</strong>
          </div>
        </div>

        {task.specialRequests && (
          <div className="special-requests">
            <span className="requests-label">📋 Special Requests:</span>
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
        {type === 'cook' && renderChefButtons()}
        {type === 'delivery' && renderDeliveryButtons()}
        {type === 'cashier' && renderCashierButtons()}
        
        <button 
          className="btn-details"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '▲ Hide Notes' : '▼ Add Notes'}
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
    </div>
  );
};

export default StaffTaskCard;