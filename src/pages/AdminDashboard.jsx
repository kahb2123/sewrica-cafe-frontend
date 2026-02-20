import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adminService, menuService } from '../services/api';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalMenuItems: 0,
    totalUsers: 0,
    todayOrders: 0,
    todayRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return;
      }
      
      try {
        const userData = JSON.parse(userStr);
        if (userData.role !== 'admin') {
          toast.error('Admin access required');
          navigate('/');
        }
      } catch (error) {
        console.error('Error parsing user:', error);
        navigate('/login');
      }
    };
    
    checkAdmin();
  }, [navigate]);

  // Fetch dashboard stats
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
      // Set mock data as fallback
      setStats({
        totalOrders: 156,
        totalRevenue: 45230,
        pendingOrders: 8,
        totalMenuItems: 42,
        totalUsers: 124,
        todayOrders: 12,
        todayRevenue: 3450
      });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} onRefresh={fetchDashboardStats} />;
      case 'orders':
        return <OrdersTab />;
      case 'menu':
        return <MenuTab />;
      case 'reports':
        return <ReportsTab />;
      case 'users':
        return <UsersTab />;
      default:
        return <OverviewTab stats={stats} onRefresh={fetchDashboardStats} />;
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading Dashboard...</p>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Sewrica Cafe</h2>
          <p>Admin Panel</p>
        </div>
        <ul className="sidebar-menu">
          <li className={activeTab === 'overview' ? 'active' : ''} 
              onClick={() => setActiveTab('overview')}>
            <span className="menu-icon">📊</span>
            <span className="menu-text">Overview</span>
          </li>
          <li className={activeTab === 'orders' ? 'active' : ''} 
              onClick={() => setActiveTab('orders')}>
            <span className="menu-icon">📦</span>
            <span className="menu-text">Orders</span>
          </li>
          <li className={activeTab === 'menu' ? 'active' : ''} 
              onClick={() => setActiveTab('menu')}>
            <span className="menu-icon">🍽️</span>
            <span className="menu-text">Menu Items</span>
          </li>
          <li className={activeTab === 'reports' ? 'active' : ''} 
              onClick={() => setActiveTab('reports')}>
            <span className="menu-icon">📈</span>
            <span className="menu-text">Reports</span>
          </li>
          <li className={activeTab === 'users' ? 'active' : ''} 
              onClick={() => setActiveTab('users')}>
            <span className="menu-icon">👥</span>
            <span className="menu-text">Users</span>
          </li>
        </ul>
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.name || 'Admin'}</span>
            <span className="user-role">{user?.role || 'admin'}</span>
          </div>
          <button className="logout-btn" onClick={() => navigate('/')}>
            ← Back to Site
          </button>
        </div>
      </div>
      <div className="admin-content">
        {renderContent()}
      </div>
    </div>
  );
};

