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

// Auth services (your existing code)
export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
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
        localStorage.setItem('user', JSON.stringify(response.data));
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
      return JSON.parse(userStr);
    }
    return null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

// 🆕 NEW: Menu services
export const menuService = {
  // Get all menu items with optional filters
  getAllItems: async (filters = {}) => {
    try {
      // Build query string from filters
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

  // 🆕 Admin only: Create new menu item
  createItem: async (itemData, imageFile) => {
    try {
      const formData = new FormData();
      
      // Append all text fields
      Object.keys(itemData).forEach(key => {
        if (key === 'ingredients' && Array.isArray(itemData[key])) {
          formData.append(key, itemData[key].join(','));
        } else {
          formData.append(key, itemData[key]);
        }
      });
      
      // Append image if exists
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

  // 🆕 Admin only: Update menu item
  updateItem: async (id, itemData, imageFile) => {
    try {
      const formData = new FormData();
      
      Object.keys(itemData).forEach(key => {
        if (key === 'ingredients' && Array.isArray(itemData[key])) {
          formData.append(key, itemData[key].join(','));
        } else {
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

  // 🆕 Admin only: Delete menu item
  deleteItem: async (id) => {
    try {
      const response = await api.delete(`/menu/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete menu item' };
    }
  },

  // 🆕 Admin only: Toggle availability
  toggleAvailability: async (id) => {
    try {
      const response = await api.patch(`/menu/${id}/toggle`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to toggle availability' };
    }
  }
};

export default api;