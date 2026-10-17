// src/pages/admin/tabs/MenuTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext'; // Import useAuth
import { useLanguage } from '../../../context/useLanguage';
import { menuService, UPLOADS_URL } from '../../../services/api';
import { toast } from 'react-toastify';
import './MenuTab.css';

const MenuTab = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth(); // Use auth context
  const { t } = useLanguage();
  const [menuItems, setMenuItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
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

  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📦 Fetching menu items...');
      const response = await menuService.getAllItems();
      console.log('📦 Menu items response:', response);
      
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
        toast.error(t('Session expired. Please login again'));
        navigate('/login');
      } else {
        toast.error(t('Failed to load menu items'));
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, t]);

  // Check authentication using auth context
  useEffect(() => {
    console.log('🔐 MenuTab - isAuthenticated:', isAuthenticated);
    console.log('🔐 MenuTab - User:', user);
    console.log('🔐 MenuTab - Auth loading:', authLoading);
    
    if (authLoading) {
      return; // Wait for auth to initialize
    }
    
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login');
      toast.error(t('Please login first'));
      navigate('/login');
      return;
    }

    if (!user || user.role !== 'admin') {
      console.log('❌ Not admin, role:', user?.role);
      toast.error(t('Admin access required'));
      navigate('/');
      return;
    }

    console.log('✅ Admin access granted for MenuTab');
    fetchMenuItems();
  }, [isAuthenticated, user, authLoading, navigate, t, fetchMenuItems]);

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
        toast.error(t('Image size should be less than 5MB'));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error(t('Please upload an image file'));
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
      toast.error(t('Please fill in all required fields'));
      return;
    }

    if (!editingItem && !imageFile) {
      toast.error(t('Please select an image'));
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
        toast.success(t('Menu item updated successfully'));
      } else {
        await menuService.createItem(payload, imageFile);
        toast.success(t('Menu item created successfully'));
      }
      
      setShowForm(false);
      resetForm();
      fetchMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error(error.response?.data?.message || t('Failed to save menu item'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('Are you sure you want to delete this item?'))) {
      try {
        await menuService.deleteItem(id);
        toast.success(t('Menu item deleted successfully'));
        fetchMenuItems();
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error(t('Failed to delete menu item'));
      }
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await menuService.toggleAvailability(id);
      toast.success(t('Item availability toggled'));
      fetchMenuItems();
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error(t('Failed to toggle availability'));
    }
  };

  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith('http')) return image;
    if (image === 'default-food.jpg') return null;
    return `${UPLOADS_URL}/${image}`;
  };

  const translateCategory = (category) => {
    const label = String(category || '')
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return t(label);
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
      'soft-drinks': '🥤',
      'hot-drinks': '☕',
      'desserts': '🍰',
      'fetira': '🥙'
    };
    return emojis[category] || '🍽️';
  };

  const filteredMenuItems = menuItems.filter(item => {
    const searchableText = [item.name, item.nameAm, item.description, item.category]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(activeSearch.toLowerCase());
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm.trim());
  };

  const handleModalOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowForm(false);
      resetForm();
    }
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t('Checking authentication...')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t('Loading menu items...')}</p>
      </div>
    );
  }

  // Don't render if not admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="menu-tab">
      <div className="tab-header">
        <div>
          <p className="eyebrow">{t('Catalog administration')}</p>
          <h1 className="page-title">{t('Menu Management')}</h1>
          <p className="page-subtitle">{t('Manage your dishes, pricing, availability, and categories.')}</p>
        </div>
        <button className="btn-primary" onClick={() => {
          resetForm();
          setShowForm(true);
        }}>
          <span aria-hidden="true">+</span> {t('Add New Item')}
        </button>
      </div>

      <div className="menu-toolbar">
        <form className="menu-search" onSubmit={handleSearch} role="search">
          <label htmlFor="menu-search-input">{t('Search menu')}</label>
          <div className="search-input-wrap">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              id="menu-search-input"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('Search by name, description, or category')}
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search"
                onClick={() => {
                  setSearchTerm('');
                  setActiveSearch('');
                }}
                aria-label={t('Clear search')}
              >
                ×
              </button>
            )}
          </div>
          <button className="search-button" type="submit">{t('Search')}</button>
        </form>
        <span className="menu-count">
          {activeSearch ? `${filteredMenuItems.length} ${t(filteredMenuItems.length === 1 ? 'result' : 'results')}` : `${menuItems.length} ${t('items')}`}
        </span>
      </div>

      {showForm && (
        <div className="modal-overlay" onMouseDown={handleModalOverlayClick}>
          <div className="modal-content menu-form-modal">
            <h2>{t(editingItem ? 'Edit Menu Item' : 'Add New Menu Item')}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('Item Name (English) *')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder={t('e.g., Cheese Burger')}
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
                <label>{t('Description (English) *')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  rows="3"
                  placeholder={t('Describe the dish in English...')}
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
                  <label>{t('Price (ETB) *')}</label>
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
                  <label>{t('Category')} *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="">{t('Select Category')}</option>
                    <option value="burgers">{t('Burgers')}</option>
                    <option value="sandwiches">{t('Sandwiches')}</option>
                    <option value="pizza">{t('Pizza')}</option>
                    <option value="traditional">{t('Traditional Ethiopian')}</option>
                    <option value="fastfood">{t('Fast Food')}</option>
                    <option value="wraps">{t('Wraps')}</option>
                    <option value="fetira">{t('Fetira')}</option>
                    <option value="beverages">{t('Beverages')}</option>
                    <option value="soft-drinks">{t('Soft Drinks')}</option>
                    <option value="hot-drinks">{t('Hot Drinks')}</option>
                    <option value="desserts">{t('Desserts')}</option>
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
                  🌱 {t('Vegetarian')}
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.spicy}
                    onChange={(e) => setFormData({...formData, spicy: e.target.checked})}
                  />
                  🌶️ {t('Spicy')}
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.signature}
                    onChange={(e) => setFormData({...formData, signature: e.target.checked})}
                  />
                  ⭐ {t('Signature Dish')}
                </label>
              </div>

              <div className="form-group">
                <label>{t('Image Upload')} {!editingItem && '*'}</label>
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
                      alt={t('Preview')}
                    />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-save" disabled={isSubmitting}>
                  {isSubmitting ? t('Saving...') : (editingItem ? t('Update') : t('Create'))}
                </button>
                <button type="button" className="btn-cancel" onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}>
                  {t('Cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!menuItems.length ? (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <h3>{t('No Menu Items Yet')}</h3>
          <p>{t('Get started by adding your first menu item')}</p>
          <button className="btn-primary" onClick={() => {
            resetForm();
            setShowForm(true);
          }}>
            + {t('Add Your First Item')}
          </button>
        </div>
      ) : !filteredMenuItems.length ? (
        <div className="empty-state search-empty-state">
          <div className="empty-icon">⌕</div>
          <h3>{t('No matching menu items')}</h3>
          <p>{t('Try a different name, description, or category.')}</p>
          <button className="btn-secondary" onClick={() => {
            setSearchTerm('');
            setActiveSearch('');
          }}>
            {t('Clear Search')}
          </button>
        </div>
      ) : (
        <div className="menu-items-grid">
          {filteredMenuItems.map(item => (
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
                {item.nameAm && <p className="amharic-name">{t('Amharic:')} {item.nameAm}</p>}
                <p className="description">{item.description}</p>
                
                <div className="menu-tags">
                  {item.isVegetarian && <span className="tag vegetarian">🌱 {t('Vegetarian')}</span>}
                  {item.isSpicy && <span className="tag spicy">🌶️ {t('Spicy')}</span>}
                  {item.isSignature && <span className="tag signature">⭐ {t('Signature')}</span>}
                </div>

                <div className="menu-item-footer">
                  <span className="price">{item.price} ETB</span>
                  <span className="category-badge">{translateCategory(item.category)}</span>
                </div>

                <div className="availability-badge">
                  <span className={item.isAvailable ? 'in-stock' : 'out-of-stock'}>
                    {t(item.isAvailable ? 'In Stock' : 'Out of Stock')}
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
                    {t('Edit')}
                  </button>
                  <button 
                    className={`btn-toggle ${item.isAvailable ? 'available' : 'unavailable'}`}
                    onClick={() => handleToggleAvailability(item._id)}
                  >
                    {t(item.isAvailable ? 'Set Unavailable' : 'Set Available')}
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(item._id)}>
                    {t('Delete')}
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