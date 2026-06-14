export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiracion: string;
  usuario: {
    usuarioId: number;
    nombres: string;
    apellidos: string;
    correo: string;
    rol: "Usuario" | "Administrador";
  };
}

export interface RegisterRequest {
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  confirmarPassword: string;
}

export interface RegisterResponse {
  mensaje: string;
  usuario: {
    usuarioId: number;
    nombres: string;
    apellidos: string;
    correo: string;
    rol: string;
    estado: string;
  };
}

export interface RecoverPasswordRequest {
  correo: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}
