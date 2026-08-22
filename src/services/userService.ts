import api from './api';
import { User, ApiResponse, TipoDocumento, RolUsuario } from '../types/auth';

export interface CreateUserData {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombresApellidos: string;
  password: string;
  rol: RolUsuario;
}

export interface UpdateUserData {
  tipoDocumento?: TipoDocumento;
  numeroDocumento?: string;
  nombresApellidos?: string;
  password?: string;
  rol?: RolUsuario;
  activo?: boolean;
}

export const userService = {
  getUsuarios: async (): Promise<User[]> => {
    const res = await api.get<ApiResponse<User[]>>('/usuarios');
    return res.data.data;
  },

  getUsuarioById: async (id: string): Promise<User> => {
    const res = await api.get<ApiResponse<User>>(`/usuarios/${id}`);
    return res.data.data;
  },

  createUsuario: async (data: CreateUserData): Promise<User> => {
    const res = await api.post<ApiResponse<User>>('/usuarios', data);
    return res.data.data;
  },

  updateUsuario: async (id: string, data: UpdateUserData): Promise<User> => {
    const res = await api.put<ApiResponse<User>>(`/usuarios/${id}`, data);
    return res.data.data;
  },

  cambiarEstado: async (id: string, activo: boolean): Promise<User> => {
    const res = await api.patch<ApiResponse<User>>(`/usuarios/${id}/estado?activo=${activo}`);
    return res.data.data;
  },

  eliminarUsuario: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/usuarios/${id}`);
  },
};
