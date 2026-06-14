export interface UserProfileResponse {
  usuarioId: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  rol: string;
  estado: string;
  fechaRegistro: string;
}

export interface UpdateProfileRequest {
  nombres: string;
  telefono: string;
}

export interface UpdateProfileResponse {
  mensaje: string;
  usuario: {
    usuarioId: number;
    nombres: string;
    apellidos: string;
    correo: string;
    telefono: string;
    rol: string;
  };
}

export interface MetodoPagoResponse {
  metodoPagoId: number;
  banco: string;
  numeroCuenta: string;
  nombreTitular: string;
  tipoMoneda: string;
  estado: string;
  fechaCreacion: string;
}

export interface MetodoPagoCreateRequest {
  banco: string;
  numeroCuenta: string;
  nombreTitular: string;
  tipoMoneda: string;
}

export interface MetodoPagoCreateResponse {
  mensaje: string;
  metodoPago: {
    metodoPagoId: number;
    banco: string;
    numeroCuenta: string;
    nombreTitular: string;
    tipoMoneda: string;
    estado: string;
    fechaCreacion: string;
  };
}

export interface VerifyIdentityResponse {
  mensaje: string;
  dniFrontalUrl: string;
  dniPosteriorUrl: string;
}
