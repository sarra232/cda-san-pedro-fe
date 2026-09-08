import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Si VITE_API_URL está definida se usa; de lo contrario, se usa la ruta relativa '/api'
// Esto permite que funcione transparente en localhost, Docker, Nginx, Ngrok y Vercel sin problemas de CORS.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 segundos timeout para evitar cuelgues
});

// Interceptor para inyectar token JWT automáticamente desde el store de Zustand o localStorage
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token || localStorage.getItem('cda_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para capturar errores de sesión (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Limpieza de sesión coordinada en el navegador
      useAuthStore.getState().logout(true);
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
