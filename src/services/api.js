// src/services/api.js
import axios from 'axios';

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? 'https://sewrica-cafe-backend.onrender.com/api' : 'http://localhost:5000/api');

console.log('🔧 API_URL:', API_URL);

// Base uploads URL for LOCAL files ONLY (backward compatibility)
export const UPLOADS_URL = API_URL.replace(/\/api\/?$/, '') + '/uploads';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // Increased to 60 seconds for Render free tier
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📡 API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`❌ API Error: ${error.response.config?.url}`, error.response.status, error.response.data);
      
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.request) {
      console.error('❌ No response received:', error.request);
    } else {
      console.error('❌ Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

// ========== AUTH SERVICES ==========
export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.token) {
        const userData = {
          _id: response.data._id,
          id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone,
          role: response.data.role || 'customer'
        };
        
        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        return {
          success: true,
          user: userData,
          token: response.data.token
        };
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data && response.data.token) {
        const userData = {
          _id: response.data._id,
          id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone,
          role: response.data.role || 'customer'
        };
        
        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        return {
          success: true,
          user: userData,
          token: response.data.token
        };
      }
      
      return {
        success: false,
        error: 'Invalid response from server'
      };
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          return {
            success: false,
            error: data.message || 'Invalid email or password'
          };
        } else if (status === 404) {
          return {
            success: false,
            error: 'User not found'
          };
        } else if (status === 500) {
          return {
            success: false,
            error: 'Server error. Please try again later.'
          };
        } else {
          return {
            success: false,
            error: data.message || 'Login failed'
          };
        }
      } else if (error.request) {
        return {
          success: false,
          error: 'Network error. Please check your connection.'
        };
      } else {
        return {
          success: false,
          error: error.message || 'An unexpected error occurred'
        };
      }
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
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = sessionStorage.getItem('user');
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
    return !!sessionStorage.getItem('token');
  }
};

