import { Cliente } from './cliente';

export type CategoriaVehiculo = 'MOTO' | 'LIVIANO' | 'PESADO' | 'PUBLICO';

export interface Vehiculo {
  id: string;
  placa: string;
  categoria: CategoriaVehiculo;
  marca: string;
  linea: string;
  modelo: number;
  chasisVin?: string;
  fechaVencimientoSoat?: string;
  fechaVencimientoRtm?: string;
  soatVencido: boolean;
  rtmVencido: boolean;
  soatProximoVencer: boolean;
  rtmProximoVencer: boolean;
  propietario?: Cliente;
  createdAt: string;
}

export interface VehiculoFormData {
  placa: string;
  categoria: CategoriaVehiculo;
  marca: string;
  linea: string;
  modelo: number;
  chasisVin?: string;
  fechaVencimientoSoat?: string;
  fechaVencimientoRtm?: string;
  propietarioId?: string;
}
