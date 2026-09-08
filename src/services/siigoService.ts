import api from './api';
import { FacturaElectronicaDian, SiigoStatus, SiigoSyncResult } from '../types/siigo';

export const siigoService = {
  getStatus: async (): Promise<SiigoStatus> => {
    const response = await api.get('/siigo/status');
    return response.data.data;
  },

  emitirFacturaDian: async (facturaId: string): Promise<FacturaElectronicaDian> => {
    const response = await api.post(`/siigo/facturas/${facturaId}/emitir`);
    return response.data.data;
  },

  getEstadoFiscal: async (facturaId: string): Promise<FacturaElectronicaDian | null> => {
    const response = await api.get(`/siigo/facturas/${facturaId}`);
    return response.data.data;
  },

  syncCustomers: async (maxPages = 20, pageSize = 100): Promise<SiigoSyncResult> => {
    const response = await api.post(`/siigo/customers/sync-all?maxPages=${maxPages}&pageSize=${pageSize}`);
    return response.data.data;
  },

  searchCustomerInSiigo: async (documento: string) => {
    const response = await api.get(`/siigo/customers/search/${documento}`);
    return response.data.data;
  }
};

