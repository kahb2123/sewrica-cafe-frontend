// src/pages/admin/components/modals/CashPaymentModal.jsx
import React from 'react';
import './Modals.css';

const CashPaymentModal = ({ 
  isOpen, 
  onClose, 
  order, 
  cashAmount, 
  setCashAmount, 
  onProcessPayment, 
  processing 
}) => {
  if (!isOpen || !order) return null;

  const change = parseFloat(cashAmount) - order.totalAmount;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payment-modal" onClick={e => e.stopPropagation()}>
        <h2>Process Cash Payment</h2>
        <p>Order #{order.orderNumber || order._id.slice(-6)}</p>
        <p className="total-amount">Total: ETB {order.totalAmount}</p>
        
        <div className="form-group">
          <label>Amount Received:</label>
          <input
            type="number"
            step="0.01"
            min={order.totalAmount}
            value={cashAmount}
            onChange={(e) => setCashAmount(e.target.value)}
            placeholder="Enter amount received"
            className="cash-input"
          />
        </div>

        {change > 0 && (
          <div className="change-amount">
            Change: ETB {change.toFixed(2)}
          </div>
        )}

        <div className="modal-actions">
          <button 
            className="btn-confirm"
            onClick={onProcessPayment}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Confirm Payment'}
          </button>
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashPaymentModal;