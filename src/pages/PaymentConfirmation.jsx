import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  FaCheckCircle, FaPrint, FaDownload, FaEnvelope, 
  FaArrowLeft, FaHome, FaShoppingBag, FaClock,
  FaMapMarkerAlt, FaPhone, FaUser, FaCreditCard,
  FaMoneyBill, FaMobile, FaTicketAlt, FaGift
} from 'react-icons/fa';
import { MdRestaurantMenu } from 'react-icons/md';
import { toast } from 'react-toastify';
import { orderService } from '../services/api';
import OrderTracker from '../components/OrderTracker';
import { useSocket } from '../context/SocketContext';
import './PaymentConfirmation.css';

const PaymentConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { connected, registerOrder, onOrderStatusUpdate } = useSocket();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderStatus, setOrderStatus] = useState('pending');
  const [showLotteryModal, setShowLotteryModal] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  // Register order for real-time updates and listen for changes
  useEffect(() => {
    if (order && orderId && connected) {
      registerOrder(orderId);
      console.log('📦 Registered for order updates:', orderId);

      onOrderStatusUpdate((data) => {
        console.log('📢 Real-time order update received:', data);
        
        setOrderStatus(data.status);
        
        if (data.status === 'confirmed') {
          toast.success('✅ Your order has been accepted and is being prepared!');
        } else if (data.status === 'cancelled') {
          toast.error('❌ Your order has been rejected');
          if (data.notes) {
            toast.info(`Reason: ${data.notes}`);
          }
        } else if (data.status === 'preparing') {
          toast.info('👨‍🍳 Your food is now being prepared');
        } else if (data.status === 'cooking') {
          toast.info('👨‍🍳 Your food is being cooked!');
        } else if (data.status === 'ready') {
          toast.success('🍽️ Your order is ready for pickup/delivery!');
        } else if (data.status === 'out-for-delivery') {
          toast.info('🛵 Your order is on the way!');
        } else if (data.status === 'delivered') {
          toast.success('🚚 Your order has been delivered!');
          if (order?.lotteryTicketNumber) {
            toast.info(`🎫 Your lottery ticket ${order.lotteryTicketNumber} is now active!`);
          }
        }
      });
    }
  }, [order, orderId, connected, registerOrder, onOrderStatusUpdate]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrder(orderId);
      const orderData = response.data || response.order || response;
      setOrder(orderData);
      setOrderStatus(orderData.status);
      setError(null);
      
      // Show lottery ticket notification if order is delivered
      if (orderData.status === 'delivered' && orderData.lotteryTicketNumber) {
        setTimeout(() => {
          toast.info(`🎫 You have a lottery ticket! Number: ${orderData.lotteryTicketNumber}`);
        }, 1000);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to load order details');
      toast.error('Could not load order confirmation');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
    const receiptContent = generateReceiptText();
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${order?.orderNumber || orderId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Receipt downloaded');
  };

  const handleEmailReceipt = () => {
    toast.info('Receipt will be sent to your email');
  };

  const generateReceiptText = () => {
    if (!order) return '';
    
    const date = new Date(order.createdAt).toLocaleString();
    const items = order.items.map(item => 
      `${item.name} x${item.quantity} - ETB ${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');
    
    let lotterySection = '';
    if (order.lotteryTicketNumber) {
      lotterySection = `
----------------------------------
🎫 LOTTERY TICKET 🎫
Ticket Number: ${order.lotteryTicketNumber}
Status: ${order.lotteryWon ? 'WINNER! 🏆' : (order.status === 'delivered' ? 'Active' : 'Pending')}
${order.lotteryWon ? 'Congratulations! You have won a prize! Please contact us to claim.' : 'Keep this ticket for monthly giveaways!'}
----------------------------------`;
    }
    
    return `
==================================
      SEWRICA CAFE & RESTAURANT
==================================
Order Receipt

Order #: ${order.orderNumber || orderId}
Date: ${date}
Status: ${orderStatus}
Payment: ${order.paymentMethod?.toUpperCase()}
Payment Status: ${order.paymentStatus?.toUpperCase()}

----------------------------------
Items:
${items}
----------------------------------

Subtotal: ETB ${order.subtotal?.toFixed(2) || order.totalAmount?.toFixed(2)}
Delivery: FREE
Total: ETB ${order.totalAmount?.toFixed(2)}

Customer: ${order.customerName || order.customer?.name}
Phone: ${order.customerPhone || order.customer?.phone}
Email: ${order.customerEmail || order.customer?.email}
${lotterySection}
Thank you for choosing SEWRICA Cafe!
==================================
    `;
  };

  const getPaymentIcon = (method) => {
    switch(method) {
      case 'cash': return <FaMoneyBill />;
      case 'card': return <FaCreditCard />;
      case 'tele_birr': return <FaMobile />;
      default: return <FaCreditCard />;
    }
  };

  if (loading) {
    return (
      <div className="confirmation-page loading">
        <div className="loader-container">
          <div className="loader"></div>
          <p>Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="confirmation-page error">
        <div className="error-container">
          <h2>Oops! Something went wrong</h2>
          <p>{error || 'Order not found'}</p>
          <div className="error-actions">
            <Link to="/" className="btn-home">
              <FaHome /> Go Home
            </Link>
            <Link to="/menu" className="btn-menu">
              <MdRestaurantMenu /> Browse Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isEligibleForLottery = order.status === 'delivered' && order.paymentStatus === 'completed';

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon">
            <FaCheckCircle />
          </div>
          <h1>Order Placed Successfully!</h1>
          <p>Your order has been received and is being processed</p>
        </div>

        {/* Order Tracker Component - Shows real-time status */}
        <OrderTracker 
          orderId={orderId} 
          initialStatus={orderStatus}
        />

        {/* Order Info Bar */}
        <div className="order-info-bar">
          <div className="info-item">
            <span className="label">Order Number</span>
            <span className="value">#{order.orderNumber || orderId.slice(-8)}</span>
          </div>
          <div className="info-item">
            <span className="label">Date</span>
            <span className="value">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="info-item">
            <span className="label">Status</span>
            <span className={`value status-${orderStatus}`}>
              {orderStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Lottery Ticket Section */}
        {order.lotteryTicketNumber && (
          <div className={`lottery-ticket-section ${order.lotteryWon ? 'winner' : ''} ${isEligibleForLottery ? 'eligible' : ''}`}>
            <div className="lottery-banner" onClick={() => setShowLotteryModal(true)}>
              <div className="lottery-icon">
                {order.lotteryWon ? <FaGift /> : <FaTicketAlt />}
              </div>
              <div className="lottery-info">
                <h3>
                  {order.lotteryWon ? '🏆 YOU WON! 🏆' : '🎫 Your Lottery Ticket'}
                </h3>
                <p className="ticket-number">Ticket #: {order.lotteryTicketNumber}</p>
                <p className="lottery-message">
                  {order.lotteryWon 
                    ? 'Congratulations! You are a winner! Please contact us to claim your prize.'
                    : isEligibleForLottery 
                      ? 'Your ticket is active for the monthly giveaway! Winners get special prizes!'
                      : 'Your ticket will be activated once your order is delivered and paid.'}
                </p>
                {order.lotteryWon && (
                  <button className="claim-prize-btn" onClick={() => toast.info('Please contact Sewrica Cafe to claim your prize!')}>
                    Claim Prize →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Connection Status */}
        {!connected && (
          <div className="connection-warning">
            <p>⚠️ Real-time updates disconnected. Reconnecting...</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="confirmation-grid">
          {/* Left Column - Order Details */}
          <div className="order-details">
            <h2>Order Summary</h2>
            
            <div className="items-list">
              {order.items?.map((item, index) => (
                <div key={index} className="item-row">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">x{item.quantity}</span>
                  </div>
                  <span className="item-price">
                    ETB {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="price-breakdown">
              <div className="price-row">
                <span>Subtotal</span>
                <span>ETB {order.subtotal?.toFixed(2) || order.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="price-row">
                <span>Delivery Fee</span>
                <span className="free">FREE</span>
              </div>
              <div className="price-row total">
                <span>Total</span>
                <span>ETB {order.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="payment-details">
              <h3>Payment Details</h3>
              <div className="payment-row">
                <span className="payment-method">
                  {getPaymentIcon(order.paymentMethod)}
                  <span className="method-name">
                    {order.paymentMethod === 'cash' ? 'Cash on Delivery' :
                     order.paymentMethod === 'card' ? 'Card Payment' :
                     order.paymentMethod === 'tele_birr' ? 'Tele Birr' : 'Bank Transfer'}
                  </span>
                </span>
                <span className={`payment-status ${order.paymentStatus}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button onClick={handlePrint} className="btn-print">
                <FaPrint /> Print Receipt
              </button>
              <button onClick={handleDownloadReceipt} className="btn-download">
                <FaDownload /> Download
              </button>
              <button onClick={handleEmailReceipt} className="btn-email">
                <FaEnvelope /> Email
              </button>
            </div>
          </div>

          {/* Right Column - Customer & Delivery Info */}
          <div className="customer-info">
            <h2>Delivery Information</h2>
            
            <div className="info-card">
              <div className="info-row">
                <FaUser className="info-icon" />
                <div>
                  <span className="info-label">Customer</span>
                  <span className="info-value">{order.customerName || order.customer?.name}</span>
                </div>
              </div>
              
              <div className="info-row">
                <FaPhone className="info-icon" />
                <div>
                  <span className="info-label">Phone</span>
                  <span className="info-value">{order.customerPhone || order.customer?.phone}</span>
                </div>
              </div>
              
              <div className="info-row">
                <FaEnvelope className="info-icon" />
                <div>
                  <span className="info-label">Email</span>
                  <span className="info-value">{order.customerEmail || order.customer?.email}</span>
                </div>
              </div>
              
              <div className="info-row">
                <FaMapMarkerAlt className="info-icon" />
                <div>
                  <span className="info-label">Delivery Address</span>
                  <span className="info-value">
                    {order.deliveryAddress || 
                     `${order.area || 'Megenagna'}, ${order.building || 'Metebaber Building'}, ${order.floor || '2nd Floor'}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {order.specialRequests && (
              <div className="special-instructions">
                <h3>Special Instructions</h3>
                <p>{order.specialRequests}</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bottom-navigation">
          <Link to="/" className="nav-link">
            <FaHome /> Home
          </Link>
          <Link to="/menu" className="nav-link">
            <MdRestaurantMenu /> Menu
          </Link>
          <Link to="/profile" className="nav-link">
            <FaUser /> My Orders
          </Link>
          <button onClick={() => navigate(-1)} className="nav-link back">
            <FaArrowLeft /> Back
          </button>
        </div>

        {/* Thank You Message */}
        <div className="thank-you">
          <p>Thank you for choosing SEWRICA Cafe!</p>
          <p className="small">We hope you enjoy your meal</p>
        </div>
      </div>

      {/* Lottery Ticket Modal */}
      {showLotteryModal && order.lotteryTicketNumber && (
        <div className="modal-overlay" onClick={() => setShowLotteryModal(false)}>
          <div className="modal-content lottery-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎫 Your Lottery Ticket</h2>
              <button className="modal-close-btn" onClick={() => setShowLotteryModal(false)}>×</button>
            </div>
            <div className="lottery-modal-content">
              <div className={`lottery-ticket ${order.lotteryWon ? 'winner-ticket' : ''}`}>
                <div className="ticket-header">
                  <span className="ticket-icon">🎫</span>
                  <span className="ticket-title">SEWRICA CAFE</span>
                  <span className="ticket-icon">🎲</span>
                </div>
                <div className="ticket-number-large">
                  {order.lotteryTicketNumber}
                </div>
                <div className="ticket-details">
                  <p><strong>Order #:</strong> {order.orderNumber}</p>
                  <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                  <p><strong>Amount:</strong> ETB {order.totalAmount}</p>
                  <p><strong>Customer:</strong> {order.customerName}</p>
                </div>
                <div className="ticket-status">
                  {order.lotteryWon ? (
                    <span className="winner-badge">🏆 WINNER! 🏆</span>
                  ) : isEligibleForLottery ? (
                    <span className="active-badge">✅ Active for Monthly Draw</span>
                  ) : (
                    <span className="pending-badge">⏳ Will be active after delivery</span>
                  )}
                </div>
                <div className="ticket-footer">
                  <p>Keep this ticket for monthly giveaways!</p>
                  <p className="small-text">Winners announced at the end of each month</p>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-print-ticket" onClick={() => window.print()}>
                🖨️ Print Ticket
              </button>
              <button className="btn-close" onClick={() => setShowLotteryModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentConfirmation;