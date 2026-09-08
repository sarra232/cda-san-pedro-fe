import api from './api';
import { CuentaPorPagar, CuentaPorPagarFormData, PagoProveedorFormData, SemaforoVencimientos } from '../types/cuentapagar';

export const cuentaPagarService = {
  listarTodas: async (): Promise<CuentaPorPagar[]> => {
    const response = await api.get('/cuentas-por-pagar');
    return response.data.data;
  },

  obtenerPorId: async (id: string): Promise<CuentaPorPagar> => {
    const response = await api.get(`/cuentas-por-pagar/${id}`);
    return response.data.data;
  },

  obtenerSemaforo: async (): Promise<SemaforoVencimientos> => {
    const response = await api.get('/cuentas-por-pagar/semaforo');
    return response.data.data;
  },

  crear: async (data: CuentaPorPagarFormData): Promise<CuentaPorPagar> => {
    const response = await api.post('/cuentas-por-pagar', data);
    return response.data.data;
  },

  registrarPago: async (id: string, data: PagoProveedorFormData): Promise<CuentaPorPagar> => {
    const response = await api.post(`/cuentas-por-pagar/${id}/pagos`, data);
    return response.data.data;
  }
};
