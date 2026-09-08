import { Cliente, ClienteFormData } from './cliente';
import { Vehiculo, VehiculoFormData } from './vehiculo';

export type EstadoOrden = 'INGRESADO' | 'EN_INSPECCION' | 'APROBADO' | 'RECHAZADO' | 'FACTURADO' | 'CANCELADO';

export type TipoPrueba = 'SENSORIAL_VISUAL' | 'FRENOS_SUSPENSION' | 'LUCES_ALINEACION' | 'GASES_EMISIONES';

export type EstadoPrueba = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface PruebaInspeccion {
  id: string;
  ordenIngresoId: string;
  tipoPrueba: TipoPrueba;
  estado: EstadoPrueba;
  observaciones?: string;
  usuarioResponsableId?: string;
  usuarioResponsableNombre?: string;
  usuarioResponsableRol?: string;
  fechaEjecucion?: string;
  createdAt: string;
}

export interface OrdenIngreso {
  id: string;
  consecutivo: number;
  fechaIngreso: string;
  kilometraje: number;
  tipoServicio: string;
  estado: EstadoOrden;
  conductorEsPropietario: boolean;
  vehiculo: Vehiculo;
  conductor?: Cliente;
  usuarioNombre: string;
  ordenPadreId?: string;
  consecutivoOrdenPadre?: number;
  esReinspeccion?: boolean;
  diasTranscurridosRechazo?: number;
  diasRestantesReinspeccion?: number;
  esReinspeccionVigente?: boolean;
  fechaLimiteReinspeccion?: string;
  pruebasRechazadasPrevias?: string[];
  observaciones?: string;
  createdAt: string;
  pruebas?: PruebaInspeccion[];
}

export interface OrdenIngresoFormData {
  vehiculoId?: string;
  placa: string;
  vehiculoData?: VehiculoFormData;
  propietarioId?: string;
  propietarioData?: ClienteFormData;
  kilometraje: number;
  tipoServicio: string;
  conductorEsPropietario: boolean;
  conductorId?: string;
  conductorData?: ClienteFormData;
  ordenPadreId?: string;
  esReinspeccion?: boolean;
  observaciones?: string;
}
