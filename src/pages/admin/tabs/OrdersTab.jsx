// src/pages/admin/tabs/OrdersTab.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { adminService, orderService } from '../../../services/api';
import { staffService } from '../../../services/api';
import { toast } from 'react-toastify';
import RejectOrderModal from '../components/modals/RejectOrderModal';
import CashPaymentModal from '../components/modals/CashPaymentModal';
import AssignChefModal from '../components/modals/AssignChefModal';
import AssignDeliveryModal from '../components/modals/AssignDeliveryModal';
import './OrdersTab.css';

const OrdersTab = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [showAssignChefModal, setShowAssignChefModal] = useState(false);
  const [showAssignDeliveryModal, setShowAssignDeliveryModal] = useState(false);
  const [availableChefs, setAvailableChefs] = useState([]);
  const [availableDelivery, setAvailableDelivery] = useState([]);
  const [selectedChefId, setSelectedChefId] = useState('');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!user || user.role !== 'admin') {
      toast.error('Admin access required');
      navigate('/');
      return;
    }
    
    fetchOrders();
    fetchAvailableStaff();
  }, [filter, user, isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('📦 Fetching orders with filter:', filter);
      
      const response = await adminService.getAllOrders(filter);
      console.log('📦 Orders response:', response);
      
      // Handle different response formats
      let ordersData = [];
      if (Array.isArray(response)) {
        ordersData = response;
      } else if (response?.orders && Array.isArray(response.orders)) {
        ordersData = response.orders;
      } else if (response?.data && Array.isArray(response.data)) {
        ordersData = response.data;
      }
      
      console.log('📦 Setting orders:', ordersData.length);
      setOrders(ordersData);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      
      if (error.response?.status === 403) {
        toast.error('Admin access required');
        navigate('/');
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        toast.error('Failed to fetch orders');
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStaff = async () => {
    try {
      const [chefs, delivery] = await Promise.all([
        staffService.getStaffByRole('cook'),
        staffService.getStaffByRole('delivery')
      ]);
      
      setAvailableChefs(chefs.staff || []);
      setAvailableDelivery(delivery.staff || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setAvailableChefs([
        { _id: 'chef1', name: 'Chef Berhanu' },
        { _id: 'chef2', name: 'Chef Tigist' },
        { _id: 'chef3', name: 'Chef Solomon' }
      ]);
      setAvailableDelivery([
        { _id: 'del1', name: 'Abebe Kebede' },
        { _id: 'del2', name: 'Almaz Worku' },
        { _id: 'del3', name: 'Kebede Alemu' }
      ]);
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      await adminService.updateOrderStatus(
        selectedOrder._id, 
        'cancelled', 
        rejectionReason || 'Order rejected by admin'
      );
      toast.success('❌ Order rejected');
      setShowRejectModal(false);
      setSelectedOrder(null);
      setRejectionReason('');
      fetchOrders();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('Failed to reject order');
    }
  };

  const handleAssignChef = async () => {
    if (!selectedOrder || !selectedChefId) {
      toast.error('Please select a chef');
      return;
    }

    try {
      await adminService.assignChef(selectedOrder._id, selectedChefId, assignmentNotes);
      toast.success('Chef assigned successfully');
      setShowAssignChefModal(false);
      setSelectedChefId('');
      setAssignmentNotes('');
      fetchOrders();
      fetchAvailableStaff();
    } catch (error) {
      console.error('Error assigning chef:', error);
      toast.error(error.message || 'Failed to assign chef');
    }
  };

  const handleAssignDelivery = async () => {
    if (!selectedOrder || !selectedDeliveryId) {
      toast.error('Please select a delivery person');
      return;
    }

    try {
      await adminService.assignDelivery(selectedOrder._id, selectedDeliveryId, assignmentNotes);
      toast.success('Delivery person assigned successfully');
      setShowAssignDeliveryModal(false);
      setSelectedDeliveryId('');
      setAssignmentNotes('');
      fetchOrders();
      fetchAvailableStaff();
    } catch (error) {
      console.error('Error assigning delivery:', error);
      toast.error(error.message || 'Failed to assign delivery');
    }
  };

  const processCashPayment = async () => {
    if (!selectedOrder) return;
    
    if (!cashAmount || parseFloat(cashAmount) < selectedOrder.totalAmount) {
      toast.error(`Amount must be at least ETB ${selectedOrder.totalAmount}`);
      return;
    }

    try {
      setProcessingPayment(true);
      await orderService.processCashPayment(selectedOrder._id, parseFloat(cashAmount));
      toast.success('Cash payment processed successfully');
      setShowPaymentModal(false);
      setSelectedOrder(null);
      setCashAmount('');
      fetchOrders();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleQuickAssignChef = async (orderId, chefId) => {
    try {
      await adminService.assignChef(orderId, chefId);
      toast.success('Chef assigned successfully');
      fetchOrders();
      fetchAvailableStaff();
    } catch (error) {
      console.error('Error assigning chef:', error);
      toast.error(error.message || 'Failed to assign chef');
    }
  };

  const handleQuickAssignDelivery = async (orderId, deliveryId) => {
    try {
      await adminService.assignDelivery(orderId, deliveryId);
      toast.success('Delivery person assigned successfully');
      fetchOrders();
      fetchAvailableStaff();
    } catch (error) {
      console.error('Error assigning delivery:', error);
      toast.error(error.message || 'Failed to assign delivery');
    }
  };

  const handleAssignChefClick = (order) => {
    setSelectedOrder(order);
    setSelectedChefId(order.assignedChef?._id || '');
    setAssignmentNotes(order.chefNotes || '');
    setShowAssignChefModal(true);
  };

  const handleAssignDeliveryClick = (order) => {
    setSelectedOrder(order);
    setSelectedDeliveryId(order.assignedDelivery?._id || '');
    setAssignmentNotes(order.deliveryNotes || '');
    setShowAssignDeliveryModal(true);
  };

  const handleCashPaymentClick = (order) => {
    setSelectedOrder(order);
    setCashAmount(order.totalAmount.toString());
    setShowPaymentModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      confirmed: '#3498db',
      preparing: '#9b59b6',
      ready: '#2ecc71',
      delivered: '#27ae60',
      cancelled: '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="orders-tab">
      <h1 className="page-title">Order Management</h1>
      
      <div className="filter-section">
        <div className="filter-buttons">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            All Orders ({orders.length})
          </button>
          <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>
            Pending ({orders.filter(o => o.status === 'pending').length})
          </button>
          <button className={filter === 'confirmed' ? 'active' : ''} onClick={() => setFilter('confirmed')}>
            Confirmed ({orders.filter(o => o.status === 'confirmed').length})
          </button>
          <button className={filter === 'preparing' ? 'active' : ''} onClick={() => setFilter('preparing')}>
            Preparing ({orders.filter(o => o.status === 'preparing').length})
          </button>
          <button className={filter === 'ready' ? 'active' : ''} onClick={() => setFilter('ready')}>
            Ready ({orders.filter(o => o.status === 'ready').length})
          </button>
          <button className={filter === 'delivered' ? 'active' : ''} onClick={() => setFilter('delivered')}>
            Delivered ({orders.filter(o => o.status === 'delivered').length})
          </button>
        </div>
      </div>

      <div className="orders-grid">
        {orders.length > 0 ? (
          orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <div>
                  <h3>Order #{order.orderNumber || order._id?.slice(-6)}</h3>
                  <span className="order-date">{formatDate(order.createdAt)}</span>
                </div>
                <span className="status-badge" style={{backgroundColor: getStatusColor(order.status)}}>
                  {order.status}
                </span>
              </div>
              
              <div className="order-card-body">
                <div className="customer-info">
                  <p><strong>👤 Customer:</strong> {order.customerName || order.customer?.name || 'Guest'}</p>
                  <p><strong>📞 Phone:</strong> {order.customerPhone || order.customer?.phone || 'N/A'}</p>
                  <p><strong>💰 Total:</strong> ETB {order.totalAmount}</p>
                </div>

                <div className="assignment-info">
                  <h4>👨‍🍳 Staff Assignments</h4>
                  <div className="assignment-details">
                    <div className="assignment-row">
                      <div className="assignment-current">
                        <strong>Chef:</strong> {order.assignedChef?.name || 'Not assigned'}
                        {order.assignedAt?.chef && (
                          <span className="assignment-time"> ({formatDate(order.assignedAt.chef)})</span>
                        )}
                      </div>
                      <div className="assignment-select">
                        <select
                          value=""
                          onChange={(e) => e.target.value && handleQuickAssignChef(order._id, e.target.value)}
                          disabled={Boolean(order.assignedChef) || order.status !== 'pending'}
                          className="quick-assign-select"
                        >
                          <option value="">👨‍🍳 Assign Chef</option>
                          {availableChefs.map(chef => (
                            <option key={chef._id} value={chef._id}>{chef.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="assignment-row">
                      <div className="assignment-current">
                        <strong>Delivery:</strong> {order.assignedDelivery?.name || 'Not assigned'}
                        {order.assignedAt?.delivery && (
                          <span className="assignment-time"> ({formatDate(order.assignedAt.delivery)})</span>
                        )}
                      </div>
                      <div className="assignment-select">
                        <select
                          value=""
                          onChange={(e) => e.target.value && handleQuickAssignDelivery(order._id, e.target.value)}
                          disabled={Boolean(order.assignedDelivery) || order.status !== 'ready'}
                          className="quick-assign-select"
                        >
                          <option value="">🚚 Assign Delivery</option>
                          {availableDelivery.map(delivery => (
                            <option key={delivery._id} value={delivery._id}>{delivery.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="order-items">
                  <h4>Items:</h4>
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="order-item">
                      <span>{item.name} x{item.quantity}</span>
                      <span>ETB {item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-card-footer">
                {order.status === 'pending' && (
                  <div className="accept-reject-buttons">
                    <div className="workflow-note">Assign a chef to send this order to the kitchen.</div>
                    <button onClick={() => {
                      setSelectedOrder(order);
                      setShowRejectModal(true);
                    }} className="btn-reject">
                      ✗ Reject Order
                    </button>
                  </div>
                )}

                <div className="status-update-section">
                  <div className="current-status">
                    <span className="status-label">Status:</span>
                    <span className="status-value" style={{color: getStatusColor(order.status)}}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  
                  <p className="workflow-hint">
                    {order.status === 'confirmed' && 'Chef acceptance is next.'}
                    {order.status === 'preparing' && 'Chef is preparing the order.'}
                    {order.status === 'cooking' && 'Chef is cooking the order.'}
                    {order.status === 'ready' && (order.assignedDelivery ? 'Waiting for delivery acceptance.' : 'Assign delivery to continue.')}
                    {order.status === 'out-for-delivery' && 'Delivery is in progress.'}
                    {order.status === 'delivered' && 'Customer delivery completed.'}
                  </p>
                </div>

                <div className="assignment-buttons">
                  <button 
                    className="btn-assign-chef"
                    onClick={() => handleAssignChefClick(order)}
                    disabled={Boolean(order.assignedChef) || order.status !== 'pending'}
                  >
                    {order.assignedChef ? '🔄 Reassign Chef' : '👨‍🍳 Assign Chef'}
                  </button>
                  <button 
                    className="btn-assign-delivery"
                    onClick={() => handleAssignDeliveryClick(order)}
                    disabled={Boolean(order.assignedDelivery) || order.status !== 'ready'}
                  >
                    {order.assignedDelivery ? '🔄 Reassign Delivery' : '🚚 Assign Delivery'}
                  </button>
                </div>

                {order.paymentMethod === 'cash' && order.paymentStatus !== 'completed' && (
                  <button className="btn-cash-payment" onClick={() => handleCashPaymentClick(order)}>
                    💵 Process Cash Payment
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-orders">No orders found</div>
        )}
      </div>

      {/* Modals */}
      <RejectOrderModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedOrder(null);
          setRejectionReason('');
        }}
        order={selectedOrder}
        onReject={handleRejectOrder}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
      />

      <CashPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedOrder(null);
          setCashAmount('');
        }}
        order={selectedOrder}
        cashAmount={cashAmount}
        setCashAmount={setCashAmount}
        onProcessPayment={processCashPayment}
        processing={processingPayment}
      />

      <AssignChefModal
        isOpen={showAssignChefModal}
        onClose={() => {
          setShowAssignChefModal(false);
          setSelectedOrder(null);
          setSelectedChefId('');
          setAssignmentNotes('');
        }}
        order={selectedOrder}
        chefs={availableChefs}
        selectedChefId={selectedChefId}
        setSelectedChefId={setSelectedChefId}
        notes={assignmentNotes}
        setNotes={setAssignmentNotes}
        onAssign={handleAssignChef}
      />

      <AssignDeliveryModal
        isOpen={showAssignDeliveryModal}
        onClose={() => {
          setShowAssignDeliveryModal(false);
          setSelectedOrder(null);
          setSelectedDeliveryId('');
          setAssignmentNotes('');
        }}
        order={selectedOrder}
        deliveryPersons={availableDelivery}
        selectedDeliveryId={selectedDeliveryId}
        setSelectedDeliveryId={setSelectedDeliveryId}
        notes={assignmentNotes}
        setNotes={setAssignmentNotes}
        onAssign={handleAssignDelivery}
      />
    </div>
  );
};

export default OrdersTab;