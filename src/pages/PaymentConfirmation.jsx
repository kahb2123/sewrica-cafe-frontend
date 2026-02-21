import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  FaCheckCircle, FaPrint, FaDownload, FaEnvelope, 
  FaArrowLeft, FaHome, FaShoppingBag, FaClock,
  FaMapMarkerAlt, FaPhone, FaUser, FaCreditCard,
  FaMoneyBill, FaMobile
} from 'react-icons/fa';
import { MdRestaurantMenu } from 'react-icons/md';
import { toast } from 'react-toastify';
import { orderService } from '../services/api';
import './PaymentConfirmation.css';

const PaymentConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrder(orderId);
      setOrder(response.data || response.order || response);
      setError(null);
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
    // Create receipt content
    const receiptContent = generateReceiptText();
    
    // Create blob and download
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
    // In a real app, this would trigger an email via backend
    toast.info('Receipt will be sent to your email');
    // You can call an API endpoint to send email
    // orderService.sendReceiptEmail(orderId);
  };

  const generateReceiptText = () => {
    if (!order) return '';
    
    const date = new Date(order.createdAt).toLocaleString();
    const items = order.items.map(item => 
      `${item.name} x${item.quantity} - ETB ${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');
    
    return `
==================================
      SEWRICA CAFE & RESTAURANT
==================================
Order Receipt

Order #: ${order.orderNumber || orderId}
Date: ${date}
Payment: ${order.paymentMethod?.toUpperCase()}
Status: ${order.paymentStatus?.toUpperCase()}

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

Thank you for choosing SEWRICA Cafe!
Visit us again at Megenagna, Metebaber Building
Tel: +251 911 234 567
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

  const getEstimatedDeliveryTime = () => {
    const orderTime = new Date(order?.createdAt || Date.now());
    const deliveryTime = new Date(orderTime.getTime() + 45 * 60000); // Add 45 minutes
    return deliveryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon">
            <FaCheckCircle />
          </div>
          <h1>Payment Successful!</h1>
          <p>Your order has been confirmed</p>
        </div>

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
            <span className="label">Est. Delivery</span>
            <span className="value">
              <FaClock /> {getEstimatedDeliveryTime()}
            </span>
          </div>
        </div>

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
                <span>Total Paid</span>
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
              {order.paymentStatus === 'completed' && order.paidAt && (
                <p className="paid-time">
                  Paid at: {new Date(order.paidAt).toLocaleString()}
                </p>
              )}
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
            {order.specialInstructions && (
              <div className="special-instructions">
                <h3>Special Instructions</h3>
                <p>{order.specialInstructions}</p>
              </div>
            )}

            {/* Estimated Timeline */}
            <div className="timeline">
              <h3>Order Timeline</h3>
              <div className="timeline-steps">
                <div className="timeline-step completed">
                  <span className="step-dot"></span>
                  <div>
                    <span className="step-name">Order Placed</span>
                    <span className="step-time">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="timeline-step active">
                  <span className="step-dot"></span>
                  <div>
                    <span className="step-name">Confirmed</span>
                    <span className="step-time">Processing</span>
                  </div>
                </div>
                <div className="timeline-step">
                  <span className="step-dot"></span>
                  <div>
                    <span className="step-name">Prepared</span>
                    <span className="step-time">Pending</span>
                  </div>
                </div>
                <div className="timeline-step">
                  <span className="step-dot"></span>
                  <div>
                    <span className="step-name">Delivered</span>
                    <span className="step-time">Pending</span>
                  </div>
                </div>
              </div>
            </div>
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
    </div>
  );
};

export default PaymentConfirmation;