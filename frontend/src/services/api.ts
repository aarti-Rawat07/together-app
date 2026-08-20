import axios from 'axios';

const api = axios.create({
  baseURL: 'https://together-backend-p53w.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('together_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        localStorage.removeItem('together_token');
        localStorage.removeItem('together_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
