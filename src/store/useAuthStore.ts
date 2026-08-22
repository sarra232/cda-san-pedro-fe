import { create } from 'zustand';
import { User, LoginCredentials, AuthResponse, ApiResponse } from '../types/auth';
import api from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  initialize: () => {
    const token = localStorage.getItem('cda_token');
    const userJson = localStorage.getItem('cda_user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        set({ token, user, error: null });
      } catch {
        localStorage.removeItem('cda_token');
        localStorage.removeItem('cda_user');
        set({ token: null, user: null });
      }
    }
  },

  login: async (credentials: LoginCredentials) => {
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

      localStorage.setItem('cda_token', data.token);
      localStorage.setItem('cda_user', JSON.stringify(user));

      set({
        token: data.token,
        user,
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
      set({ isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  logout: () => {
    localStorage.removeItem('cda_token');
    localStorage.removeItem('cda_user');
    set({ user: null, token: null, error: null });
  },
}));
