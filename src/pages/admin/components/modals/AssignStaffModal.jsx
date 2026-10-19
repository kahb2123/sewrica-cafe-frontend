// src/pages/admin/components/modals/AssignStaffModal.jsx
import React from 'react';
import './Modals.css';

const AssignStaffModal = ({
  isOpen,
  onClose,
  order,
  chefs,
  deliveryPersons,
  waiters,
  selectedChefId,
  setSelectedChefId,
  selectedDeliveryId,
  setSelectedDeliveryId,
  selectedWaiterId,
  setSelectedWaiterId,
  notes,
  setNotes,
  onAssign,
  assigning = false,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content assign-modal" onClick={(e) => e.stopPropagation()}>
        <h2>👥 Assign Staff</h2>
        <p>Order #{order.orderNumber || order._id.slice(-6)}</p>

        <div className="form-group">
          <label>Chef:</label>
          <select
            value={selectedChefId || ''}
            onChange={(e) => setSelectedChefId(e.target.value)}
            className="form-control"
            disabled={assigning}
          >
            <option value="">-- Select Chef --</option>
            {chefs.map((chef) => (
              <option key={chef._id} value={chef._id}>
                {chef.name} {order.assignedChef?._id === chef._id ? '(Current)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Waiter:</label>
          <select
            value={selectedWaiterId || ''}
            onChange={(e) => setSelectedWaiterId(e.target.value)}
            className="form-control"
            disabled={assigning}
          >
            <option value="">-- Select Waiter --</option>
            {waiters.map((waiter) => (
              <option key={waiter._id} value={waiter._id}>
                {waiter.name} {order.assignedWaiter?._id === waiter._id ? '(Current)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Delivery Person:</label>
          <select
            value={selectedDeliveryId || ''}
            onChange={(e) => setSelectedDeliveryId(e.target.value)}
            className="form-control"
            disabled={assigning}
          >
            <option value="">-- Select Delivery --</option>
            {deliveryPersons.map((person) => (
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
            placeholder="Special instructions..."
            rows="3"
            className="form-control"
            disabled={assigning}
          />
        </div>

        <div className="modal-actions">
          <button
            className="btn-confirm"
            onClick={onAssign}
            disabled={assigning || (!selectedChefId && !selectedDeliveryId && !selectedWaiterId)}
          >
            {assigning ? 'Assigning...' : 'Assign Selected Staff'}
          </button>
          <button className="btn-cancel" onClick={onClose} disabled={assigning}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignStaffModal;
