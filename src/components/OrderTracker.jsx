import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { FaCheckCircle, FaTimesCircle, FaClock, FaSpinner } from 'react-icons/fa';
import './OrderTracker.css';

const OrderTracker = ({ orderId, initialStatus = 'pending' }) => {
  const { registerOrder, onOrderStatusUpdate, connected } = useSocket();
  const [orderStatus, setOrderStatus] = useState(initialStatus);
  const [statusMessage, setStatusMessage] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (orderId && connected) {
      // Register this order for updates
      registerOrder(orderId);

      // Listen for status updates
      onOrderStatusUpdate((data) => {
        console.log('Order status updated:', data);
        setOrderStatus(data.status);
        
        if (data.message) {
          setStatusMessage(data.message);
        }

        // Handle rejection
        if (data.status === 'cancelled') {
          setRejectionReason(data.notes || 'No reason provided');
          setShowRejectionModal(true);
        }

        // Play notification sound for accepted/rejected
        if (data.status === 'confirmed') {
          playNotificationSound('accepted');
        } else if (data.status === 'cancelled') {
          playNotificationSound('rejected');
        }
      });
    }
  }, [orderId, connected]);

  const playNotificationSound = (type) => {
    // You can add sound effects here
    // For now, just console log
    console.log(`🔔 Order ${type} notification`);
  };

  const getStatusIcon = () => {
    switch(orderStatus) {
      case 'confirmed':
        return <FaCheckCircle className="status-icon accepted" />;
      case 'cancelled':
        return <FaTimesCircle className="status-icon rejected" />;
      case 'preparing':
        return <FaSpinner className="status-icon preparing" />;
      case 'ready':
        return <FaCheckCircle className="status-icon ready" />;
      case 'delivered':
        return <FaCheckCircle className="status-icon delivered" />;
      default:
        return <FaClock className="status-icon pending" />;
    }
  };

  const getStatusColor = () => {
    switch(orderStatus) {
      case 'confirmed': return '#4CAF50';
      case 'cancelled': return '#f44336';
      case 'preparing': return '#FF9800';
      case 'ready': return '#2196F3';
      case 'delivered': return '#4CAF50';
      default: return '#FFC107';
    }
  };

  const getStatusText = () => {
    switch(orderStatus) {
      case 'confirmed': return 'Order Accepted';
      case 'cancelled': return 'Order Rejected';
      case 'preparing': return 'Preparing Your Food';
      case 'ready': return 'Ready for Pickup/Delivery';
      case 'delivered': return 'Delivered';
      default: return 'Order Pending';
    }
  };

  return (
    <>
      <div className="order-tracker">
        <div className="tracker-header" style={{ borderColor: getStatusColor() }}>
          {getStatusIcon()}
          <div className="status-info">
            <h3>{getStatusText()}</h3>
            {statusMessage && <p className="status-message">{statusMessage}</p>}
          </div>
        </div>

        <div className="tracker-timeline">
          <div className={`timeline-step ${orderStatus !== 'pending' ? 'completed' : ''}`}>
            <div className="step-dot"></div>
            <div className="step-label">
              <span>Order Placed</span>
              <small>Your order has been received</small>
            </div>
          </div>

          <div className={`timeline-step ${orderStatus === 'confirmed' || orderStatus === 'preparing' || orderStatus === 'ready' || orderStatus === 'delivered' ? 'completed' : ''} ${orderStatus === 'cancelled' ? 'cancelled' : ''}`}>
            <div className="step-dot"></div>
            <div className="step-label">
              <span>{orderStatus === 'cancelled' ? 'Order Rejected' : 'Order Confirmed'}</span>
              <small>
                {orderStatus === 'cancelled' 
                  ? 'Restaurant could not accept your order' 
                  : 'Restaurant has accepted your order'}
              </small>
            </div>
          </div>

          {orderStatus !== 'cancelled' && (
            <>
              <div className={`timeline-step ${orderStatus === 'preparing' || orderStatus === 'ready' || orderStatus === 'delivered' ? 'completed' : ''}`}>
                <div className="step-dot"></div>
                <div className="step-label">
                  <span>Preparing</span>
                  <small>Your food is being prepared</small>
                </div>
              </div>

              <div className={`timeline-step ${orderStatus === 'ready' || orderStatus === 'delivered' ? 'completed' : ''}`}>
                <div className="step-dot"></div>
                <div className="step-label">
                  <span>Ready</span>
                  <small>Your order is ready</small>
                </div>
              </div>

              <div className={`timeline-step ${orderStatus === 'delivered' ? 'completed' : ''}`}>
                <div className="step-dot"></div>
                <div className="step-label">
                  <span>Delivered</span>
                  <small>Enjoy your meal!</small>
                </div>
              </div>
            </>
          )}
        </div>

        {!connected && (
          <div className="connection-warning">
            <p>⚠️ Reconnecting to order updates...</p>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="rejection-modal">
          <div className="modal-content">
            <FaTimesCircle className="rejection-icon" />
            <h2>Order Rejected</h2>
            <p className="reason">{rejectionReason}</p>
            <p className="help-text">
              Your order could not be processed at this time. 
              Please try again or contact us for assistance.
            </p>
            <button 
              className="close-btn"
              onClick={() => setShowRejectionModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderTracker;