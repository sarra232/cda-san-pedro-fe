import api from './api';
import { ApiResponse } from '../types/auth';
import { Tarifa, TarifaCreateRequest, TarifaUpdateRequest } from '../types/tarifa';
import { CategoriaVehiculo } from '../types/vehiculo';

export const tarifaService = {
  async getTarifas(params?: { categoria?: CategoriaVehiculo; soloActivos?: boolean }): Promise<Tarifa[]> {
    const res = await api.get<ApiResponse<Tarifa[]>>('/tarifas', { params });
    return res.data.data;
  },

  async getTarifaById(id: string): Promise<Tarifa> {
    const res = await api.get<ApiResponse<Tarifa>>(`/tarifas/${id}`);
    return res.data.data;
  },

  async createTarifa(request: TarifaCreateRequest): Promise<Tarifa> {
    const res = await api.post<ApiResponse<Tarifa>>('/tarifas', request);
    return res.data.data;
  },

  async updateTarifa(id: string, request: TarifaUpdateRequest): Promise<Tarifa> {
    const res = await api.put<ApiResponse<Tarifa>>(`/tarifas/${id}`, request);
    return res.data.data;
  },

  async deleteTarifa(id: string): Promise<void> {
    await api.delete(`/tarifas/${id}`);
  },
};
