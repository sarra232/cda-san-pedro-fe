import api from './api';
import {
  Empleado,
  EmpleadoFormData,
  EmpleadoCertificacion,
  CertificacionFormData,
  Nomina,
  LiquidacionNominaFormData,
  EstadoEmpleado
} from '../types/hr';

export const hrService = {
  // Empleados
  listarEmpleados: async (estado?: EstadoEmpleado): Promise<Empleado[]> => {
    const params = estado ? { estado } : {};
    const response = await api.get('/empleados', { params });
    return response.data.data;
  },

  obtenerEmpleadoPorId: async (id: string): Promise<Empleado> => {
    const response = await api.get(`/empleados/${id}`);
    return response.data.data;
  },

  crearEmpleado: async (data: EmpleadoFormData): Promise<Empleado> => {
    const response = await api.post('/empleados', data);
    return response.data.data;
  },

  actualizarEmpleado: async (id: string, data: EmpleadoFormData): Promise<Empleado> => {
    const response = await api.put(`/empleados/${id}`, data);
    return response.data.data;
  },

  retirarEmpleado: async (id: string): Promise<void> => {
    await api.delete(`/empleados/${id}`);
  },

  reenviarInvitacion: async (id: string): Promise<string> => {
    const response = await api.post(`/empleados/${id}/reenviar-invitacion`);
    return response.data.data || response.data.message;
  },

  // Certificaciones ONAC / ISO 17020
  listarCertificaciones: async (): Promise<EmpleadoCertificacion[]> => {
    const response = await api.get('/empleados/certificaciones');
    return response.data.data;
  },

  registrarCertificacion: async (data: CertificacionFormData): Promise<EmpleadoCertificacion> => {
    const response = await api.post('/empleados/certificaciones', data);
    return response.data.data;
  },

  eliminarCertificacion: async (id: string): Promise<void> => {
    await api.delete(`/empleados/certificaciones/${id}`);
  },

  // Nómina
  listarNominas: async (): Promise<Nomina[]> => {
    const response = await api.get('/nominas');
    return response.data.data;
  },

  obtenerNominaPorId: async (id: string): Promise<Nomina> => {
    const response = await api.get(`/nominas/${id}`);
    return response.data.data;
  },

  liquidarNomina: async (data: LiquidacionNominaFormData): Promise<Nomina> => {
    const response = await api.post('/nominas/liquidar', data);
    return response.data.data;
  },

  aprobarNomina: async (id: string): Promise<Nomina> => {
    const response = await api.post(`/nominas/${id}/aprobar`);
    return response.data.data;
  }
};
