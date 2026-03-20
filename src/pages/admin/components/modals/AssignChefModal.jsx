// src/pages/admin/components/modals/AssignChefModal.jsx
import React from 'react';
import './Modals.css';

const AssignChefModal = ({ 
  isOpen, 
  onClose, 
  order, 
  chefs, 
  selectedChefId, 
  setSelectedChefId, 
  notes, 
  setNotes, 
  onAssign 
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content assign-modal" onClick={e => e.stopPropagation()}>
        <h2>👨‍🍳 Assign Chef</h2>
        <p>Order #{order.orderNumber || order._id.slice(-6)}</p>
        
        <div className="form-group">
          <label>Select Chef:</label>
          <select
            value={selectedChefId}
            onChange={(e) => setSelectedChefId(e.target.value)}
            className="form-control"
          >
            <option value="">Choose a chef...</option>
            {chefs.map(chef => (
              <option key={chef._id} value={chef._id}>
                {chef.name} {order.assignedChef?._id === chef._id ? '(Current)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Notes (optional):</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special instructions for the chef..."
            rows="3"
            className="form-control"
          />
        </div>

        <div className="modal-actions">
          <button className="btn-confirm" onClick={onAssign}>
            Assign Chef
          </button>
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignChefModal;