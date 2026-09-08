export type TipoObligacion = 
  | 'FACTURA_PROVEEDOR'
  | 'MEMBRESIA_LICENCIA'
  | 'SOFTWARE_LICENCIAS'
  | 'SERVICIO_PUBLICO'
  | 'CALIBRACION_EQUIPOS'
  | 'SEGUROS_POLIZAS'
  | 'ARRIENDO'
  | 'IMPUESTOS_TASAS'
  | 'OTRO';

export type PeriodicidadPago = 
  | 'PAGO_UNICO'
  | 'MENSUAL'
  | 'BIMESTRAL'
  | 'TRIMESTRAL'
  | 'SEMESTRAL'
  | 'ANUAL';

export type EstadoCuentaPagar = 
  | 'PENDIENTE'
  | 'PAGADA_PARCIAL'
  | 'PAGADA'
  | 'VENCIDA'
  | 'ANULADA';

export interface PagoProveedor {
  id: string;
  cuentaPorPagarId: string;
  montoPagado: number;
  fechaPago: string;
  metodoPago: string;
  numeroComprobante?: string;
  soporteUrlArchivo?: string;
  usuarioId?: string;
  usuarioNombre?: string;
  observaciones?: string;
  createdAt?: string;
}

export interface CuentaPorPagar {
  id: string;
  acreedorTerceroId: string;
  acreedorDocumento: string;
  acreedorNombre: string;
  acreedorCelular: string;
  numeroReferencia?: string;
  concepto: string;
  montoTotal: number;
  saldoPendiente: number;
  tipoObligacion: TipoObligacion;
  periodicidad: PeriodicidadPago;
  fechaEmision: string;
  fechaVencimiento: string;
  diasAvisoAnticipado: number;
  diasRestantes: number;
  colorSemaforo: 'ROJO' | 'AMARILLO' | 'VERDE' | 'GRIS';
  estado: EstadoCuentaPagar;
  observaciones?: string;
  metadata?: string;
  pagos?: PagoProveedor[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CuentaPorPagarFormData {
  acreedorTerceroId: string;
  numeroReferencia?: string;
  concepto: string;
  montoTotal: number;
  tipoObligacion: TipoObligacion;
  periodicidad: PeriodicidadPago;
  fechaEmision?: string;
  fechaVencimiento: string;
  diasAvisoAnticipado?: number;
  observaciones?: string;
}

export interface PagoProveedorFormData {
  montoPagado: number;
  fechaPago?: string;
  metodoPago: string;
  numeroComprobante?: string;
  soporteUrlArchivo?: string;
  usuarioId?: string;
  observaciones?: string;
}

export interface SemaforoVencimientos {
  totalVencidas: number;
  saldoVencido: number;
  totalProximas: number;
  saldoProximo: number;
  totalAlDia: number;
  saldoAlDia: number;
  cuentasUrgentes: CuentaPorPagar[];
}
