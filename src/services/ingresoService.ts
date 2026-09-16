import api from './api';
import { ApiResponse } from '../types/auth';
import { OrdenIngreso, OrdenIngresoFormData, EstadoOrden, PruebaInspeccion, TipoPrueba, EstadoPrueba } from '../types/ingreso';

export const ingresoService = {
  async getIngresosHoy(): Promise<OrdenIngreso[]> {
    const res = await api.get<ApiResponse<OrdenIngreso[]>>('/ingresos/hoy');
    return res.data.data;
  },

  async getIngresos(): Promise<OrdenIngreso[]> {
    const res = await api.get<ApiResponse<OrdenIngreso[]>>('/ingresos');
    return res.data.data;
  },

  async getListosParaFacturar(): Promise<OrdenIngreso[]> {
    const res = await api.get<ApiResponse<OrdenIngreso[]>>('/ingresos/listos-facturar');
    return res.data.data;
  },

  async getIngresoById(id: string): Promise<OrdenIngreso> {
    const res = await api.get<ApiResponse<OrdenIngreso>>(`/ingresos/${id}`);
    return res.data.data;
  },

  async createIngreso(formData: OrdenIngresoFormData): Promise<OrdenIngreso> {
    const res = await api.post<ApiResponse<OrdenIngreso>>('/ingresos', formData);
    return res.data.data;
  },

  async updateEstado(id: string, estado: EstadoOrden, observaciones?: string): Promise<OrdenIngreso> {
    const params = new URLSearchParams({ estado });
    if (observaciones && observaciones.trim()) {
      params.append('observaciones', observaciones.trim());
    }
    const res = await api.patch<ApiResponse<OrdenIngreso>>(`/ingresos/${id}/estado?${params.toString()}`);
    return res.data.data;
  },

  async rechazarOrden(id: string, data: { motivo: string; evidencia?: string; pruebasRechazadas?: TipoPrueba[] }): Promise<OrdenIngreso> {
    const res = await api.post<ApiResponse<OrdenIngreso>>(`/ingresos/${id}/rechazar`, data);
    return res.data.data;
  },

  async getPruebas(ordenId: string): Promise<PruebaInspeccion[]> {
    const res = await api.get<ApiResponse<PruebaInspeccion[]>>(`/ingresos/${ordenId}/pruebas`);
    return res.data.data;
  },

  async updatePrueba(ordenId: string, tipoPrueba: TipoPrueba, estado: EstadoPrueba, observaciones?: string): Promise<PruebaInspeccion> {
    const res = await api.patch<ApiResponse<PruebaInspeccion>>(`/ingresos/${ordenId}/pruebas`, {
      tipoPrueba,
      estado,
      observaciones: observaciones?.trim() || undefined,
    });
    return res.data.data;
  },
};
