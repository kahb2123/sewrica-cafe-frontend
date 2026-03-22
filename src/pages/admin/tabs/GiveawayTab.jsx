// src/pages/admin/tabs/GiveawayTab.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import './GiveawayTab.css';

const GiveawayTab = () => {
  const { user } = useAuth();
  const [giveaways, setGiveaways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGiveaway, setEditingGiveaway] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prize: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchGiveaways();
  }, []);

  const fetchGiveaways = async () => {
    try {
      setLoading(true);
      const response = await api.get('/giveaway/admin/all');
      setGiveaways(response.data.giveaways);
    } catch (error) {
      console.error('Error fetching giveaways:', error);
      toast.error('Failed to fetch giveaways');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // In GiveawayTab.jsx, ensure the form submission is correct:

const handleSubmit = async (e) => {
  e.preventDefault();
  
  const formDataToSend = new FormData();
  formDataToSend.append('title', formData.title);
  formDataToSend.append('description', formData.description);
  formDataToSend.append('prize', formData.prize);
  formDataToSend.append('startDate', formData.startDate);
  formDataToSend.append('endDate', formData.endDate);
  
  // IMPORTANT: The field name must be 'image' (matches upload.single('image'))
  if (imageFile) {
    formDataToSend.append('image', imageFile);
  }
  
  try {
    if (editingGiveaway) {
      await api.put(`/giveaway/admin/${editingGiveaway._id}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Giveaway updated successfully');
    } else {
      await api.post('/giveaway/admin/create', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Giveaway created successfully');
    }
    setShowForm(false);
    setEditingGiveaway(null);
    resetForm();
    fetchGiveaways();
  } catch (error) {
    console.error('Error saving giveaway:', error);
    toast.error(error.response?.data?.message || 'Failed to save giveaway');
  }
};

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this giveaway?')) {
      try {
        await api.delete(`/giveaway/admin/${id}`);
        toast.success('Giveaway deleted successfully');
        fetchGiveaways();
      } catch (error) {
        console.error('Error deleting giveaway:', error);
        toast.error('Failed to delete giveaway');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      prize: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setImageFile(null);
    setImagePreview('');
  };

  const editGiveaway = (giveaway) => {
    setEditingGiveaway(giveaway);
    setFormData({
      title: giveaway.title,
      description: giveaway.description,
      prize: giveaway.prize,
      startDate: new Date(giveaway.startDate).toISOString().split('T')[0],
      endDate: new Date(giveaway.endDate).toISOString().split('T')[0]
    });
    setImagePreview(giveaway.imageUrl);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading giveaways...</p>
      </div>
    );
  }

  return (
    <div className="giveaway-tab">
      <div className="tab-header">
        <h1 className="page-title">🎁 Giveaway Management</h1>
        <button className="btn-primary" onClick={() => {
          resetForm();
          setEditingGiveaway(null);
          setShowForm(true);
        }}>
          + Create New Giveaway
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content giveaway-form" onClick={e => e.stopPropagation()}>
            <h2>{editingGiveaway ? 'Edit Giveaway' : 'Create New Giveaway'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  placeholder="e.g., Monthly Lucky Draw"
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  rows="3"
                  placeholder="Describe the giveaway and how to participate..."
                />
              </div>

              <div className="form-group">
                <label>Prize *</label>
                <input
                  type="text"
                  value={formData.prize}
                  onChange={(e) => setFormData({...formData, prize: e.target.value})}
                  required
                  placeholder="e.g., Free Coffee for a Month, Gift Card, etc."
                />
              </div>

              <div className="form-group">
                <label>Giveaway Image *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required={!editingGiveaway}
                  className="file-input"
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button 
                      type="button"
                      className="remove-image"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
                <small className="field-note">Upload a promotional image (JPG, PNG, GIF, max 5MB)</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-save">
                  {editingGiveaway ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="giveaways-grid">
        {giveaways.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎁</div>
            <h3>No Giveaways Yet</h3>
            <p>Create your first giveaway to engage customers!</p>
          </div>
        ) : (
          giveaways.map(giveaway => (
            <div key={giveaway._id} className="giveaway-card">
              {giveaway.imageUrl && (
                <div className="giveaway-card-image">
                  <img src={giveaway.imageUrl} alt={giveaway.title} />
                </div>
              )}
              <div className="giveaway-card-content">
                <h3>{giveaway.title}</h3>
                <p>{giveaway.description}</p>
                <div className="giveaway-prize-badge">🏆 {giveaway.prize}</div>
                <div className="giveaway-dates">
                  <span>📅 {new Date(giveaway.startDate).toLocaleDateString()} - {new Date(giveaway.endDate).toLocaleDateString()}</span>
                </div>
                <div className="giveaway-status">
                  {new Date(giveaway.endDate) > new Date() ? (
                    <span className="status-active">Active</span>
                  ) : (
                    <span className="status-ended">Ended</span>
                  )}
                </div>
                <div className="giveaway-actions">
                  <button className="btn-edit" onClick={() => editGiveaway(giveaway)}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(giveaway._id)}>Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GiveawayTab;