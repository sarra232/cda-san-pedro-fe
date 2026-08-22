import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <AppRoutes />;
}
