import api from './api';
import { Tercero, TerceroFormData, TipoRolTercero } from '../types/tercero';

export const terceroService = {
  listar: async (rol?: TipoRolTercero, query?: string): Promise<Tercero[]> => {
    const params: Record<string, string> = {};
    if (rol) params.rol = rol;
    if (query) params.query = query;
    const response = await api.get('/terceros', { params });
    return response.data.data;
  },

  listarProveedores: async (): Promise<Tercero[]> => {
    const response = await api.get('/proveedores');
    return response.data.data;
  },

  obtenerPorId: async (id: string): Promise<Tercero> => {
    const response = await api.get(`/terceros/${id}`);
    return response.data.data;
  },

  obtenerPorDocumento: async (documento: string): Promise<Tercero> => {
    const response = await api.get(`/terceros/documento/${documento}`);
    return response.data.data;
  },

  crear: async (data: TerceroFormData): Promise<Tercero> => {
    const response = await api.post('/terceros', data);
    return response.data.data;
  },

  crearProveedor: async (data: TerceroFormData): Promise<Tercero> => {
    const response = await api.post('/proveedores', data);
    return response.data.data;
  },

  actualizar: async (id: string, data: TerceroFormData): Promise<Tercero> => {
    const response = await api.put(`/terceros/${id}`, data);
    return response.data.data;
  },

  actualizarProveedor: async (id: string, data: TerceroFormData): Promise<Tercero> => {
    const response = await api.put(`/proveedores/${id}`, data);
    return response.data.data;
  }
};
