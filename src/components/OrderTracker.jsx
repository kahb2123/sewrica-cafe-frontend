import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/useLanguage';
import { FaCheckCircle, FaTimesCircle, FaClock, FaSpinner } from 'react-icons/fa';
import './OrderTracker.css';

const OrderTracker = ({ orderId, initialStatus = 'pending' }) => {
  const { registerOrder, onOrderStatusUpdate, connected } = useSocket();
  const { t } = useLanguage();
  const [orderStatus, setOrderStatus] = useState(initialStatus);
  const [statusMessage, setStatusMessage] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  function playNotificationSound(type) {
    console.log(`🔔 Order ${type} notification`);
  }

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
          setRejectionReason(data.notes || t('No reason provided'));
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
  }, [orderId, connected, registerOrder, onOrderStatusUpdate, t]);

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
      case 'confirmed': return t('Order Accepted');
      case 'cancelled': return t('Order Rejected');
      case 'preparing': return t('Preparing Your Food');
      case 'ready': return t('Ready for Pickup/Delivery');
      case 'delivered': return t('Delivered');
      default: return t('Order Pending');
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
              <span>{t('Order Placed')}</span>
              <small>{t('Your order has been received')}</small>
            </div>
          </div>

          <div className={`timeline-step ${orderStatus === 'confirmed' || orderStatus === 'preparing' || orderStatus === 'ready' || orderStatus === 'delivered' ? 'completed' : ''} ${orderStatus === 'cancelled' ? 'cancelled' : ''}`}>
            <div className="step-dot"></div>
            <div className="step-label">
              <span>{t(orderStatus === 'cancelled' ? 'Order Rejected' : 'Order Confirmed')}</span>
              <small>
                {orderStatus === 'cancelled' 
                  ? t('Restaurant could not accept your order')
                  : t('Restaurant has accepted your order')}
              </small>
            </div>
          </div>

          {orderStatus !== 'cancelled' && (
            <>
              <div className={`timeline-step ${orderStatus === 'preparing' || orderStatus === 'ready' || orderStatus === 'delivered' ? 'completed' : ''}`}>
                <div className="step-dot"></div>
                <div className="step-label">
                  <span>{t('Preparing')}</span>
                  <small>{t('Your food is being prepared')}</small>
                </div>
              </div>

              <div className={`timeline-step ${orderStatus === 'ready' || orderStatus === 'delivered' ? 'completed' : ''}`}>
                <div className="step-dot"></div>
                <div className="step-label">
                  <span>{t('Ready')}</span>
                  <small>{t('Your order is ready')}</small>
                </div>
              </div>

              <div className={`timeline-step ${orderStatus === 'delivered' ? 'completed' : ''}`}>
                <div className="step-dot"></div>
                <div className="step-label">
                  <span>Delivered</span>
                  <small>{t('Enjoy your meal!')}</small>
                </div>
              </div>
            </>
          )}
        </div>

        {!connected && (
          <div className="connection-warning">
            <p>⚠️ {t('Reconnecting to order updates...')}</p>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="rejection-modal">
          <div className="modal-content">
            <FaTimesCircle className="rejection-icon" />
            <h2>{t('Order Rejected')}</h2>
            <p className="reason">{rejectionReason}</p>
            <p className="help-text">
              {t('Your order could not be processed at this time. Please try again or contact us for assistance.')}
            </p>
            <button 
              className="close-btn"
              onClick={() => setShowRejectionModal(false)}
            >
              {t('Close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderTracker;