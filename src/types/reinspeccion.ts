export type EstadoReinspeccion = 'EN_PLAZO' | 'REINSPECCIONADO' | 'VENCIDO_SIN_REINGRESAR';

export interface ReinspeccionVerificacion {
  tieneReinspeccionGratuita: boolean;
  ordenRechazadaId?: string;
  consecutivoOrdenRechazada?: number;
  placa?: string;
  fechaRechazo?: string;
  fechaLimite15Dias?: string;
  diasTranscurridos?: number;
  diasRestantes?: number;
  pruebasRechazadas?: string[];
  mensaje?: string;
}

export interface ReinspeccionSeguimiento {
  id: string;
  ordenRechazadaId: string;
  consecutivoOrdenRechazada: number;
  vehiculoId: string;
  vehiculoPlaca: string;
  vehiculoMarca: string;
  vehiculoLinea: string;
  clienteNombre?: string;
  clienteCelular?: string;
  clienteEmail?: string;
  fechaRechazo: string;
  fechaLimite15Dias: string;
  diasRestantes: number;
  estadoSeguimiento: EstadoReinspeccion;
  reinspeccionCompletada: boolean;
  ordenReinspeccionId?: string;
  consecutivoOrdenReinspeccion?: number;
  metadata?: string;
  createdAt: string;
}
