import api from './api';
import { ReinspeccionSeguimiento, ReinspeccionVerificacion } from '../types/reinspeccion';

export const reinspeccionService = {
  listarSeguimientos: async (): Promise<ReinspeccionSeguimiento[]> => {
    const response = await api.get('/reinspecciones');
    return response.data.data;
  },

  verificarPlaca: async (placa: string): Promise<ReinspeccionVerificacion> => {
    const response = await api.get(`/reinspecciones/verificar/${placa.trim().toUpperCase()}`);
    return response.data.data;
  },

  registrarRechazo: async (ordenId: string, defectosJson?: string): Promise<ReinspeccionSeguimiento> => {
    const response = await api.post(`/reinspecciones/rechazo/${ordenId}`, defectosJson);
    return response.data.data;
  }
};
