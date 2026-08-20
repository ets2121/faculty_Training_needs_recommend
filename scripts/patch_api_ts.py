from pathlib import Path

content = """import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach JWT token to requests if present in localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Global response interceptor for error handling & 401 redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      // 1. Unreachable backend or Network error
      if (!error.response) {
        error.message = 'Unable to reach backend API server. Please check your network or server status.';
      } else if (error.response.status === 401) {
        // 2. Unauthorized / expired token
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('access_token');
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
"""

Path("frontend/src/lib/api.ts").write_text(content, encoding="utf-8")
print("api.ts updated with network error interceptor.")