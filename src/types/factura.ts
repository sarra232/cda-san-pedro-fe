import { Cliente, ClienteFormData } from './cliente';
import { OrdenIngreso } from './ingreso';

export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'DATAFONO_TARJETA' | 'SISTECREDITO' | 'MIXTO';
export type EstadoFactura = 'PAGADA' | 'ANULADA';

export interface ItemFactura {
  id: string;
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
  totalItem: number;
}

export interface Factura {
  id: string;
  numeroFactura: string;
  consecutivo: number;
  fechaEmision: string;
  subtotal: number;
  iva: number;
  total: number;
  metodoPago: MetodoPago;
  estado: EstadoFactura;
  clienteFactura: Cliente;
  ordenIngreso: OrdenIngreso;
  usuarioNombre: string;
  items: ItemFactura[];
  createdAt: string;

  // Integración Fiscal SIIGO / DIAN
  estadoDian?: 'PENDIENTE' | 'EMITIDA' | 'RECHAZADA' | 'FALLIDA' | 'ANULADA';
  numeroFacturaSiigo?: string;
  pdfSiigoUrl?: string;
  cufe?: string;
  mensajeRespuestaDian?: string;
}

export interface FacturaFormData {
  ordenIngresoId: string;
  pagadorTipo: 'PROPIETARIO' | 'CONDUCTOR' | 'TERCERO';
  clienteFacturaId?: string;
  clienteFacturaData?: ClienteFormData;
  metodoPago: MetodoPago;
  items?: {
    descripcion: string;
    cantidad: number;
    valorUnitario: number;
  }[];
}
