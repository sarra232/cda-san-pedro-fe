import api from './api';
import { ApiResponse } from '../types/auth';
import { Factura } from '../types/factura';

export interface DashboardStats {
  recaudoHoy: number;
  vehiculosAtendidosHoy: number;
  facturasEmitidasHoy: number;
  alertasVencimiento: number;
  totalMotos: number;
  totalLivianos: number;
  totalPesados: number;
  totalPublicos: number;
  actividadPorHoras: {
    name: string;
    vehiculos: number;
    ingresos: number;
  }[];
}

export interface ReporteVentas {
  fechaInicio: string;
  fechaFin: string;
  totalRecaudado: number;
  totalVehiculos: number;
  totalFacturas: number;
  vehiculosPorCategoria: Record<string, number>;
  ingresosPorMetodoPago: Record<string, number>;
  facturas: Factura[];
}

export const reporteService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await api.get<ApiResponse<DashboardStats>>('/reportes/dashboard');
    return res.data.data;
  },

  async getReporteVentas(fechaInicio?: string, fechaFin?: string): Promise<ReporteVentas> {
    const params: any = {};
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;

    const res = await api.get<ApiResponse<ReporteVentas>>('/reportes/ventas', { params });
    return res.data.data;
  },

  async downloadCsv(fechaInicio?: string, fechaFin?: string): Promise<void> {
    const params: any = {};
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;

    const response = await api.get('/reportes/ventas/export-csv', {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Ventas_CDA_${fechaInicio || 'inicio'}_${fechaFin || 'fin'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
