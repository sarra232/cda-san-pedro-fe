import api from './api';
import { ApiResponse, ValidacionTokenResponse, RestablecerPasswordRequest } from '../types/auth';

export const authService = {
  /**
   * Solicitar recuperación de contraseña por documento o correo.
   * Si el usuario no existe o no está habilitado, el servidor responderá error 400.
   */
  async solicitarRecuperacion(identificador: string): Promise<string> {
    const response = await api.post<ApiResponse<string>>('/auth/solicitar-recuperacion', {
      identificador: identificador.trim(),
    });
    return response.data.data || response.data.message;
  },

  /**
   * Validar token de activación o recuperación.
   */
  async validarToken(token: string): Promise<ValidacionTokenResponse> {
    const response = await api.get<ApiResponse<ValidacionTokenResponse>>(`/auth/validar-token?token=${encodeURIComponent(token.trim())}`);
    return response.data.data;
  },

  /**
   * Establecer o restablecer contraseña con token.
   */
  async establecerPassword(payload: RestablecerPasswordRequest): Promise<string> {
    const response = await api.post<ApiResponse<string>>('/auth/establecer-password', payload);
    return response.data.data || response.data.message;
  },
};
