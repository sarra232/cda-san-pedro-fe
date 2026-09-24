import api from './api';
import { ApiResponse, UsuarioPerfil, ActualizarPerfilRequest, CambiarPasswordRequest } from '../types/auth';

export const profileService = {
  async getMiPerfil(): Promise<UsuarioPerfil> {
    const res = await api.get<ApiResponse<UsuarioPerfil>>('/auth/me');
    return res.data.data;
  },

  async actualizarPerfil(payload: ActualizarPerfilRequest): Promise<UsuarioPerfil> {
    const res = await api.put<ApiResponse<UsuarioPerfil>>('/auth/perfil', payload);
    return res.data.data;
  },

  async cambiarPassword(payload: CambiarPasswordRequest): Promise<string> {
    const res = await api.put<ApiResponse<string>>('/auth/cambiar-password', payload);
    return res.data.message;
  },
};
