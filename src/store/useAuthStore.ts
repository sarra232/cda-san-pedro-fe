import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, LoginCredentials, AuthResponse, ApiResponse } from '../types/auth';
import api from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
  isLoading: boolean;
  isValidating: boolean;
  error: string | null;
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>;
  logout: (notifyStorage?: boolean | unknown) => void;
  updateUser: (userUpdates: Partial<User>) => void;
  validateSession: () => Promise<boolean>;
  checkTokenValidity: () => boolean;
  clearError: () => void;
}


// Función auxiliar para verificar si un token JWT ha expirado en el navegador
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return true;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (!parsed.exp) return false;
    // Buffer de 30 segundos para prevenir condiciones de carrera
    return Date.now() >= parsed.exp * 1000 - 30000;
  } catch {
    return true;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      rememberMe: true,
      isLoading: false,
      isValidating: false,
      error: null,

      clearError: () => set({ error: null }),

      checkTokenValidity: () => {
        const { token, user } = get();
        if (!token || !user || isTokenExpired(token)) {
          get().logout(false);
          return false;
        }
        return true;
      },

      validateSession: async () => {
        const { token } = get();
        if (!token || isTokenExpired(token)) {
          get().logout(false);
          return false;
        }

        set({ isValidating: true });
        try {
          const response = await api.get<ApiResponse<User>>('/auth/me');
          if (response.data && response.data.data) {
            const freshUser = response.data.data;
            set({
              user: freshUser,
              isAuthenticated: true,
              isValidating: false,
            });
            return true;
          } else {
            get().logout(true);
            return false;
          }
        } catch {
          // Si el servidor rechaza el token (401/403/inválido), limpiar de inmediato
          get().logout(true);
          return false;
        } finally {
          set({ isValidating: false });
        }
      },

      login: async (credentials: LoginCredentials, rememberMe: boolean = true) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
          const data = response.data.data;

          const user: User = {
            id: data.id,
            tipoDocumento: data.tipoDocumento,
            numeroDocumento: data.numeroDocumento,
            nombresApellidos: data.nombresApellidos,
            rol: data.rol,
          };

          // Guardamos también compatibilidad de legado
          localStorage.setItem('cda_token', data.token);
          localStorage.setItem('cda_user', JSON.stringify(user));

          set({
            token: data.token,
            user,
            isAuthenticated: true,
            rememberMe,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          let errorMessage = 'Error al iniciar sesión';
          if (err && typeof err === 'object' && 'response' in err) {
            const responseData = (err as { response: { data?: { message?: string } } }).response?.data;
            if (responseData?.message) {
              errorMessage = responseData.message;
            }
          }
          set({ isLoading: false, error: errorMessage, isAuthenticated: false, user: null, token: null });
          throw new Error(errorMessage);
        }
      },

      logout: (notifyStorage: boolean | unknown = true) => {
        // Limpieza de claves de compatibilidad
        localStorage.removeItem('cda_token');
        localStorage.removeItem('cda_user');
        sessionStorage.removeItem('cda_token');
        sessionStorage.removeItem('cda_user');

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
          isValidating: false,
        });

        const shouldNotify = notifyStorage !== false;
        if (shouldNotify && typeof window !== 'undefined') {
          // Desencadenar evento para sincronizar el cierre en todas las demás pestañas abiertas
          localStorage.setItem('cda_logout_event', Date.now().toString());
          localStorage.removeItem('cda_logout_event');
        }
      },

      updateUser: (userUpdates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updated = { ...currentUser, ...userUpdates };
          localStorage.setItem('cda_user', JSON.stringify(updated));
          set({ user: updated });
        }
      },
    }),

    {
      name: 'cda_auth_session', // Clave única persistente y síncrona
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: Boolean(state.token && state.user && !isTokenExpired(state.token)),
        rememberMe: state.rememberMe,
      }),
      onRehydrateStorage: () => (state) => {
        // Revalidación síncrona inmediata al cargar el navegador
        if (state?.token && isTokenExpired(state.token)) {
          state.logout(false);
        }
      },
    }
  )
);

// Sincronización Multi-Pestaña en tiempo real
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'cda_logout_event' || (event.key === 'cda_auth_session' && !event.newValue)) {
      useAuthStore.getState().logout(false);
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
  });
}
