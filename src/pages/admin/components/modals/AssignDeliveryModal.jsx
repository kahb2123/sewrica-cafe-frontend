// src/pages/admin/components/modals/AssignDeliveryModal.jsx
import React from 'react';
import './Modals.css';

const AssignDeliveryModal = ({ 
  isOpen, 
  onClose, 
  order, 
  deliveryPersons, 
  selectedDeliveryId, 
  setSelectedDeliveryId, 
  notes, 
  setNotes, 
  onAssign 
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content assign-modal" onClick={e => e.stopPropagation()}>
        <h2>🚚 Assign Delivery Person</h2>
        <p>Order #{order.orderNumber || order._id.slice(-6)}</p>
        
        <div className="form-group">
          <label>Select Delivery Person:</label>
          <select
            value={selectedDeliveryId}
            onChange={(e) => setSelectedDeliveryId(e.target.value)}
            className="form-control"
          >
            <option value="">Choose a delivery person...</option>
            {deliveryPersons.map(person => (
              <option key={person._id} value={person._id}>
                {person.name} {order.assignedDelivery?._id === person._id ? '(Current)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Notes (optional):</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Delivery instructions..."
            rows="3"
            className="form-control"
          />
        </div>

        <div className="modal-actions">
          <button className="btn-confirm" onClick={onAssign}>
            Assign Delivery
          </button>
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignDeliveryModal;