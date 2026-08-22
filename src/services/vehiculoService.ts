import api from './api';
import { ApiResponse } from '../types/auth';
import { Vehiculo, VehiculoFormData } from '../types/vehiculo';

export const vehiculoService = {
  async getVehiculos(query?: string): Promise<Vehiculo[]> {
    const params = query ? { query } : {};
    const res = await api.get<ApiResponse<Vehiculo[]>>('/vehiculos', { params });
    return res.data.data;
  },

  async getVehiculoByPlaca(placa: string): Promise<Vehiculo | null> {
    try {
      const placaLimpia = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const res = await api.get<ApiResponse<Vehiculo>>(`/vehiculos/placa/${placaLimpia}`);
      return res.data.data;
    } catch {
      return null;
    }
  },

  async saveVehiculo(formData: VehiculoFormData): Promise<Vehiculo> {
    const res = await api.post<ApiResponse<Vehiculo>>('/vehiculos', formData);
    return res.data.data;
  },
};
