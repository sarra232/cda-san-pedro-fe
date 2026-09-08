export type EstadoFacturaDian = 'PENDIENTE' | 'EMITIDA' | 'RECHAZADA' | 'FALLIDA' | 'ANULADA';

export interface FacturaElectronicaDian {
  id: string;
  facturaId: string;
  numeroFacturaLocal: string;
  ambiente: 'SANDBOX' | 'PRODUCTION';
  siigoInvoiceId?: string;
  numeroFacturaSiigo?: string;
  cufe?: string;
  qrDian?: string;
  pdfSiigoUrl?: string;
  estadoDian: EstadoFacturaDian;
  mensajeRespuesta?: string;
  intentos: number;
  fechaEmisionDian?: string;
  createdAt: string;
}

export interface SiigoStatus {
  configured: boolean;
  environment: 'SANDBOX' | 'PRODUCTION';
  apiUrl: string;
  username?: string;
  documentTypeId?: number;
  connected: boolean;
  message: string;
}

export interface SiigoSyncResult {
  totalProcesados: number;
  nuevosCreados: number;
  actualizados: number;
  fallidos: number;
  mensaje: string;
}

