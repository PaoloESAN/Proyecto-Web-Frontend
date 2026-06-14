export interface AlertaCreateRequest {
  moneda: string;
  tipoCambioDeseado: number;
}

export interface AlertaCreateResponse {
  mensaje: string;
}

export interface AlertaResponse {
  alertaId: number;
  usuarioId: number;
  moneda: string;
  tipoCambioDeseado: number;
  estado: "Activa" | "Inactiva";
  fechaCreacion: string;
}
