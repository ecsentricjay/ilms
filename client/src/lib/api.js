import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ilms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ilms_token');
      localStorage.removeItem('ilms_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
