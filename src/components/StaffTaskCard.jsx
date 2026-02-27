import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { staffService } from '../services/api';
import './StaffTaskCard.css';

const StaffTaskCard = ({ task, type, onTaskUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [notes, setNotes] = useState('');

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      confirmed: '#3498db',
      preparing: '#9b59b6',
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
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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

  const handleStartTask = async () => {
    if (!task._id) return;
    
    setLoading(true);
    try {
      let response;
      if (type === 'cook') {
        response = await staffService.startCooking(task._id);
        toast.success('Started preparing order');
      } else if (type === 'delivery') {
        response = await staffService.startDelivery(task._id);
        toast.success('Started delivery');
      }
      
      if (onTaskUpdate) {
        onTaskUpdate(response.order);
      }
    } catch (error) {
      console.error('Error starting task:', error);
      toast.error(error.message || 'Failed to start task');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!task._id) return;
    
    setLoading(true);
    try {
      let response;
      if (type === 'cook') {
        response = await staffService.completeCooking(task._id);
        toast.success('Order completed! Ready for pickup/delivery');
      } else if (type === 'delivery') {
        response = await staffService.completeDelivery(task._id);
        toast.success('Order delivered successfully!');
      }
      
      if (onTaskUpdate) {
        onTaskUpdate(response.order);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error(error.message || 'Failed to complete task');
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeSpent = () => {
    if (type === 'cook' && task.cookingStartedAt) {
      const start = new Date(task.cookingStartedAt);
      const now = new Date();
      const diffMs = now - start;
      const diffMins = Math.floor(diffMs / 60000);
      return diffMins;
    } else if (type === 'delivery' && task.deliveryStartedAt) {
      const start = new Date(task.deliveryStartedAt);
      const now = new Date();
      const diffMs = now - start;
      const diffMins = Math.floor(diffMs / 60000);
      return diffMins;
    }
    return 0;
  };

  const timeSpent = calculateTimeSpent();

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
                {item.specialRequests && (
                  <span className="item-notes">📝 {item.specialRequests}</span>
                )}
              </div>
            ))}
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

        {/* Notes input for completion */}
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
        {/* Show different buttons based on task status */}
        {type === 'cook' && (
          <>
            {task.status === 'confirmed' && !task.cookingStartedAt && (
              <button 
                className="btn-start"
                onClick={handleStartTask}
                disabled={loading}
              >
                {loading ? 'Starting...' : '👨‍🍳 Start Cooking'}
              </button>
            )}

            {task.status === 'preparing' && task.cookingStartedAt && !task.cookingCompletedAt && (
              <button 
                className="btn-complete"
                onClick={handleCompleteTask}
                disabled={loading}
              >
                {loading ? 'Completing...' : '✅ Mark as Ready'}
              </button>
            )}
          </>
        )}

        {type === 'delivery' && (
          <>
            {task.status === 'ready' && !task.deliveryStartedAt && (
              <button 
                className="btn-start"
                onClick={handleStartTask}
                disabled={loading}
              >
                {loading ? 'Starting...' : '🛵 Start Delivery'}
              </button>
            )}

            {task.status === 'out-for-delivery' && task.deliveryStartedAt && !task.deliveryCompletedAt && (
              <button 
                className="btn-complete"
                onClick={handleCompleteTask}
                disabled={loading}
              >
                {loading ? 'Completing...' : '✅ Mark as Delivered'}
              </button>
            )}
          </>
        )}

        <button 
          className="btn-details"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '▲ Hide Notes' : '▼ Add Notes'}
        </button>
      </div>

      {/* Show completion time if task is done */}
      {(type === 'cook' && task.cookingCompletedAt) && (
        <div className="completion-badge">
          ✅ Completed at {formatTime(task.cookingCompletedAt)} ({task.cookingTime || '?'} min)
        </div>
      )}

      {(type === 'delivery' && task.deliveryCompletedAt) && (
        <div className="completion-badge">
          ✅ Delivered at {formatTime(task.deliveryCompletedAt)} ({task.deliveryTime || '?'} min)
        </div>
      )}
    </div>
  );
};

export default StaffTaskCard;