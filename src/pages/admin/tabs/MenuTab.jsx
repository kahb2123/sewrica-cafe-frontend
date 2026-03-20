// src/pages/admin/tabs/MenuTab.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuService, UPLOADS_URL } from '../../../services/api';
import { toast } from 'react-toastify';
import './MenuTab.css';

const MenuTab = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    nameAm: '',
    description: '',
    fullDescription: '',
    price: '',
    category: '',
    image: '',
    vegetarian: false,
    spicy: false,
    signature: false,
    available: true
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') {
        toast.error('Admin access required');
        navigate('/');
        return;
      }
      fetchMenuItems();
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/login');
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await menuService.getAllItems();
      
      let items = [];
      if (response && response.success && response.data) {
        items = response.data;
      } else if (Array.isArray(response)) {
        items = response;
      }

      const mappedItems = items.map(item => ({
        ...item,
        vegetarian: item.isVegetarian || false,
        spicy: item.isSpicy || false,
        signature: item.isSignature || false,
        isAvailable: item.isAvailable !== undefined ? item.isAvailable : true
      }));
      
      setMenuItems(mappedItems);
    } catch (error) {
      console.error('Error fetching menu:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        toast.error('Failed to load menu items');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({ 
      name: '', 
      nameAm: '',
      description: '', 
      fullDescription: '',
      price: '', 
      category: 'burgers', 
      image: '', 
      vegetarian: false, 
      spicy: false, 
      signature: false, 
      available: true 
    });
    setImageFile(null);
    setImagePreview('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.price || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!editingItem && !imageFile) {
      toast.error('Please select an image');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        nameAm: formData.nameAm || formData.name,
        description: formData.description,
        fullDescription: formData.fullDescription || formData.description,
        price: Number(formData.price),
        category: formData.category,
        isVegetarian: formData.vegetarian,
        isSpicy: formData.spicy,
        isSignature: formData.signature,
        isAvailable: formData.available
      };

      if (editingItem) {
        if (imageFile) {
          await menuService.updateItem(editingItem._id, payload, imageFile);
        } else {
          await menuService.updateItem(editingItem._id, payload);
        }
        toast.success('Menu item updated successfully');
      } else {
        await menuService.createItem(payload, imageFile);
        toast.success('Menu item created successfully');
      }
      
      setShowForm(false);
      resetForm();
      fetchMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error(error.response?.data?.message || 'Failed to save menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await menuService.deleteItem(id);
        toast.success('Menu item deleted successfully');
        fetchMenuItems();
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Failed to delete menu item');
      }
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await menuService.toggleAvailability(id);
      toast.success('Item availability toggled');
      fetchMenuItems();
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to toggle availability');
    }
  };

  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith('http')) return image;
    if (image === 'default-food.jpg') return null;
    return `${UPLOADS_URL}/${image}`;
  };

  const getEmojiForCategory = (category) => {
    const emojis = {
      'burgers': '🍔',
      'sandwiches': '🥪',
      'pizza': '🍕',
      'wraps': '🌯',
      'traditional': '🍛',
      'fastfood': '🍟',
      'beverages': '☕',
      'desserts': '🍰',
      'fetira': '🥙'
    };
    return emojis[category] || '🍽️';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading menu items...</p>
      </div>
    );
  }

  return (
    <div className="menu-tab">
      <div className="tab-header">
        <h1 className="page-title">Menu Management</h1>
        <button className="btn-primary" onClick={() => {
          resetForm();
          setShowForm(true);
        }}>
          + Add New Item
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content menu-form-modal">
            <h2>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Item Name (English) *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="e.g., Cheese Burger"
                />
              </div>
              
              <div className="form-group">
                <label>ስም (አማርኛ)</label>
                <input
                  type="text"
                  value={formData.nameAm}
                  onChange={(e) => setFormData({...formData, nameAm: e.target.value})}
                  placeholder="ለምሳሌ፡ በርገር አይብ (አማራጭ)"
                />
              </div>

              <div className="form-group">
                <label>Description (English) *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  rows="3"
                  placeholder="Describe the dish in English..."
                />
              </div>

              <div className="form-group">
                <label>ሙሉ መግለጫ (አማርኛ)</label>
                <textarea
                  value={formData.fullDescription}
                  onChange={(e) => setFormData({...formData, fullDescription: e.target.value})}
                  rows="3"
                  placeholder="በአማርኛ ዝርዝር መግለጫ ያስገቡ (አማራጭ)"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (ETB) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                    min="0"
                    step="0.01"
                    placeholder="250"
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="burgers">Burgers</option>
                    <option value="sandwiches">Sandwiches</option>
                    <option value="pizza">Pizza</option>
                    <option value="traditional">Traditional Ethiopian</option>
                    <option value="fastfood">Fast Food</option>
                    <option value="wraps">Wraps</option>
                    <option value="fetira">Fetira</option>
                    <option value="beverages">Beverages</option>
                    <option value="desserts">Desserts</option>
                  </select>
                </div>
              </div>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.vegetarian}
                    onChange={(e) => setFormData({...formData, vegetarian: e.target.checked})}
                  />
                  🌱 Vegetarian
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.spicy}
                    onChange={(e) => setFormData({...formData, spicy: e.target.checked})}
                  />
                  🌶️ Spicy
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.signature}
                    onChange={(e) => setFormData({...formData, signature: e.target.checked})}
                  />
                  ⭐ Signature Dish
                </label>
              </div>

              <div className="form-group">
                <label>Image Upload {!editingItem && '*'}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required={!editingItem}
                />
                {(imagePreview || (editingItem && editingItem.image)) && (
                  <div className="image-preview">
                    <img 
                      src={imagePreview || getImageUrl(editingItem?.image)} 
                      alt="Preview" 
                    />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-save" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                </button>
                <button type="button" className="btn-cancel" onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!menuItems.length ? (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <h3>No Menu Items Yet</h3>
          <p>Get started by adding your first menu item</p>
          <button className="btn-primary" onClick={() => {
            resetForm();
            setShowForm(true);
          }}>
            + Add Your First Item
          </button>
        </div>
      ) : (
        <div className="menu-items-grid">
          {menuItems.map(item => (
            <div key={item._id} className="menu-item-card">
              <div className="menu-item-image">
                {item.image && item.image !== 'default-food.jpg' ? (
                  <img 
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = `<span class="no-image-emoji">${getEmojiForCategory(item.category)}</span>`;
                    }}
                  />
                ) : (
                  <span className="no-image-emoji">{getEmojiForCategory(item.category)}</span>
                )}
              </div>
              <div className="menu-item-content">
                <h3>{item.name}</h3>
                {item.nameAm && <p className="amharic-name">አማርኛ: {item.nameAm}</p>}
                <p className="description">{item.description}</p>
                
                <div className="menu-tags">
                  {item.isVegetarian && <span className="tag vegetarian">🌱 Veg</span>}
                  {item.isSpicy && <span className="tag spicy">🌶️ Spicy</span>}
                  {item.isSignature && <span className="tag signature">⭐ Signature</span>}
                </div>

                <div className="menu-item-footer">
                  <span className="price">{item.price} ETB</span>
                  <span className="category-badge">{item.category}</span>
                </div>

                <div className="availability-badge">
                  <span className={item.isAvailable ? 'in-stock' : 'out-of-stock'}>
                    {item.isAvailable ? '✓ In Stock' : '✗ Out of Stock'}
                  </span>
                </div>

                <div className="menu-item-actions">
                  <button className="btn-edit" onClick={() => {
                    setEditingItem(item);
                    setFormData({
                      name: item.name || '',
                      nameAm: item.nameAm || '',
                      description: item.description || '',
                      fullDescription: item.fullDescription || '',
                      price: item.price || '',
                      category: item.category || 'burgers',
                      image: item.image || '',
                      vegetarian: item.isVegetarian || false,
                      spicy: item.isSpicy || false,
                      signature: item.isSignature || false,
                      available: item.isAvailable !== undefined ? item.isAvailable : true
                    });
                    setImagePreview(getImageUrl(item.image));
                    setShowForm(true);
                  }}>
                    Edit
                  </button>
                  <button 
                    className={`btn-toggle ${item.isAvailable ? 'available' : 'unavailable'}`}
                    onClick={() => handleToggleAvailability(item._id)}
                  >
                    {item.isAvailable ? 'Set Unavailable' : 'Set Available'}
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(item._id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuTab;