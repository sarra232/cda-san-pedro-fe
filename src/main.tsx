import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// Configuración optimizada de Caché en Memoria del Navegador
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos de frescura (renderizado instantáneo a 0 ms)
      gcTime: 1000 * 60 * 10,    // 10 minutos de permanencia en memoria caché
      refetchOnWindowFocus: false, // Previene recargas innecesarias al cambiar de ventana
      refetchOnReconnect: true,   // Revalida automáticamente al recuperar conexión a internet
      retry: 1,                   // 1 reintento automático ante fallos de red
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
