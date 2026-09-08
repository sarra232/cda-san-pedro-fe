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

  async enviarCorreoPrueba(email: string, mensaje?: string): Promise<string> {
    const res = await api.post<ApiResponse<string>>('/notificaciones/test-email', { email, mensaje });
    return res.data.message || 'Correo de prueba despachado';
  },

  async enviarPlantillaReal(payload: {
    tipoPlantilla: string;
    destinatario: string;
    nombreCliente?: string;
    placa?: string;
    categoriaVehiculo?: string;
    numeroFactura?: string;
    total?: number;
    metodoPago?: string;
    diasRestantes?: number;
    cuponOBeneficio?: string;
    mensaje?: string;
  }): Promise<string> {
    const res = await api.post<ApiResponse<string>>('/notificaciones/enviar-plantilla-real', payload);
    return res.data.data || res.data.message || 'Plantilla despachada con éxito';
  },
};
