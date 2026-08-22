import api from './api';
import { ApiResponse } from '../types/auth';
import { Notificacion } from '../types/notificacion';

export const notificacionService = {
  async getNotificaciones(): Promise<Notificacion[]> {
    const res = await api.get<ApiResponse<Notificacion[]>>('/notificaciones');
    return res.data.data;
  },

  async ejecutarBarrido(): Promise<string> {
    const res = await api.post<ApiResponse<string>>('/notificaciones/barrido');
    return res.data.message;
  },

  async reintentar(id: string): Promise<Notificacion> {
    const res = await api.post<ApiResponse<Notificacion>>(`/notificaciones/${id}/reintentar`);
    return res.data.data;
  },
};
