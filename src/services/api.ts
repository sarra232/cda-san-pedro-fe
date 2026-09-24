import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Si VITE_API_URL está definida se usa; de lo contrario, se usa la ruta relativa '/api'
// Esto permite que funcione transparente en localhost, Docker, Nginx, Ngrok y Vercel sin problemas de CORS.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  timeout: 15000, // 15 segundos timeout para evitar cuelgues
});

// Interceptor para inyectar token JWT y prevenir almacenamiento en caché del navegador
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token || localStorage.getItem('cda_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
    }

    // Timestamp dinámico en peticiones GET para garantizar datos frescos en tiempo real multi-usuario
    if (config.method?.toLowerCase() === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
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
