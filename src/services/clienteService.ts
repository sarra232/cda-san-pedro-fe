import api from './api';
import { ApiResponse } from '../types/auth';
import { Cliente, ClienteFormData } from '../types/cliente';

export const clienteService = {
  async getClientes(query?: string): Promise<Cliente[]> {
    const params = query ? { query } : {};
    const res = await api.get<ApiResponse<Cliente[]>>('/clientes', { params });
    return res.data.data;
  },

  async getClienteByDocumento(numeroDocumento: string): Promise<Cliente | null> {
    try {
      const res = await api.get<ApiResponse<Cliente>>(`/clientes/documento/${numeroDocumento}`);
      return res.data.data;
    } catch {
      return null;
    }
  },

  async saveCliente(formData: ClienteFormData): Promise<Cliente> {
    const res = await api.post<ApiResponse<Cliente>>('/clientes', formData);
    return res.data.data;
  },
};