// ==================== OVERVIEW TAB ====================
const OverviewTab = ({ stats, onRefresh }) => {
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      const data = await adminService.getRecentOrders();
      setRecentOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      // Mock data
      setRecentOrders([
        { _id: 'ORD001', customer: { name: 'John Doe' }, items: [{ name: 'Burger' }], totalAmount: 450, status: 'pending', createdAt: new Date().toISOString() },
        { _id: 'ORD002', customer: { name: 'Jane Smith' }, items: [{ name: 'Pizza' }], totalAmount: 650, status: 'confirmed', createdAt: new Date().toISOString() },
        { _id: 'ORD003', customer: { name: 'Bob Johnson' }, items: [{ name: 'Pasta' }], totalAmount: 380, status: 'delivered', createdAt: new Date().toISOString() },
        { _id: 'ORD004', customer: { name: 'Alice Brown' }, items: [{ name: 'Salad' }], totalAmount: 220, status: 'preparing', createdAt: new Date().toISOString() },
        { _id: 'ORD005', customer: { name: 'Charlie Wilson' }, items: [{ name: 'Steak' }], totalAmount: 890, status: 'ready', createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="overview-tab">
      <div className="tab-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <button className="btn-refresh" onClick={onRefresh} title="Refresh Data">
          🔄 Refresh
        </button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-details">
            <h3>Total Orders</h3>
            <p className="stat-number">{stats.totalOrders}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-details">
            <h3>Total Revenue</h3>
            <p className="stat-number">{stats.totalRevenue.toLocaleString()} ETB</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-details">
            <h3>Pending Orders</h3>
            <p className="stat-number">{stats.pendingOrders}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🍔</div>
          <div className="stat-details">
            <h3>Menu Items</h3>
            <p className="stat-number">{stats.totalMenuItems}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-details">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-details">
            <h3>Today's Orders</h3>
            <p className="stat-number">{stats.todayOrders}</p>
          </div>
        </div>
      </div>

      <div className="recent-orders-section">
        <h2>Recent Orders</h2>
        {loading ? (
          <div className="table-loading">Loading recent orders...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map(order => (
                    <tr key={order._id}>
                      <td>#{order._id.slice(-6)}</td>
                      <td>{order.customer?.name || 'Guest'}</td>
                      <td>{order.items?.length || 0} items</td>
                      <td>{order.totalAmount} ETB</td>
                      <td>
                        <span className={`status-badge ${order.status}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <button 
                          className="action-btn view-btn"
                          onClick={() => console.log('View order', order._id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">No recent orders</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== ORDERS TAB ====================
const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllOrders(filter);
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Mock data
      setOrders([
        { 
          _id: 'ORD001', 
          customer: { name: 'John Doe', phone: '0912345678' }, 
          items: [
            { name: 'Cheese Burger', quantity: 2, price: 250 },
            { name: 'French Fries', quantity: 1, price: 100 }
          ], 
          totalAmount: 600, 
          status: 'pending',
          paymentMethod: 'Cash',
          createdAt: new Date().toISOString()
        },
        { 
          _id: 'ORD002', 
          customer: { name: 'Jane Smith', phone: '0923456789' }, 
          items: [
            { name: 'Margherita Pizza', quantity: 1, price: 350 },
            { name: 'Coca Cola', quantity: 2, price: 60 }
          ], 
          totalAmount: 470, 
          status: 'confirmed',
          paymentMethod: 'Tele Birr',
          createdAt: new Date().toISOString()
        },
        { 
          _id: 'ORD003', 
          customer: { name: 'Bob Johnson', phone: '0934567890' }, 
          items: [
            { name: 'Pasta Carbonara', quantity: 1, price: 280 },
            { name: 'Garlic Bread', quantity: 1, price: 80 }
          ], 
          totalAmount: 360, 
          status: 'preparing',
          paymentMethod: 'Cash',
          createdAt: new Date().toISOString()
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus, assignedTo = null) => {
    try {
      await adminService.updateOrderStatus(orderId, newStatus, assignedTo);
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div className="orders-tab">
      <h1 className="page-title">Order Management</h1>
      
      <div className="filter-section">
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All Orders ({orders.length})
          </button>
          <button 
            className={filter === 'pending' ? 'active' : ''} 
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={filter === 'confirmed' ? 'active' : ''} 
            onClick={() => setFilter('confirmed')}
          >
            Confirmed
          </button>
          <button 
            className={filter === 'preparing' ? 'active' : ''} 
            onClick={() => setFilter('preparing')}
          >
            Preparing
          </button>
          <button 
            className={filter === 'ready' ? 'active' : ''} 
            onClick={() => setFilter('ready')}
          >
            Ready
          </button>
          <button 
            className={filter === 'delivered' ? 'active' : ''} 
            onClick={() => setFilter('delivered')}
          >
            Delivered
          </button>
        </div>
      </div>

      <div className="orders-grid">
        {orders.length > 0 ? (
          orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <div>
                  <h3>Order #{order._id.slice(-6)}</h3>
                  <span className="order-date">{formatDate(order.createdAt)}</span>
                </div>
                <span className="status-badge" style={{backgroundColor: getStatusColor(order.status)}}>
                  {order.status}
                </span>
              </div>
              
              <div className="order-card-body">
                <div className="customer-info">
                  <p><strong>👤 Customer:</strong> {order.customer?.name || 'Guest'}</p>
                  <p><strong>📞 Phone:</strong> {order.customer?.phone || 'N/A'}</p>
                  <p><strong>💰 Total:</strong> {order.totalAmount} ETB</p>
                  <p><strong>💳 Payment:</strong> {order.paymentMethod}</p>
                </div>
                
                <div className="order-items">
                  <h4>Items:</h4>
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="order-item">
                      <span>{item.name} x{item.quantity}</span>
                      <span>{item.price * item.quantity} ETB</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-card-footer">
                {order.status === 'pending' && (
                  <div className="action-buttons">
                    <button 
                      className="btn-confirm"
                      onClick={() => updateOrderStatus(order._id, 'confirmed')}
                    >
                      ✅ Confirm Order
                    </button>
                    <button 
                      className="btn-cancel"
                      onClick={() => updateOrderStatus(order._id, 'cancelled')}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                )}

                {order.status === 'confirmed' && (
                  <div className="action-buttons">
                    <button 
                      className="btn-chef"
                      onClick={() => updateOrderStatus(order._id, 'preparing')}
                    >
                      👨‍🍳 Send to Kitchen
                    </button>
                    <select 
                      className="assign-select"
                      onChange={(e) => {
                        if (e.target.value) {
                          updateOrderStatus(order._id, 'preparing', e.target.value);
                        }
                      }}
                    >
                      <option value="">Assign Chef...</option>
                      <option value="chef1">Chef Berhanu</option>
                      <option value="chef2">Chef Tigist</option>
                      <option value="chef3">Chef Solomon</option>
                    </select>
                  </div>
                )}

                {order.status === 'preparing' && (
                  <button 
                    className="btn-ready"
                    onClick={() => updateOrderStatus(order._id, 'ready')}
                  >
                    ✅ Mark as Ready
                  </button>
                )}

                {order.status === 'ready' && (
                  <div className="action-buttons">
                    <button 
                      className="btn-delivery"
                      onClick={() => updateOrderStatus(order._id, 'delivered')}
                    >
                      🚚 Mark as Delivered
                    </button>
                    <select 
                      className="assign-select"
                      onChange={(e) => {
                        if (e.target.value) {
                          updateOrderStatus(order._id, 'delivered', e.target.value);
                        }
                      }}
                    >
                      <option value="">Assign Delivery...</option>
                      <option value="delivery1">Abebe</option>
                      <option value="delivery2">Kebede</option>
                      <option value="delivery3">Almaz</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-orders">No orders found</div>
        )}
      </div>
    </div>
  );
};

// ==================== MENU TAB ====================
// ==================== MENU TAB ====================
const MenuTab = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    vegetarian: false,
    spicy: false,
    signature: false,
    available: true
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await menuService.getAllItems();
      console.log('API Response:', response);
      
      // Handle different response formats
      if (Array.isArray(response)) {
        setMenuItems(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setMenuItems(response.data);
      } else if (response && response.success && Array.isArray(response.data)) {
        setMenuItems(response.data);
      } else {
        console.warn('Unexpected data format:', response);
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
      setError(error.message || 'Failed to load menu items');
      setMenuItems([]);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({ 
      name: '', 
      description: '', 
      price: '', 
      category: '', 
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
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await menuService.updateItem(editingItem._id, formData, imageFile);
        toast.success('Menu item updated successfully');
      } else {
        await menuService.createItem(formData, imageFile);
        toast.success('Menu item created successfully');
      }
      setShowForm(false);
      resetForm();
      fetchMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Failed to save menu item');
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

  const handleToggleAvailability = async (id, currentStatus) => {
    try {
      await menuService.toggleAvailability(id);
      toast.success(`Item ${currentStatus ? 'unavailable' : 'available'} now`);
      fetchMenuItems();
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to toggle availability');
    }
  };

  // Helper function to get emoji for category
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

  if (error) {
    return (
      <div className="error-state">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Menu</h3>
        <p>{error}</p>
        <button className="btn-retry" onClick={fetchMenuItems}>
          Try Again
        </button>
      </div>
    );
  }

  const hasItems = Array.isArray(menuItems) && menuItems.length > 0;

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
          <div className="modal-content">
            <h2>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="e.g., Cheese Burger"
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  rows="3"
                  placeholder="Describe the dish..."
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
              
              <div className="form-row checkbox-group">
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.vegetarian}
                      onChange={(e) => setFormData({...formData, vegetarian: e.target.checked})}
                    />
                    🌱 Vegetarian
                  </label>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.spicy}
                      onChange={(e) => setFormData({...formData, spicy: e.target.checked})}
                    />
                    🌶️ Spicy
                  </label>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.signature}
                      onChange={(e) => setFormData({...formData, signature: e.target.checked})}
                    />
                    ⭐ Signature Dish
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Image Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {(imagePreview || formData.image) && (
                  <div className="image-preview">
                    <img 
                      src={imagePreview || formData.image} 
                      alt="Preview" 
                      style={{ 
                        maxWidth: '100px', 
                        maxHeight: '100px',
                        marginTop: '10px',
                        borderRadius: '4px'
                      }} 
                    />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-save">
                  {editingItem ? 'Update' : 'Create'}
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

      {!hasItems ? (
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
            <div key={item._id || Math.random()} className="menu-item-card">
              <div className="menu-item-image">
                {item.image ? (
                  <img 
                    src={item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`} 
                    alt={item.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      // Replace with emoji on error
                      e.target.style.display = 'none';
                      const emojiSpan = document.createElement('span');
                      emojiSpan.style.fontSize = '48px';
                      emojiSpan.textContent = getEmojiForCategory(item.category);
                      e.target.parentNode.appendChild(emojiSpan);
                    }}
                  />
                ) : (
                  <div className="no-image">
                    <span style={{ fontSize: '48px' }}>{getEmojiForCategory(item.category)}</span>
                  </div>
                )}
              </div>
              <div className="menu-item-content">
                <h3>{item.name}</h3>
                <p className="description">{item.description}</p>
                <div className="menu-item-footer">
                  <span className="price">{item.price} ETB</span>
                  <span className="category-badge">{item.category}</span>
                </div>
                <div className="menu-tags">
                  {item.vegetarian && <span className="tag vegetarian">🌱 Veg</span>}
                  {item.spicy && <span className="tag spicy">🌶️ Spicy</span>}
                  {item.signature && <span className="tag signature">⭐ Signature</span>}
                </div>
                <div className="menu-item-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => {
                      setEditingItem(item);
                      setFormData(item);
                      setImagePreview(item.image);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className={`btn-toggle ${item.available ? 'available' : 'unavailable'}`}
                    onClick={() => handleToggleAvailability(item._id, item.available)}
                  >
                    {item.available ? 'Set Unavailable' : 'Set Available'}
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(item._id)}
                  >
                    Delete
                  </button>
                </div>
                <div className={`availability-badge ${item.available ? 'in-stock' : 'out-of-stock'}`}>
                  {item.available ? '✓ In Stock' : '✗ Out of Stock'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
// ==================== REPORTS TAB ====================
const ReportsTab = () => {
  const [reportType, setReportType] = useState('daily');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const generateReport = async () => {
    try {
      setLoading(true);
      let data;
      
      switch(reportType) {
        case 'daily':
          data = await adminService.getDailyReport(dateRange.start);
          break;
        case 'weekly':
          data = await adminService.getWeeklyReport();
          break;
        case 'monthly':
          data = await adminService.getMonthlyReport();
          break;
        case 'custom':
          data = await adminService.getReport('custom', dateRange.start, dateRange.end);
          break;
        default:
          data = await adminService.getDailyReport();
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      // Mock data
      setReportData({
        totalOrders: 45,
        totalRevenue: 12500,
        averageOrderValue: 278,
        categoryBreakdown: [
          { category: 'Main Course', itemsSold: 28, revenue: 8400 },
          { category: 'Appetizers', itemsSold: 12, revenue: 2160 },
          { category: 'Desserts', itemsSold: 8, revenue: 960 },
          { category: 'Beverages', itemsSold: 15, revenue: 980 },
        ],
        deliveryBreakdown: [
          { name: 'Abebe', ordersCount: 15, totalAmount: 4200 },
          { name: 'Kebede', ordersCount: 12, totalAmount: 3600 },
          { name: 'Almaz', ordersCount: 18, totalAmount: 4700 },
        ],
        topItems: [
          { name: 'Cheese Burger', quantity: 25, revenue: 6250 },
          { name: 'Doro Wat', quantity: 18, revenue: 5040 },
          { name: 'Pizza', quantity: 15, revenue: 5250 },
        ]
      });
      toast.error('Using mock data - backend not connected');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const data = await adminService.exportReport(reportType, format, dateRange.start, dateRange.end);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportType}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="reports-tab">
      <h1 className="page-title">Sales Reports</h1>
      
      <div className="report-controls">
        <div className="report-type-selector">
          <button 
            className={reportType === 'daily' ? 'active' : ''} 
            onClick={() => setReportType('daily')}
          >
            Daily
          </button>
          <button 
            className={reportType === 'weekly' ? 'active' : ''} 
            onClick={() => setReportType('weekly')}
          >
            Weekly
          </button>
          <button 
            className={reportType === 'monthly' ? 'active' : ''} 
            onClick={() => setReportType('monthly')}
          >
            Monthly
          </button>
          <button 
            className={reportType === 'custom' ? 'active' : ''} 
            onClick={() => setReportType('custom')}
          >
            Custom Range
          </button>
        </div>

        {reportType === 'custom' && (
          <div className="date-range">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
        )}

        <div className="report-actions">
          <button className="btn-generate" onClick={generateReport} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          {reportData && (
            <div className="export-buttons">
              <button className="btn-export" onClick={() => handleExport('csv')}>Export CSV</button>
              <button className="btn-export" onClick={() => handleExport('pdf')}>Export PDF</button>
            </div>
          )}
        </div>
      </div>

      {reportData && (
        <div className="report-results">
          <h2>Report Summary - {reportType.charAt(0).toUpperCase() + reportType.slice(1)}</h2>
          
          <div className="summary-cards">
            <div className="summary-card">
              <span className="label">Total Orders</span>
              <span className="value">{reportData.totalOrders}</span>
            </div>
            <div className="summary-card">
              <span className="label">Total Revenue</span>
              <span className="value">{reportData.totalRevenue.toLocaleString()} ETB</span>
            </div>
            <div className="summary-card">
              <span className="label">Average Order</span>
              <span className="value">{reportData.averageOrderValue.toLocaleString()} ETB</span>
            </div>
          </div>

          <div className="report-section">
            <h3>Sales by Category</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Items Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {reportData.categoryBreakdown?.map(cat => (
                  <tr key={cat.category}>
                    <td>{cat.category}</td>
                    <td>{cat.itemsSold}</td>
                    <td>{cat.revenue.toLocaleString()} ETB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="report-section">
            <h3>Top Selling Items</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {reportData.topItems?.map(item => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.revenue.toLocaleString()} ETB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="report-section">
            <h3>Delivery Performance</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Delivery Person</th>
                  <th>Orders Delivered</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {reportData.deliveryBreakdown?.map(del => (
                  <tr key={del.name}>
                    <td>{del.name}</td>
                    <td>{del.ordersCount}</td>
                    <td>{del.totalAmount.toLocaleString()} ETB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== USERS TAB ====================
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const roles = ['customer', 'chef', 'delivery', 'cashier', 'admin'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Mock data
      setUsers([
        { _id: '1', name: 'John Doe', email: 'john@example.com', phone: '0912345678', role: 'customer', status: 'active', createdAt: new Date().toISOString() },
        { _id: '2', name: 'Chef Berhanu', email: 'berhanu@sewrica.com', phone: '0923456789', role: 'chef', status: 'active', createdAt: new Date().toISOString() },
        { _id: '3', name: 'Abebe Delivery', email: 'abebe@sewrica.com', phone: '0934567890', role: 'delivery', status: 'active', createdAt: new Date().toISOString() },
        { _id: '4', name: 'Admin User', email: 'admin@sewrica.com', phone: '0945678901', role: 'admin', status: 'active', createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      await adminService.toggleUserStatus(userId);
      toast.success('User status toggled successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to toggle user status');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div className="users-tab">
      <h1 className="page-title">User Management</h1>
      
      <div className="table-responsive">
        <table className="data-table users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || 'N/A'}</td>
                  <td>
                    <select 
                      value={user.role} 
                      onChange={(e) => updateUserRole(user._id, e.target.value)}
                      className="role-select"
                    >
                      {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className={`btn-status ${user.status === 'active' ? 'btn-disable' : 'btn-enable'}`}
                        onClick={() => toggleUserStatus(user._id)}
                      >
                        {user.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      <button className="btn-edit">Edit</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;