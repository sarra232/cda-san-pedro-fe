import api from './api';
import { ApiResponse } from '../types/auth';
import { Factura, FacturaFormData } from '../types/factura';

export const facturaService = {
  async getFacturas(fechaInicio?: string, fechaFin?: string): Promise<Factura[]> {
    const params: any = {};
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;

    const res = await api.get<ApiResponse<Factura[]>>('/facturas', { params });
    return res.data.data;
  },

  async getFacturaById(id: string): Promise<Factura> {
    const res = await api.get<ApiResponse<Factura>>(`/facturas/${id}`);
    return res.data.data;
  },

  async emitirFactura(formData: FacturaFormData): Promise<Factura> {
    const res = await api.post<ApiResponse<Factura>>('/facturas', formData);
    return res.data.data;
  },

  async downloadPdf(id: string, numeroFactura: string): Promise<void> {
    const response = await api.get(`/facturas/${id}/pdf`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Factura_${numeroFactura}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async viewPdfInTab(id: string): Promise<void> {
    const response = await api.get(`/facturas/${id}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  },

  async enviarFactura(id: string): Promise<string> {
    const res = await api.post<ApiResponse<string>>(`/facturas/${id}/enviar`);
    return res.data.message;
  },
};
