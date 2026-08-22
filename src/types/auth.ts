export type TipoDocumento = 'CC' | 'CE' | 'NIT' | 'TI' | 'PASAPORTE' | 'PPT' | 'PEP' | 'RC';

export type RolUsuario = 'ADMINISTRADOR' | 'DIRECTOR_TECNICO' | 'RECEPCIONISTA' | 'TECNICO_PISTA' | 'CAJERO' | 'OPERATIVO';

export interface User {
  id: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombresApellidos: string;
  rol: RolUsuario;
  activo?: boolean;
  ultimoLogin?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  numeroDocumento: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  id: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombresApellidos: string;
  rol: RolUsuario;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
