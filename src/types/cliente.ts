import { TipoDocumento } from './auth';

export interface Cliente {
  id: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombresRazonSocial: string;
  direccion?: string;
  celular: string;
  email?: string;
  fechaNacimiento?: string;
  createdAt: string;
}

export interface ClienteFormData {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombresRazonSocial: string;
  direccion?: string;
  celular: string;
  email?: string;
  fechaNacimiento?: string;
}