// ========== MENU SERVICES ==========
export const menuService = {
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

  createItem: async (itemData, imageFile) => {
    try {
      const formData = new FormData();
      
      Object.keys(itemData).forEach(key => {
        if (itemData[key] !== null && itemData[key] !== undefined) {
          if (typeof itemData[key] === 'boolean') {
            formData.append(key, itemData[key].toString());
          } else {
            formData.append(key, itemData[key]);
          }
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
      console.error('Create item error:', error);
      throw error.response?.data || { message: 'Failed to create menu item' };
    }
  },

  updateItem: async (id, itemData, imageFile) => {
    try {
      const formData = new FormData();
      
      Object.keys(itemData).forEach(key => {
        if (itemData[key] !== null && itemData[key] !== undefined) {
          if (typeof itemData[key] === 'boolean') {
            formData.append(key, itemData[key].toString());
          } else {
            formData.append(key, itemData[key]);
          }
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
      console.error('Update item error:', error);
      throw error.response?.data || { message: 'Failed to update menu item' };
    }
  },

  deleteItem: async (id) => {
    try {
      const response = await api.delete(`/menu/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete menu item' };
    }
  },

  toggleAvailability: async (id) => {
    try {
      const response = await api.patch(`/menu/${id}/toggle`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to toggle availability' };
    }
  },

  getInventory: async () => {
    try {
      const response = await api.get('/menu/inventory');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch inventory' };
    }
  },

  updateInventory: async (id, inventoryData) => {
    try {
      const response = await api.patch(`/menu/${id}/inventory`, inventoryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update inventory' };
    }
  },

  getAllCategories: async () => {
    try {
      const response = await api.get('/menu/categories');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch categories' };
    }
  }
};

// ========== ADMIN SERVICES ==========
export const adminService = {
  getStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error.response?.data || { message: 'Failed to fetch dashboard stats' };
    }
  },
  
  createStaff: async (staffData) => {
    try {
      const response = await api.post('/admin/staff', staffData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create staff' };
    }
  },
  
  getRecentOrders: async () => {
    try {
      const response = await api.get('/admin/recent-orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      throw error.response?.data || { message: 'Failed to fetch recent orders' };
    }
  },

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

  updateOrderStatus: async (orderId, status, notes = null) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status, notes });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error.response?.data || { message: 'Failed to update order status' };
    }
  },

  getOrderDetails: async (orderId) => {
    try {
      const response = await api.get(`/admin/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error.response?.data || { message: 'Failed to fetch order details' };
    }
  },

  getAllUsers: async () => {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      const response = await api.put(`/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error.response?.data || { message: 'Failed to update user role' };
    }
  },

  toggleUserStatus: async (userId) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/toggle-status`);
      return response.data;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error.response?.data || { message: 'Failed to toggle user status' };
    }
  },

  // ========== ASSIGNMENT METHODS ==========
  assignChef: async (orderId, chefId, notes = '') => {
    try {
      const response = await api.post(`/admin/orders/${orderId}/assign-chef`, { chefId, notes });
      return response.data;
    } catch (error) {
      console.error('Error assigning chef:', error);
      throw error.response?.data || { message: 'Failed to assign chef' };
    }
  },

  assignDelivery: async (orderId, deliveryId, notes = '') => {
    try {
      const response = await api.post(`/admin/orders/${orderId}/assign-delivery`, { deliveryId, notes });
      return response.data;
    } catch (error) {
      console.error('Error assigning delivery:', error);
      throw error.response?.data || { message: 'Failed to assign delivery' };
    }
  },

  // ========== REPORT METHODS ==========
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

  getReport: async (type, startDate, endDate) => {
    try {
      const response = await api.get(`/admin/reports/${type}?start=${startDate}&end=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error.response?.data || { message: 'Failed to fetch report' };
    }
  },

  exportReport: async (type, format = 'csv', startDate = null, endDate = null) => {
    try {
      let url = `/admin/reports/export/${type}?format=${format}`;
      if (startDate && endDate) {
        url += `&start=${startDate}&end=${endDate}`;
      }
      const response = await api.get(url, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error.response?.data || { message: 'Failed to export report' };
    }
  }
};

// ========== ORDER SERVICES ==========
export const orderService = {
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create order' };
    }
  },

  getUserOrders: async () => {
    try {
      const response = await api.get('/orders/my-orders');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch orders' };
    }
  },

  getOrder: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch order' };
    }
  },

  cancelOrder: async (orderId) => {
    try {
      const response = await api.patch(`/orders/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel order' };
    }
  },

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
      const response = await api.post(`/orders/${orderId}/confirm-payment`, { paymentIntentId });
      return response.data;
    } catch (error) {
      console.error('Confirm payment error:', error);
      throw error.response?.data || { message: 'Failed to confirm payment' };
    }
  },

  processCashPayment: async (orderId, amountReceived) => {
    try {
      const response = await api.post(`/orders/${orderId}/cash-payment`, { amountReceived });
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
  },

  updateOrderStatus: async (orderId, status, notes = '') => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status, notes });
      return response.data;
    } catch (error) {
      console.error('Update order status error:', error);
      throw error.response?.data || { message: 'Failed to update order status' };
    }
  }
};

// ========== STAFF SERVICES ==========
export const staffService = {
  getStaffByRole: async (role) => {
    try {
      const response = await api.get(`/staff/${role}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${role}s:`, error);
      throw error.response?.data || { message: `Failed to fetch ${role}s` };
    }
  },

  assignChef: async (orderId, chefId, notes = '') => {
    try {
      const response = await api.post(`/staff/assign-chef/${orderId}`, { chefId, notes });
      return response.data;
    } catch (error) {
      console.error('Error assigning chef:', error);
      throw error.response?.data || { message: 'Failed to assign chef' };
    }
  },

  assignDelivery: async (orderId, deliveryId, notes = '') => {
    try {
      const response = await api.post(`/staff/assign-delivery/${orderId}`, { deliveryId, notes });
      return response.data;
    } catch (error) {
      console.error('Error assigning delivery:', error);
      throw error.response?.data || { message: 'Failed to assign delivery person' };
    }
  },

  chefAcceptOrder: async (orderId, notes = '') => {
    try {
      const response = await api.post(`/staff/orders/${orderId}/chef-accept`, { notes });
      return response.data;
    } catch (error) {
      console.error('Error accepting order:', error);
      throw error.response?.data || { message: 'Failed to accept order' };
    }
  },

  chefRejectOrder: async (orderId, reason) => {
    try {
      const response = await api.post(`/staff/orders/${orderId}/chef-reject`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error rejecting order:', error);
      throw error.response?.data || { message: 'Failed to reject order' };
    }
  },

  deliveryAcceptOrder: async (orderId, notes = '') => {
    try {
      const response = await api.post(`/staff/orders/${orderId}/delivery-accept`, { notes });
      return response.data;
    } catch (error) {
      console.error('Error accepting delivery:', error);
      throw error.response?.data || { message: 'Failed to accept delivery' };
    }
  },

  deliveryRejectOrder: async (orderId, reason) => {
    try {
      const response = await api.post(`/staff/orders/${orderId}/delivery-reject`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error rejecting delivery:', error);
      throw error.response?.data || { message: 'Failed to reject delivery' };
    }
  },

  startCooking: async (orderId) => {
    try {
      const response = await api.post(`/staff/start-cooking/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error starting cooking:', error);
      throw error.response?.data || { message: 'Failed to start cooking' };
    }
  },

  completeCooking: async (orderId) => {
  try {
    // This sends the order to the backend to mark as 'ready'
    const response = await api.post(`/staff/complete-cooking/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error completing cooking:', error);
    throw error.response?.data || { message: 'Failed to complete cooking' };
  }
},

  startDelivery: async (orderId) => {
    try {
      const response = await api.post(`/staff/start-delivery/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error starting delivery:', error);
      throw error.response?.data || { message: 'Failed to start delivery' };
    }
  },

  completeDelivery: async (orderId) => {
    try {
      const response = await api.post(`/staff/complete-delivery/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error completing delivery:', error);
      throw error.response?.data || { message: 'Failed to complete delivery' };
    }
  },

  getMyCookingOrders: async () => {
    try {
      const response = await api.get('/staff/orders/cooking');
      // Return the orders array directly
      if (response.data && Array.isArray(response.data.orders)) {
        return response.data.orders;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching cooking orders:', error);
      return [];
    }
  },

  getMyDeliveryOrders: async () => {
    try {
      const response = await api.get('/staff/orders/delivery');
      // Return the orders array directly
      if (response.data && Array.isArray(response.data.orders)) {
        return response.data.orders;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching delivery orders:', error);
      return [];
    }
  },

  getCashierTasks: async () => {
    try {
      const response = await api.get('/orders/payment-status/pending');
      return response.data;
    } catch (error) {
      console.error('Error fetching cashier tasks:', error);
      return { orders: [] };
    }
  },

  updateOrderStatus: async (orderId, status, notes = '') => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status, notes });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error.response?.data || { message: 'Failed to update order status' };
    }
  },

  getChefReport: async (chefId, startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      let url = `/staff/reports/chef/${chefId}`;
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching chef report:', error);
      throw error.response?.data || { message: 'Failed to get chef report' };
    }
  },

  getDeliveryReport: async (deliveryId, startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      let url = `/staff/reports/delivery/${deliveryId}`;
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching delivery report:', error);
      throw error.response?.data || { message: 'Failed to get delivery report' };
    }
  },

  getChefStats: async () => {
    try {
      const userStr = sessionStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (user?._id) {
        const response = await staffService.getChefReport(user._id);
        return response.summary || { totalOrders: 0, totalItemsCooked: 0 };
      }
      return { totalOrders: 0, totalItemsCooked: 0 };
    } catch (error) {
      console.error('Error fetching chef stats:', error);
      return { totalOrders: 0, totalItemsCooked: 0 };
    }
  },

  getDeliveryStats: async () => {
    try {
      const userStr = sessionStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (user?._id) {
        const response = await staffService.getDeliveryReport(user._id);
        return response.summary || { totalDeliveries: 0, totalAmount: 0 };
      }
      return { totalDeliveries: 0, totalAmount: 0 };
    } catch (error) {
      console.error('Error fetching delivery stats:', error);
      return { totalDeliveries: 0, totalAmount: 0 };
    }
  },

  getCashierStats: async () => {
    try {
      const response = await api.get('/orders/payment-status/pending');
      const pendingPayments = response.orders || response;
      const completedResponse = await api.get('/orders/payment-status/completed');
      const completedPayments = completedResponse.orders || completedResponse;
      
      return {
        pendingPayments: Array.isArray(pendingPayments) ? pendingPayments.length : 0,
        completedToday: Array.isArray(completedPayments) ? completedPayments.filter(p => {
          const paidAt = new Date(p.paidAt);
          const today = new Date();
          return paidAt.toDateString() === today.toDateString();
        }).length : 0,
        totalCompleted: Array.isArray(completedPayments) ? completedPayments.length : 0
      };
    } catch (error) {
      console.error('Error fetching cashier stats:', error);
      return { pendingPayments: 0, completedToday: 0, totalCompleted: 0 };
    }
  },
 getAllStaffReports: async (startDate, endDate) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const url = `/staff/reports/all${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching staff reports:', error);
    throw error.response?.data || { message: 'Failed to fetch staff reports' };
  }
},

getStaffReportsByRole: async (role, startDate, endDate) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const url = `/staff/reports/${role}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching staff reports by role:', error);
    throw error.response?.data || { message: 'Failed to fetch staff reports' };
  }
},

exportStaffReport: async (format, staffId = null, startDate, endDate, role = null) => {
  try {
    const params = new URLSearchParams();
    params.append('format', format);
    if (staffId) params.append('staffId', staffId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (role && role !== 'all') params.append('role', role);
    
    const url = `/staff/reports/export?${params.toString()}`;
    const response = await api.get(url, { 
      responseType: 'blob',
      timeout: 60000
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting staff report:', error);
    throw error.response?.data || { message: 'Failed to export staff report' };
  }
},

  
};

// ========== CART SERVICES ==========
export const cartService = {
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

  getCart: () => {
    try {
      return JSON.parse(localStorage.getItem('cart')) || [];
    } catch {
      return [];
    }
  },

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

  clearCart: () => {
    try {
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  },

  getCartTotal: () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    } catch {
      return 0;
    }
  },

  getCartCount: () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      return cart.reduce((total, item) => total + item.quantity, 0);
    } catch {
      return 0;
    }
  }
};

// ========== IMAGE HELPER FUNCTION ==========
export const getImageUrl = (image) => {
  if (!image) return null;
  if (image.startsWith('http')) return image;
  if (image === 'default-food.jpg') return null;
  return `${UPLOADS_URL}/${image}`;
};

export default api;