// src/components/StaffTaskCard.jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { staffService } from '../services/api';
import './StaffTaskCard.css';

const StaffTaskCard = ({ task, type, onTaskUpdate }) => {
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

  // ========== CHEF ACCEPTANCE ==========
  const handleChefAccept = async () => {
    if (!task._id) return;
    
    setLoading(true);
    try {
      const response = await staffService.chefAcceptOrder(task._id, notes);
      toast.success('✅ Order accepted! You can start cooking.');
      if (onTaskUpdate) {
        onTaskUpdate(response.order);
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error(error.response?.data?.message || 'Failed to accept order');
    } finally {
      setLoading(false);
    }
  };

  const handleChefReject = async () => {
    if (!task._id || !rejectionReason) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setLoading(true);
    try {
      const response = await staffService.chefRejectOrder(task._id, rejectionReason);
      toast.error('❌ Order rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      if (onTaskUpdate) {
        onTaskUpdate(response.order);
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error(error.response?.data?.message || 'Failed to reject order');
    } finally {
      setLoading(false);
    }
  };

  // ========== DELIVERY ACCEPTANCE ==========
  const handleDeliveryAccept = async () => {
    if (!task._id) return;
    
    setLoading(true);
    try {
      const response = await staffService.deliveryAcceptOrder(task._id, notes);
      toast.success('✅ Delivery accepted! You can start delivery.');
      if (onTaskUpdate) {
        onTaskUpdate(response.order);
      }
    } catch (error) {
      console.error('Error accepting delivery:', error);
      toast.error(error.response?.data?.message || 'Failed to accept delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveryReject = async () => {
    if (!task._id || !rejectionReason) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setLoading(true);
    try {
      const response = await staffService.deliveryRejectOrder(task._id, rejectionReason);
      toast.error('❌ Delivery rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      if (onTaskUpdate) {
        onTaskUpdate(response.order);
      }
    } catch (error) {
      console.error('Error rejecting delivery:', error);
      toast.error(error.response?.data?.message || 'Failed to reject delivery');
    } finally {
      setLoading(false);
    }
  };

  // ========== CHEF COOKING ACTIONS ==========
  const handleStartCooking = async () => {
    if (!task._id) return;
    
    setLoading(true);
    try {
      const response = await staffService.startCooking(task._id);
      toast.success('👨‍🍳 Started cooking!');
      if (onTaskUpdate) {
        onTaskUpdate(response.order);
      }
    } catch (error) {
      console.error('Error starting cooking:', error);
      toast.error(error.response?.data?.message || 'Failed to start cooking');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReady = async () => {
    if (!task._id) return;
    
    setLoading(true);
    try {
      const response = await staffService.completeCooking(task._id);
      toast.success('✅ Order ready for delivery!');
      if (onTaskUpdate) {
        onTaskUpdate(response.order);
      }
    } catch (error) {
      console.error('Error marking ready:', error);
      toast.error(error.response?.data?.message || 'Failed to mark ready');
    } finally {
      setLoading(false);
    }
  };

  // ========== DELIVERY ACTIONS ==========
  const handleStartDelivery = async () => {
    if (!task._id) return;
    
    setLoading(true);
    try {
      const response = await staffService.startDelivery(task._id);
      toast.success('🛵 Started delivery!');
      if (onTaskUpdate) {
        onTaskUpdate(response.order);
      }
    } catch (error) {
      console.error('Error starting delivery:', error);
      toast.error(error.response?.data?.message || 'Failed to start delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDelivery = async () => {
    if (!task._id) return;
    
    setLoading(true);
    try {
      const response = await staffService.completeDelivery(task._id);
      toast.success('✅ Order delivered successfully!');
      if (onTaskUpdate) {
        onTaskUpdate(response.order);
      }
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast.error(error.response?.data?.message || 'Failed to complete delivery');
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

  // ========== BUTTON LOGIC FIXED ==========
  
  // For Chef (type === 'cook')
  const getChefActions = () => {
    // Case 1: Order is confirmed but not yet accepted
    if (task.status === 'confirmed' && !task.chefAccepted && !task.chefRejected) {
      return (
        <div className="accept-reject-buttons">
          <button className="btn-accept" onClick={handleChefAccept} disabled={loading}>
            {loading ? 'Processing...' : '✓ Accept Order'}
          </button>
          <button className="btn-reject" onClick={() => setShowRejectModal(true)} disabled={loading}>
            ✗ Reject Order
          </button>
        </div>
      );
    }
    
    // Case 2: Accepted but cooking not started
    if (task.status === 'confirmed' && task.chefAccepted && !task.cookingStartedAt) {
      return (
        <button className="btn-start" onClick={handleStartCooking} disabled={loading}>
          {loading ? 'Starting...' : '👨‍🍳 Start Cooking'}
        </button>
      );
    }
    
    // Case 3: Cooking in progress
    if (task.status === 'preparing' && task.cookingStartedAt && !task.cookingCompletedAt) {
      return (
        <button className="btn-complete" onClick={handleMarkReady} disabled={loading}>
          {loading ? 'Marking...' : '✅ Mark as Ready'}
        </button>
      );
    }
    
    return null;
  };
  
  // For Delivery (type === 'delivery')
  const getDeliveryActions = () => {
    // Case 1: Order is ready but not yet accepted
    if (task.status === 'ready' && !task.deliveryAccepted && !task.deliveryRejected) {
      return (
        <div className="accept-reject-buttons">
          <button className="btn-accept" onClick={handleDeliveryAccept} disabled={loading}>
            {loading ? 'Processing...' : '✓ Accept Delivery'}
          </button>
          <button className="btn-reject" onClick={() => setShowRejectModal(true)} disabled={loading}>
            ✗ Reject Delivery
          </button>
        </div>
      );
    }
    
    // Case 2: Accepted but delivery not started
    if (task.status === 'ready' && task.deliveryAccepted && !task.deliveryStartedAt) {
      return (
        <button className="btn-start" onClick={handleStartDelivery} disabled={loading}>
          {loading ? 'Starting...' : '🛵 Start Delivery'}
        </button>
      );
    }
    
    // Case 3: Delivery in progress
    if (task.status === 'out-for-delivery' && task.deliveryStartedAt && !task.deliveryCompletedAt) {
      return (
        <button className="btn-complete" onClick={handleCompleteDelivery} disabled={loading}>
          {loading ? 'Completing...' : '✅ Mark as Delivered'}
        </button>
      );
    }
    
    return null;
  };

  return (
    <div className={`staff-task-card ${type} ${task.status}`} data-status={task.status}>
      <div className="task-card-header">
        <div className="task-type-badge">
          {type === 'cook' ? '👨‍🍳 Kitchen' : '🚚 Delivery'}
        </div>
        <div className="task-status" style={{ backgroundColor: getStatusColor(task.status) }}>
          {getStatusIcon(task.status)} {task.status}
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
          <p><span className="info-label">📍 Address:</span> {task.deliveryAddress ? 
            `${task.deliveryAddress.area || ''} ${task.deliveryAddress.street || ''}`.trim() || 'Pickup' 
            : 'Pickup'}
          </p>
        </div>

        <div className="items-section">
          <h4>Items to {type === 'cook' ? 'prepare' : 'deliver'}:</h4>
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

        {/* Timer for active tasks */}
        {((type === 'cook' && task.cookingStartedAt && !task.cookingCompletedAt) ||
          (type === 'delivery' && task.deliveryStartedAt && !task.deliveryCompletedAt)) && (
          <div className="timer-section">
            <div className="timer">
              <span className="timer-icon">⏱️</span>
              <span className="timer-value">{timeSpent} min</span>
            </div>
          </div>
        )}

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
      </div>

      <div className="task-card-footer">
        {/* Show appropriate actions based on role */}
        {type === 'cook' && getChefActions()}
        {type === 'delivery' && getDeliveryActions()}

        <button 
          className="btn-details"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '▲ Hide Notes' : '▼ Add Notes'}
        </button>
      </div>

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
      {(type === 'cook' && task.cookingCompletedAt) && (
        <div className="completion-badge">
          ✅ Completed at {formatTime(task.cookingCompletedAt)} ({task.cookingTime} min)
        </div>
      )}

      {(type === 'delivery' && task.deliveryCompletedAt) && (
        <div className="completion-badge">
          ✅ Delivered at {formatTime(task.deliveryCompletedAt)} ({task.deliveryTime} min)
        </div>
      )}
    </div>
  );
};

export default StaffTaskCard;