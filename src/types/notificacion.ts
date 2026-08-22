export interface Notificacion {
  id: string;
  tipo: string;
  canal: string;
  destinatario: string;
  asunto?: string;
  cuerpoPayload: string;
  estado: 'PENDIENTE' | 'ENVIADO' | 'FALLIDO';
  intentos: number;
  fechaProgramada: string;
  fechaEnviado?: string;
  clienteNombre?: string;
  createdAt: string;
}
