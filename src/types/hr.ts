import { RolUsuario } from './auth';

export type TipoContrato = 
  | 'TERMINO_FIJO' 
  | 'TERMINO_INDEFINIDO' 
  | 'OBRA_LABOR' 
  | 'PRESTACION_SERVICIOS' 
  | 'APRENDIZAJE_SENA';

export type EstadoEmpleado = 'ACTIVO' | 'VACACIONES' | 'INCAPACITADO' | 'LICENCIA' | 'RETIRADO';

export type TipoCertificacion = 
  | 'INSPECTOR_LINEA_LIVIANOS'
  | 'INSPECTOR_LINEA_PESADOS'
  | 'INSPECTOR_LINEA_MOTOS'
  | 'DIRECTOR_TECNICO'
  | 'DIRECTOR_TECNICO_SUPLENTE'
  | 'CALIBRACION_EQUIPOS'
  | 'SEGURIDAD_SALUD_TRABAJO'
  | 'PRIMEROS_AUXILIOS'
  | 'OTRO';

export type EstadoNomina = 'BORRADOR' | 'APROBADA' | 'PAGADA' | 'ANULADA';

export interface EmpleadoCertificacion {
  id: string;
  empleadoId: string;
  empleadoNombre?: string;
  empleadoDocumento?: string;
  empleadoCargo?: string;
  tipoCertificacion: TipoCertificacion;
  codigoCertificado: string;
  entidadEmisora: string;
  fechaEmision: string;
  fechaVencimiento: string;
  diasRestantes?: number;
  colorSemaforo?: 'VERDE' | 'AMARILLO' | 'ROJO';
  soporteUrl?: string;
  estado: string;
  observaciones?: string;
  createdAt?: string;
}

export interface Empleado {
  id: string;
  terceroId?: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombresApellidos: string;
  celular?: string;
  email?: string;
  direccion?: string;
  cargo: string;
  departamento: string;
  tipoContrato: TipoContrato;
  salarioBase: number;
  auxilioTransporteAplica: boolean;
  banco?: string;
  tipoCuenta?: string;
  numeroCuenta?: string;
  fechaIngreso: string;
  fechaRetiro?: string;
  estado: EstadoEmpleado;
  rolApp?: RolUsuario;
  usuarioActivo?: boolean;
  usuarioId?: string;
  certificaciones?: EmpleadoCertificacion[];
  createdAt?: string;
}

export interface EmpleadoFormData {
  terceroId?: string;
  tipoDocumento?: string;
  numeroDocumento: string;
  nombresApellidos: string;
  celular?: string;
  email?: string;
  direccion?: string;
  cargo: string;
  departamento?: string;
  tipoContrato: TipoContrato;
  salarioBase: number;
  auxilioTransporteAplica: boolean;
  banco?: string;
  tipoCuenta?: string;
  numeroCuenta?: string;
  fechaIngreso: string;
  estado?: EstadoEmpleado;
  rolApp?: RolUsuario;
}

export interface CertificacionFormData {
  empleadoId: string;
  tipoCertificacion: TipoCertificacion;
  codigoCertificado: string;
  entidadEmisora?: string;
  fechaEmision: string;
  fechaVencimiento: string;
  soporteUrl?: string;
  estado?: string;
  observaciones?: string;
}

export interface NominaDetalle {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  empleadoDocumento: string;
  empleadoCargo: string;
  banco?: string;
  numeroCuenta?: string;
  diasTrabajados: number;
  salarioBase: number;
  sueldoDevengado: number;
  auxilioTransporte: number;
  horasExtras: number;
  bonificaciones: number;
  totalDevengado: number;
  deduccionSalud: number;
  deduccionPension: number;
  otrasDeducciones: number;
  totalDeducciones: number;
  netoPagar: number;
  aporteSaludPatronal?: number;
  aportePensionPatronal?: number;
  aporteArl?: number;
  parafiscalesCaja?: number;
  provisionPrima?: number;
  provisionCesantias?: number;
  provisionInteresesCesantias?: number;
  provisionVacaciones?: number;
}

export interface Nomina {
  id: string;
  periodoAnio: number;
  periodoMes: number;
  periodoQuincena: number;
  periodoDescripcion: string;
  fechaInicio: string;
  fechaFin: string;
  totalDevengado: number;
  totalDeducciones: number;
  totalNeto: number;
  totalAportesPatronales: number;
  totalProvisiones: number;
  estado: EstadoNomina;
  cuentaPorPagarId?: string;
  observaciones?: string;
  detalles: NominaDetalle[];
  createdAt: string;
}

export interface NovedadEmpleado {
  empleadoId: string;
  diasTrabajados?: number;
  horasExtras?: number;
  bonificaciones?: number;
  otrasDeducciones?: number;
  observaciones?: string;
}

export interface LiquidacionNominaFormData {
  periodoAnio: number;
  periodoMes: number;
  periodoQuincena: number;
  fechaInicio?: string;
  fechaFin?: string;
  observaciones?: string;
  novedades?: NovedadEmpleado[];
}
