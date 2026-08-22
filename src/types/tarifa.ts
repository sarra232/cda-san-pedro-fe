import { CategoriaVehiculo } from './vehiculo';

export interface Tarifa {
  id: string;
  codigo?: string;
  categoria: CategoriaVehiculo;
  tipoServicio?: string;
  nombreServicio: string;
  descripcion?: string;
  precio: number;
  ivaPorcentaje?: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TarifaCreateRequest {
  codigo?: string;
  categoria: CategoriaVehiculo;
  tipoServicio?: string;
  nombreServicio: string;
  descripcion?: string;
  precio: number;
  ivaPorcentaje?: number;
  activo?: boolean;
}

export interface TarifaUpdateRequest {
  codigo?: string;
  categoria?: CategoriaVehiculo;
  tipoServicio?: string;
  nombreServicio: string;
  descripcion?: string;
  precio: number;
  ivaPorcentaje?: number;
  activo?: boolean;
}
