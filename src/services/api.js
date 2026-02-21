import axios from 'axios';

// Base URL for your backend API
const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user || response.data));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user || response.data));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get profile' };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

// Menu services
export const menuService = {
  // Get all menu items with optional filters
  getAllItems: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.vegetarian) params.append('vegetarian', filters.vegetarian);
      if (filters.spicy) params.append('spicy', filters.spicy);
      if (filters.signature) params.append('signature', filters.signature);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/menu${queryString}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch menu items' };
    }
  },

  // Get single menu item by ID
  getItemById: async (id) => {
    try {
      const response = await api.get(`/menu/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch menu item' };
    }
  },

  // Get items by category
  getItemsByCategory: async (category) => {
    try {
      const response = await api.get(`/menu/category/${category}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch category items' };
    }
  },

  // Get all categories
  getAllCategories: async () => {
    try {
      const response = await api.get('/menu/categories');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch categories' };
    }
  },

  // Admin only: Create new menu item
  createItem: async (itemData, imageFile) => {
    try {
      const formData = new FormData();
      
      Object.keys(itemData).forEach(key => {
        if (key === 'ingredients' && Array.isArray(itemData[key])) {
          formData.append(key, itemData[key].join(','));
        } else if (itemData[key] !== null && itemData[key] !== undefined) {
          formData.append(key, itemData[key]);
        }
      });
      
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      const response = await api.post('/menu', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create menu item' };
    }
  },

  // Admin only: Update menu item
  updateItem: async (id, itemData, imageFile) => {
    try {
      const formData = new FormData();
      
      Object.keys(itemData).forEach(key => {
        if (key === 'ingredients' && Array.isArray(itemData[key])) {
          formData.append(key, itemData[key].join(','));
        } else if (itemData[key] !== null && itemData[key] !== undefined) {
          formData.append(key, itemData[key]);
        }
      });
      
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      const response = await api.put(`/menu/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update menu item' };
    }
  },

  // Admin only: Delete menu item
  deleteItem: async (id) => {
    try {
      const response = await api.delete(`/menu/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete menu item' };
    }
  },

  // Admin only: Toggle availability
  toggleAvailability: async (id) => {
    try {
      const response = await api.patch(`/menu/${id}/toggle`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to toggle availability' };
    }
  }
};

// Admin Dashboard Services
export const adminService = {
  // Get dashboard statistics
  getStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error.response?.data || { message: 'Failed to fetch dashboard stats' };
    }
  },

  // Get recent orders
  getRecentOrders: async () => {
    try {
      const response = await api.get('/admin/recent-orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      throw error.response?.data || { message: 'Failed to fetch recent orders' };
    }
  },

  // Get all orders with optional filter
  getAllOrders: async (status = 'all') => {
    try {
      const url = status === 'all' ? '/admin/orders' : `/admin/orders?status=${status}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error.response?.data || { message: 'Failed to fetch orders' };
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, status, notes = null) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error.response?.data || { message: 'Failed to update order status' };
    }
  },

  // Get order details
  getOrderDetails: async (orderId) => {
    try {
      const response = await api.get(`/admin/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error.response?.data || { message: 'Failed to fetch order details' };
    }
  },

  // Get all users (admin only)
  getAllUsers: async () => {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    try {
      const response = await api.put(`/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error.response?.data || { message: 'Failed to update user role' };
    }
  },

  // Toggle user status (active/inactive)
  toggleUserStatus: async (userId) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/toggle-status`);
      return response.data;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error.response?.data || { message: 'Failed to toggle user status' };
    }
  },

  // Get sales reports
  getReport: async (type, startDate = null, endDate = null) => {
    try {
      let url = `/admin/reports/${type}`;
      if (startDate && endDate) {
        url += `?start=${startDate}&end=${endDate}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error.response?.data || { message: 'Failed to fetch report' };
    }
  },

  // Get daily report
  getDailyReport: async (date = null) => {
    try {
      const url = date ? `/admin/reports/daily?date=${date}` : '/admin/reports/daily';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching daily report:', error);
      throw error.response?.data || { message: 'Failed to fetch daily report' };
    }
  },

  // Get weekly report
  getWeeklyReport: async (week = null) => {
    try {
      const url = week ? `/admin/reports/weekly?week=${week}` : '/admin/reports/weekly';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching weekly report:', error);
      throw error.response?.data || { message: 'Failed to fetch weekly report' };
    }
  },

  // Get monthly report
  getMonthlyReport: async (month = null) => {
    try {
      const url = month ? `/admin/reports/monthly?month=${month}` : '/admin/reports/monthly';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      throw error.response?.data || { message: 'Failed to fetch monthly report' };
    }
  },

  // Get sales by category
  getSalesByCategory: async (startDate, endDate) => {
    try {
      const response = await api.get(`/admin/reports/category-sales?start=${startDate}&end=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category sales:', error);
      throw error.response?.data || { message: 'Failed to fetch category sales' };
    }
  },

  // Get delivery performance
  getDeliveryPerformance: async (startDate, endDate) => {
    try {
      const response = await api.get(`/admin/reports/delivery-performance?start=${startDate}&end=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching delivery performance:', error);
      throw error.response?.data || { message: 'Failed to fetch delivery performance' };
    }
  },

  // Get top selling items
  getTopSellingItems: async (limit = 10, startDate = null, endDate = null) => {
    try {
      let url = `/admin/reports/top-items?limit=${limit}`;
      if (startDate && endDate) {
        url += `&start=${startDate}&end=${endDate}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching top items:', error);
      throw error.response?.data || { message: 'Failed to fetch top selling items' };
    }
  },

  // Export report as CSV/PDF
  exportReport: async (type, format = 'csv', startDate = null, endDate = null) => {
    try {
      let url = `/admin/reports/export/${type}?format=${format}`;
      if (startDate && endDate) {
        url += `&start=${startDate}&end=${endDate}`;
      }
      const response = await api.get(url, {
        responseType: 'blob' // Important for file download
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error.response?.data || { message: 'Failed to export report' };
    }
  }
};

// ============================================
// ORDER SERVICES - WITH PAYMENT METHODS
// ============================================
export const orderService = {
  // Create new order
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create order' };
    }
  },

  // Get user's orders
  getUserOrders: async () => {
    try {
      const response = await api.get('/orders/my-orders');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch orders' };
    }
  },

  // Get single order
  getOrder: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch order' };
    }
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    try {
      const response = await api.patch(`/orders/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel order' };
    }
  },

  // ========== PAYMENT METHODS ==========
  
  createPaymentIntent: async (orderId) => {
    try {
      const response = await api.post('/payments/create-payment-intent', { orderId });
      return response.data;
    } catch (error) {
      console.error('Create payment intent error:', error);
      throw error.response?.data || { message: 'Failed to create payment intent' };
    }
  },

  confirmOrderPayment: async (orderId, paymentIntentId) => {
    try {
      const response = await api.post(`/orders/${orderId}/confirm-payment`, {
        paymentIntentId
      });
      return response.data;
    } catch (error) {
      console.error('Confirm payment error:', error);
      throw error.response?.data || { message: 'Failed to confirm payment' };
    }
  },

  processCashPayment: async (orderId, amountReceived) => {
    try {
      const response = await api.post(`/orders/${orderId}/cash-payment`, {
        amountReceived
      });
      return response.data;
    } catch (error) {
      console.error('Process cash payment error:', error);
      throw error.response?.data || { message: 'Failed to process cash payment' };
    }
  },

  getPaymentMethods: async () => {
    try {
      const response = await api.get('/payments/payment-methods');
      return response.data;
    } catch (error) {
      console.error('Get payment methods error:', error);
      throw error.response?.data || { message: 'Failed to get payment methods' };
    }
  },

  getOrderWithPayment: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/payment`);
      return response.data;
    } catch (error) {
      console.error('Get order with payment error:', error);
      throw error.response?.data || { message: 'Failed to fetch order payment details' };
    }
  },

  getPaymentStatus: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/payment-status`);
      return response.data;
    } catch (error) {
      console.error('Get payment status error:', error);
      throw error.response?.data || { message: 'Failed to get payment status' };
    }
  },

  refundPayment: async (orderId, reason) => {
    try {
      const response = await api.post(`/orders/${orderId}/refund`, { reason });
      return response.data;
    } catch (error) {
      console.error('Refund payment error:', error);
      throw error.response?.data || { message: 'Failed to process refund' };
    }
  }
};

// ============================================
// STAFF MANAGEMENT SERVICES - NEW
// ============================================
export const staffService = {
  // Get staff by role (cook, delivery, cashier)
  getStaffByRole: async (role) => {
    try {
      const response = await api.get(`/staff/${role}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${role}s:`, error);
      throw error.response?.data || { message: `Failed to fetch ${role}s` };
    }
  },

  // Assign order to chef
  assignChef: async (orderId, chefId, notes = '') => {
    try {
      const response = await api.post(`/staff/assign-chef/${orderId}`, { 
        chefId, 
        notes 
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning chef:', error);
      throw error.response?.data || { message: 'Failed to assign chef' };
    }
  },

  // Assign order to delivery person
  assignDelivery: async (orderId, deliveryId, notes = '') => {
    try {
      const response = await api.post(`/staff/assign-delivery/${orderId}`, { 
        deliveryId, 
        notes 
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning delivery:', error);
      throw error.response?.data || { message: 'Failed to assign delivery person' };
    }
  },

  // Chef starts cooking
  startCooking: async (orderId) => {
    try {
      const response = await api.post(`/staff/start-cooking/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error starting cooking:', error);
      throw error.response?.data || { message: 'Failed to start cooking' };
    }
  },

  // Chef completes cooking
  completeCooking: async (orderId) => {
    try {
      const response = await api.post(`/staff/complete-cooking/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error completing cooking:', error);
      throw error.response?.data || { message: 'Failed to complete cooking' };
    }
  },

  // Delivery person starts delivery
  startDelivery: async (orderId) => {
    try {
      const response = await api.post(`/staff/start-delivery/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error starting delivery:', error);
      throw error.response?.data || { message: 'Failed to start delivery' };
    }
  },

  // Delivery person completes delivery
  completeDelivery: async (orderId) => {
    try {
      const response = await api.post(`/staff/complete-delivery/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error completing delivery:', error);
      throw error.response?.data || { message: 'Failed to complete delivery' };
    }
  },

  // Get orders assigned to current chef
  getMyCookingOrders: async () => {
    try {
      const response = await api.get('/staff/my-cooking-orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching cooking orders:', error);
      throw error.response?.data || { message: 'Failed to fetch cooking orders' };
    }
  },

  // Get orders assigned to current delivery person
  getMyDeliveryOrders: async () => {
    try {
      const response = await api.get('/staff/my-delivery-orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching delivery orders:', error);
      throw error.response?.data || { message: 'Failed to fetch delivery orders' };
    }
  },

  // Get unassigned orders (for assignment)
  getUnassignedOrders: async () => {
    try {
      const response = await api.get('/staff/unassigned-orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching unassigned orders:', error);
      throw error.response?.data || { message: 'Failed to fetch unassigned orders' };
    }
  }
};

// ============================================
// STAFF REPORTING SERVICES - NEW
// ============================================
export const staffReportService = {
  // Get staff performance summary
  getStaffSummary: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/staff/reports/summary?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching staff summary:', error);
      throw error.response?.data || { message: 'Failed to get staff summary' };
    }
  },

  // Get chef performance report
  getChefReport: async (chefId, startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/staff/reports/chef/${chefId}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chef report:', error);
      throw error.response?.data || { message: 'Failed to get chef report' };
    }
  },

  // Get delivery person performance report
  getDeliveryReport: async (deliveryId, startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/staff/reports/delivery/${deliveryId}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching delivery report:', error);
      throw error.response?.data || { message: 'Failed to get delivery report' };
    }
  },

  // Get items cooked by chef (detailed breakdown)
  getChefItemsBreakdown: async (chefId, startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/staff/reports/chef/${chefId}/items?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chef items breakdown:', error);
      throw error.response?.data || { message: 'Failed to get chef items breakdown' };
    }
  },

  // Get daily delivery performance
  getDailyDeliveryStats: async (deliveryId, date) => {
    try {
      const response = await api.get(`/staff/reports/delivery/${deliveryId}/daily?date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching daily delivery stats:', error);
      throw error.response?.data || { message: 'Failed to get daily delivery stats' };
    }
  },

  // Export staff report
  exportStaffReport: async (type, format = 'csv', startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/staff/reports/export/${type}?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting staff report:', error);
      throw error.response?.data || { message: 'Failed to export staff report' };
    }
  }
};

// Cart services
export const cartService = {
  // Add to cart
  addToCart: (item, quantity = 1) => {
    try {
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      const existingItem = cart.find(i => i.id === item._id);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.push({ 
          id: item._id,
          name: item.name,
          nameAm: item.nameAm,
          price: item.price,
          image: item.image,
          category: item.category,
          quantity: quantity
        });
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      return cart;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw { message: 'Failed to add to cart' };
    }
  },

  // Get cart
  getCart: () => {
    try {
      return JSON.parse(localStorage.getItem('cart')) || [];
    } catch {
      return [];
    }
  },

  // Update quantity
  updateQuantity: (itemId, quantity) => {
    try {
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      const item = cart.find(i => i.id === itemId);
      if (item) {
        item.quantity = quantity;
        if (quantity <= 0) {
          cart = cart.filter(i => i.id !== itemId);
        }
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      return cart;
    } catch (error) {
      console.error('Error updating cart:', error);
      throw { message: 'Failed to update cart' };
    }
  },

  // Remove from cart
  removeFromCart: (itemId) => {
    try {
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      cart = cart.filter(i => i.id !== itemId);
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      return cart;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw { message: 'Failed to remove from cart' };
    }
  },

  // Clear cart
  clearCart: () => {
    try {
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  },

  // Get cart total
  getCartTotal: () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    } catch {
      return 0;
    }
  },

  // Get cart count
  getCartCount: () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      return cart.reduce((total, item) => total + item.quantity, 0);
    } catch {
      return 0;
    }
  }
};

export default api;