import api from './api';
import {
  CuentaPorPagar,
  CuentaPorPagarFormData,
  PagoProveedorFormData,
  SemaforoVencimientos,
  ConfiguracionAlertasTesoreria
} from '../types/cuentapagar';

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

  actualizar: async (id: string, data: CuentaPorPagarFormData): Promise<CuentaPorPagar> => {
    const response = await api.put(`/cuentas-por-pagar/${id}`, data);
    return response.data.data;
  },

  eliminar: async (id: string): Promise<void> => {
    await api.delete(`/cuentas-por-pagar/${id}`);
  },

  registrarPago: async (id: string, data: PagoProveedorFormData): Promise<CuentaPorPagar> => {
    const response = await api.post(`/cuentas-por-pagar/${id}/pagos`, data);
    return response.data.data;
  },

  notificarPendientes: async (data?: { emails?: string[]; telefonos?: string[]; mensajePersonalizado?: string }): Promise<string> => {
    const response = await api.post('/cuentas-por-pagar/notificar-pendientes', data || {});
    return response.data.data || response.data.message;
  },

  obtenerConfiguracionAlertas: async (): Promise<ConfiguracionAlertasTesoreria> => {
    const response = await api.get('/cuentas-por-pagar/configuracion-alertas');
    return response.data.data;
  },

  guardarConfiguracionAlertas: async (data: Partial<ConfiguracionAlertasTesoreria>): Promise<ConfiguracionAlertasTesoreria> => {
    const response = await api.put('/cuentas-por-pagar/configuracion-alertas', data);
    return response.data.data;
  }
};
