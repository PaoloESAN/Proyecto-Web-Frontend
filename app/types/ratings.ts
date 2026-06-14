export interface CalificacionCreateRequest {
  transaccionId: number;
  puntaje: number;
  comentario?: string;
}

export interface CalificacionResponse {
  mensaje: string;
  calificacion: {
    calificacionId: number;
    transaccionId: number;
    puntaje: number;
    comentario: string | null;
    fechaCalificacion: string;
  };
}
