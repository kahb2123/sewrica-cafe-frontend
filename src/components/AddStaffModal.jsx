import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './AddStaffModal.css';

// Get the API base URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || 'https://sewrica-cafe-backend.onrender.com/api';

const AddStaffModal = ({ isOpen, onClose, onStaffAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'cook'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Validate phone number (Ethiopian format - simple check)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('You must be logged in as admin');
        return;
      }

      console.log('Sending request to:', `${API_URL}/admin/staff`);
      console.log('Request payload:', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role
      });

      const response = await fetch(`${API_URL}/admin/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role
        })
      });

      // Check if response is OK before parsing JSON
      let data = {};
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      }
      
      if (response.ok) {
        toast.success(`${formData.role} added successfully!`);
        
        // Call the callback to refresh staff list
        if (onStaffAdded) {
          onStaffAdded();
        }
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          role: 'cook'
        });
        
        // Close modal
        onClose();
      } else {
        // Handle error response
        const errorMessage = data.message || data.error || `Failed to add ${formData.role}`;
        toast.error(errorMessage);
        console.error('Server error:', data);
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      toast.error('Network error - please check your connection and try again');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-staff-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Staff Member</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter full name"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter email address"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="0912345678"
              pattern="[0-9]{10}"
              title="Please enter a valid 10-digit phone number"
              disabled={loading}
            />
            <small className="field-note">Enter 10-digit phone number (e.g., 0912345678)</small>
          </div>

          <div className="form-group">
            <label>Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="cook">👨‍🍳 Chef / Cook</option>
              <option value="delivery">🚚 Delivery Person</option>
              <option value="cashier">💰 Cashier</option>
              <option value="admin">👑 Admin</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Minimum 6 characters"
                minLength="6"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Re-enter password"
                minLength="6"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group password-requirements">
            <p>Password requirements:</p>
            <ul>
              <li className={formData.password.length >= 6 ? 'valid' : ''}>
                ✓ At least 6 characters
              </li>
              <li className={formData.password === formData.confirmPassword && formData.password !== '' ? 'valid' : ''}>
                ✓ Passwords match
              </li>
            </ul>
          </div>

          <div className="modal-actions">
            <button 
              type="submit" 
              className="btn-save"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Adding...
                </>
              ) : (
                'Add Staff Member'
              )}
            </button>
            <button 
              type="button" 
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStaffModal;