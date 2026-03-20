// src/pages/admin/components/modals/RejectOrderModal.jsx
import React from 'react';
import './Modals.css';

const RejectOrderModal = ({ isOpen, onClose, order, onReject, rejectionReason, setRejectionReason }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content reject-modal" onClick={e => e.stopPropagation()}>
        <h2>Reject Order #{order?.orderNumber || order?._id?.slice(-6)}</h2>
        <p className="warning-text">Are you sure you want to reject this order?</p>
        
        <div className="form-group">
          <label>Reason for rejection (optional):</label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g., Out of stock, Too busy, etc."
            rows="3"
            className="form-control"
          />
        </div>
        
        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">
            Cancel
          </button>
          <button onClick={onReject} className="btn-confirm-reject">
            Yes, Reject Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectOrderModal;