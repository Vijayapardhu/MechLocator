import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
};

// Mechanics API
export const mechanicsAPI = {
  getNearby: (params) => api.get('/mechanics/nearby', { params }),
  search: (params) => api.get('/mechanics/search', { params }),
  getById: (id) => api.get(`/mechanics/${id}`),
  getFilterOptions: () => api.get('/mechanics/filters/options'),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updateLocation: (latitude, longitude) => api.post('/users/location', { latitude, longitude }),
  getSearchHistory: (params) => api.get('/users/search-history', { params }),
  addToSearchHistory: (mechanicId) => api.post(`/users/search-history/${mechanicId}`),
  removeFromSearchHistory: (mechanicId) => api.delete(`/users/search-history/${mechanicId}`),
  clearSearchHistory: () => api.delete('/users/search-history'),
};

// Admin API
export const adminAPI = {
  // Mechanics management
  getMechanics: (params) => api.get('/admin/mechanics', { params }),
  createMechanic: (data) => api.post('/admin/mechanics', data),
  updateMechanic: (id, data) => api.put(`/admin/mechanics/${id}`, data),
  deleteMechanic: (id) => api.delete(`/admin/mechanics/${id}`),
  
  // Image management
  uploadImages: (id, formData) => api.post(`/admin/mechanics/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteImage: (id, imageIndex) => api.delete(`/admin/mechanics/${id}/images/${imageIndex}`),
  
  // Statistics
  getStats: () => api.get('/admin/stats'),
};

// Logs API
export const logsAPI = {
  getUserActivity: (params) => api.get('/logs/user-activity', { params }),
  getSystemStats: (params) => api.get('/logs/system-stats', { params }),
  searchLogs: (params) => api.get('/logs/search', { params }),
  exportLogs: (params) => api.get('/logs/export', { params }),
};

// Utility functions
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

export const formatRating = (rating) => {
  return rating.toFixed(1);
};

export const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone; // Return original if can't format
};

export const makePhoneCall = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  const telUrl = cleaned.startsWith('1') ? `tel:+${cleaned}` : `tel:+1${cleaned}`;
  window.open(telUrl, '_self');
};

export const openDirections = (latitude, longitude, name) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodeURIComponent(name)}`;
  window.open(url, '_blank');
};

export default api;