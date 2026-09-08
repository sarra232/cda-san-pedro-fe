import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  const { token, validateSession, checkTokenValidity } = useAuthStore();

  useEffect(() => {
    // 1. Verificación proactiva local (exp)
    const isValidLocal = checkTokenValidity();

    // 2. Revalidación con el backend para expulsar sesiones viejas o inválidas
    if (isValidLocal && token) {
      validateSession();
    }

    // 3. Verificación periódica cada 60 segundos
    const interval = setInterval(() => {
      checkTokenValidity();
    }, 60000);

    return () => clearInterval(interval);
  }, [token, validateSession, checkTokenValidity]);

  return <AppRoutes />;
}
