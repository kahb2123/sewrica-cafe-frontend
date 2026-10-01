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

  getPermissions: async () => {
    try {
      const response = await api.get('/auth/permissions');
      const data = response.data;

      if (data && data.success !== false) {
        const permissions = data.permissions || [];
        const role = data.user?.role || authService.getCurrentUser()?.role || 'customer';
        const roleHierarchy = data.roleHierarchy || {};

        const hasPermission = (permission) => permissions.includes(permission);
        const hasRole = (...roles) => roles.includes(role);

        const hasRoleOrHigher = (minRole) => {
          const roleLevels = {
            customer: 0,
            supply_chain: 1,
            cashier: 2,
            delivery: 3,
            cook: 4,
            chef: 4,
            admin: 5,
          };
          const userLevel = roleLevels[role] ?? -1;
          const minLevel = roleLevels[minRole] ?? -1;
          return userLevel >= minLevel;
        };

        const PERMISSIONS = data.PERMISSIONS || {
          ORDERS_VIEW: 'orders:view',
          ORDERS_ALL: 'orders:all',
          ORDERS_ASSIGN_CHEF: 'orders:assign_chef',
          ORDERS_ASSIGN_DELIVERY: 'orders:assign_delivery',
          ORDERS_UPDATE_STATUS: 'orders:update_status',
          ORDERS_ACCEPT: 'orders:accept',
          ORDERS_REJECT: 'orders:reject',
          ORDERS_START_COOKING: 'orders:start_cooking',
          ORDERS_COMPLETE_COOKING: 'orders:complete_cooking',
          ORDERS_START_DELIVERY: 'orders:start_delivery',
          ORDERS_COMPLETE_DELIVERY: 'orders:complete_delivery',
          ORDERS_VIEW_ASSIGNED: 'orders:view_assigned',
          STAFF_VIEW: 'staff:view',
          STAFF_CREATE: 'staff:create',
          STAFF_UPDATE: 'staff:update',
          STAFF_DELETE: 'staff:delete',
          MENU_MANAGE: 'menu:manage',
          INGREDIENTS_MANAGE: 'ingredients:manage',
          EXPENSES_MANAGE: 'expenses:manage',
          REPORTS_VIEW: 'reports:view',
          REPORTS_EXPORT: 'reports:export',
          PAYMENTS_PROCESS: 'payments:process',
          PAYMENTS_VIEW: 'payments:view',
        };

        return {
          success: true,
          role,
          permissions,
          roleHierarchy,
          PERMISSIONS,
          hasPermission,
          hasRole,
          hasRoleOrHigher,
          can: hasPermission,
          canAccess: (requiredRole) => hasRoleOrHigher(requiredRole),
        };
      }

      return data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get permissions' };
    }
  },

  getRoleMap: async () => {
    try {
      const response = await api.get('/auth/roles');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get role map' };
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
      const message = error.response?.data?.message || '';
      if (message.includes('Cast to ObjectId') && message.includes('inventory')) {
        const fallbackResponse = await api.get('/menu?includeUnavailable=true');
        return fallbackResponse.data;
      }
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

export const ingredientService = {
  getAll: async () => {
    try {
      const response = await api.get('/ingredients');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch ingredients' };
    }
  },

  create: async (ingredientData) => {
    try {
      const response = await api.post('/ingredients', ingredientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create ingredient' };
    }
  },

  recordPurchase: async (id, purchaseData) => {
    try {
      const response = await api.post(`/ingredients/${id}/purchases`, purchaseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to record purchase' };
    }
  },

  update: async (id, ingredientData) => {
    try {
      const response = await api.patch(`/ingredients/${id}`, ingredientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update ingredient' };
    }
  },

  getWithdrawals: async (limit = 50) => {
    try {
      const response = await api.get('/ingredients/withdrawals', { params: { limit } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to load withdrawals' };
    }
  },

  withdraw: async (withdrawalData) => {
    try {
      const response = await api.post('/ingredients/withdrawals', withdrawalData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to record withdrawal' };
    }
  }
};

// ========== EXPENSE SERVICES ==========
export const expenseService = {
  getAll: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, value);
        }
      });
      const queryString = query.toString() ? `?${query.toString()}` : '';
      const response = await api.get(`/expenses${queryString}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch expenses' };
    }
  },

  getStats: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, value);
        }
      });
      const queryString = query.toString() ? `?${query.toString()}` : '';
      const response = await api.get(`/expenses/stats${queryString}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch expense stats' };
    }
  },

  create: async (expenseData) => {
    try {
      const response = await api.post('/expenses', expenseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create expense' };
    }
  },

  update: async (id, expenseData) => {
    try {
      const response = await api.patch(`/expenses/${id}`, expenseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update expense' };
    }
  },

  approve: async (id) => {
    try {
      const response = await api.patch(`/expenses/${id}/approve`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to approve expense' };
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/expenses/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete expense' };
    }
  }
};

// ========== ADMIN SERVICES ==========
export const adminService = {
  getRoleMap: async () => {
    try {
      const response = await api.get('/auth/roles');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch role map' };
    }
  },

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

  deleteStaff: async (staffId) => {
    try {
      const response = await api.delete(`/admin/staff/${staffId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete staff' };
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
  // One endpoint serves every report in the admin panel.
  // `section` (sales | items | staff) skips the unneeded aggregations so an
  // export can be focused on just the staff or just the items.
  getUnifiedReport: async ({ start, end, role, staffId, section } = {}) => {
    try {
      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      if (role && role !== 'all') params.append('role', role);
      if (staffId) params.append('staffId', staffId);
      if (section && section !== 'all') params.append('section', section);
      const query = params.toString() ? `?${params}` : '';
      const response = await api.get(`/admin/reports/unified${query}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error.response?.data || { message: 'Failed to fetch report' };
    }
  },

  exportUnifiedReport: async (format = 'csv', { start, end, role, section } = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      if (role && role !== 'all') params.append('role', role);
      if (section && section !== 'all') params.append('section', section);
      const response = await api.get(`/admin/reports/export?${params}`, {
        responseType: 'blob',
        timeout: 60000
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting report:', error);
      // The export endpoint can answer with JSON on a 4xx/5xx, but the request
      // is typed as a blob. Parse the blob back to text so the caller sees the
      // real server message instead of a generic axios failure.
      const data = error.response?.data;
      if (data instanceof Blob) {
        const text = await data.text().catch(() => '');
        try {
          const parsed = JSON.parse(text);
          throw parsed;
        } catch {
          throw { message: text || 'Failed to export report' };
        }
      }
      throw error.response?.data || { message: 'Failed to export report' };
    }
  }
};

// ========== ORDER SERVICES ==========
export const orderService = {
  // Compatibility wrapper for older kitchen bundles.
  getAllOrders: async (status = 'all') => {
    const orders = await adminService.getAllOrders(status);
    return { data: Array.isArray(orders) ? orders : orders.data || orders.orders || [] };
  },

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

  getChefStats: async () => {
    try {
      const userStr = sessionStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (user?._id) {
        const response = await adminService.getUnifiedReport({ staffId: user._id });
        const detail = response?.data?.staffDetail;
        if (detail) {
          return {
            totalOrders: detail.summary.totalOrders || 0,
            totalItemsCooked: detail.summary.totalItemsCooked || 0
          };
        }
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
        const response = await adminService.getUnifiedReport({ staffId: user._id });
        const detail = response?.data?.staffDetail;
        if (detail) {
          return {
            totalDeliveries: detail.summary.totalOrders || 0,
            totalAmount: detail.summary.totalAmount || 0
          };
        }
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

// ========== ORDER NUMBER HELPER ==========
// New orders are stored as a plain 5-digit number. Older records still carry the
// legacy "ORD" prefix, so strip it for display instead of inventing digits.
export const getOrderNumberLabel = (orderNumber) => {
  if (orderNumber === null || orderNumber === undefined || orderNumber === '') return '--';
  return String(orderNumber).replace(/^ORD/i, '');
};

// ========== PERMISSIONS CONSTANTS ==========
export const ROLE_PERMISSIONS = {
  customer: ['orders:view'],
  supply_chain: ['ingredients:manage'],
  cashier: ['orders:view', 'payments:process', 'payments:view', 'staff:view'],
  delivery: ['orders:view_assigned', 'orders:accept', 'orders:reject', 'orders:start_delivery', 'orders:complete_delivery'],
  cook: ['orders:view_assigned', 'orders:accept', 'orders:reject', 'orders:start_cooking', 'orders:complete_cooking'],
  chef: ['orders:view_assigned', 'orders:accept', 'orders:reject', 'orders:start_cooking', 'orders:complete_cooking'],
  admin: [
    'orders:view', 'orders:all', 'orders:assign_chef', 'orders:assign_delivery',
    'orders:update_status', 'orders:accept', 'orders:reject',
    'orders:start_cooking', 'orders:complete_cooking',
    'orders:start_delivery', 'orders:complete_delivery',
    'orders:view_assigned',
    'staff:view', 'staff:create', 'staff:update', 'staff:delete',
    'menu:manage', 'ingredients:manage', 'expenses:manage',
    'reports:view', 'reports:export',
    'payments:process', 'payments:view',
  ],
};

export const PAGE_ACCESS = {
  staffDashboard: {
    read: ['cook', 'chef', 'delivery', 'cashier', 'admin'],
    write: ['cook', 'chef', 'delivery', 'cashier', 'admin'],
  },
  staffOrdersCooking: {
    read: ['cook', 'chef', 'admin'],
    write: ['cook', 'chef', 'admin'],
  },
  staffOrdersDelivery: {
    read: ['delivery', 'admin'],
    write: ['delivery', 'admin'],
  },
  staffStats: {
    read: ['cook', 'chef', 'delivery', 'cashier', 'admin'],
    write: ['admin'],
  },
  staffProfile: {
    read: ['cook', 'chef', 'delivery', 'cashier', 'admin'],
    write: ['cook', 'chef', 'delivery', 'cashier', 'admin'],
  },
  adminDashboard: {
    read: ['admin'],
    write: ['admin'],
  },
  adminOrders: {
    read: ['admin', 'cashier'],
    write: ['admin'],
  },
  adminStaff: {
    read: ['admin'],
    write: ['admin'],
  },
  adminMenu: {
    read: ['admin'],
    write: ['admin'],
  },
  adminReports: {
    read: ['admin', 'cashier'],
    write: ['admin'],
  },
  adminIngredients: {
    read: ['admin', 'supply_chain'],
    write: ['admin', 'supply_chain'],
  },
  adminExpenses: {
    read: ['admin'],
    write: ['admin'],
  },
  adminUsers: {
    read: ['admin'],
    write: ['admin'],
  },
};

export const canReadPage = (userRole, page) => {
  const role = userRole?.toLowerCase();
  const access = PAGE_ACCESS[page];
  if (!access) return false;
  return access.read.includes(role);
};

export const canWritePage = (userRole, page) => {
  const role = userRole?.toLowerCase();
  const access = PAGE_ACCESS[page];
  if (!access) return false;
  return access.write.includes(role);
};

export const getPageAccessForRole = (userRole) => {
  const role = userRole?.toLowerCase();
  const result = {};
  for (const [page, access] of Object.entries(PAGE_ACCESS)) {
    result[page] = {
      canRead: access.read.includes(role),
      canWrite: access.write.includes(role),
    };
  }
  return result;
};

export const PERMISSIONS = {
  ORDERS_VIEW: 'orders:view',
  ORDERS_ALL: 'orders:all',
  ORDERS_ASSIGN_CHEF: 'orders:assign_chef',
  ORDERS_ASSIGN_DELIVERY: 'orders:assign_delivery',
  ORDERS_UPDATE_STATUS: 'orders:update_status',
  ORDERS_ACCEPT: 'orders:accept',
  ORDERS_REJECT: 'orders:reject',
  ORDERS_START_COOKING: 'orders:start_cooking',
  ORDERS_COMPLETE_COOKING: 'orders:complete_cooking',
  ORDERS_START_DELIVERY: 'orders:start_delivery',
  ORDERS_COMPLETE_DELIVERY: 'orders:complete_delivery',
  ORDERS_VIEW_ASSIGNED: 'orders:view_assigned',
  STAFF_VIEW: 'staff:view',
  STAFF_CREATE: 'staff:create',
  STAFF_UPDATE: 'staff:update',
  STAFF_DELETE: 'staff:delete',
  MENU_MANAGE: 'menu:manage',
  INGREDIENTS_MANAGE: 'ingredients:manage',
  EXPENSES_MANAGE: 'expenses:manage',
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  PAYMENTS_PROCESS: 'payments:process',
  PAYMENTS_VIEW: 'payments:view',
};

export const hasPermission = (userRole, permission) => {
  const perms = ROLE_PERMISSIONS[userRole?.toLowerCase()] || [];
  return perms.includes(permission);
};

export const hasRole = (userRole, ...allowedRoles) => {
  return allowedRoles.includes(userRole?.toLowerCase());
};

export const ROLE_HIERARCHY = {
  customer: 0,
  supply_chain: 1,
  cashier: 2,
  delivery: 3,
  cook: 4,
  chef: 4,
  admin: 5,
};

export const hasRoleOrHigher = (userRole, minRole) => {
  const userLevel = ROLE_HIERARCHY[userRole?.toLowerCase()] ?? -1;
  const minLevel = ROLE_HIERARCHY[minRole?.toLowerCase()] ?? -1;
  return userLevel >= minLevel;
};

export default api;
