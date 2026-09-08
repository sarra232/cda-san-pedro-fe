export type TipoRolTercero = 
  | 'CLIENTE'
  | 'PROVEEDOR'
  | 'PRESTADOR_SERVICIOS'
  | 'EMPLEADO'
  | 'ASEGURADORA'
  | 'TALLER_ALIADO'
  | 'ENTIDAD_CONTROL';

export type TipoPersona = 'NATURAL' | 'JURIDICA';

export interface TerceroRol {
  id?: string;
  tipoRol: TipoRolTercero;
  metadataRol?: string;
  activo?: boolean;
}

export interface Tercero {
  id: string;
  tipoDocumento: string;
  numeroDocumento: string;
  digitoVerificacion?: string;
  tipoPersona: TipoPersona;
  razonSocialONombre: string;
  primerNombre?: string;
  otrosNombres?: string;
  primerApellido?: string;
  segundoApellido?: string;
  celularPrincipal: string;
  telefonoSecundario?: string;
  emailPrincipal?: string;
  emailFacturacion?: string;
  direccion?: string;
  municipioDane?: string;
  departamentoDane?: string;
  responsabilidadFiscal?: string;
  metadata?: string;
  activo: boolean;
  roles?: TerceroRol[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TerceroFormData {
  tipoDocumento: string;
  numeroDocumento: string;
  digitoVerificacion?: string;
  tipoPersona?: TipoPersona;
  razonSocialONombre: string;
  primerNombre?: string;
  otrosNombres?: string;
  primerApellido?: string;
  segundoApellido?: string;
  celularPrincipal: string;
  telefonoSecundario?: string;
  emailPrincipal?: string;
  emailFacturacion?: string;
  direccion?: string;
  municipioDane?: string;
  departamentoDane?: string;
  responsabilidadFiscal?: string;
  metadata?: string;
  roles?: TipoRolTercero[];
}
