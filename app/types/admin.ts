export interface GetUsersAdminResponse {
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
  datos: {
    usuarioId: number;
    nombres: string;
    apellidos: string;
    correo: string;
    rol: string;
    estado: string;
    fechaRegistro: string;
    esVerificado: boolean;
  }[];
}

export interface UpdateUserStatusRequest {
  estado: "Activo" | "Suspendido" | "Bloqueado";
}

export interface UpdateUserStatusResponse {
  mensaje: string;
  usuario: {
    usuarioId: number;
    nombres: string;
    apellidos: string;
    correo: string;
    estado: string;
  };
}

export interface GetDisputesAdminResponse {
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
  datos: {
    disputaId: number;
    estado: "Abierta" | "Resuelta";
    resolucion: string | null;
    fechaApertura: string;
    fechaCierre: string | null;
    transaccion: {
      transaccionId: number;
      montoOperacion: number;
      tipoCambioAplicado: number;
      estadoTx: string;
      fechaInicio: string;
      comprador: {
        usuarioId: number;
        nombres: string;
        apellidos: string;
        correo: string;
      };
      vendedor: {
        usuarioId: number;
        nombres: string;
        apellidos: string;
        correo: string;
      };
      comprobantes: {
        comprobanteId: number;
        imagenUrl: string;
        fechaSubida: string;
      }[];
    };
    usuarioReportador: {
      usuarioId: number;
      nombres: string;
      apellidos: string;
      correo: string;
    };
  }[];
}

export interface ResolveDisputeRequest {
  resolucion: "A favor del comprador" | "A favor del vendedor";
}

export interface ResolveDisputeResponse {
  mensaje: string;
  disputa: {
    disputaId: number;
    estado: "Resuelta";
    resolucion: "A favor del comprador" | "A favor del vendedor";
    fechaApertura: string;
    fechaCierre: string;
  };
  transaccion: {
    transaccionId: number;
    estado: "Cancelado" | "Finalizado";
  };
  oferta: {
    ofertaId: number;
    estado: "Activa" | string;
  };
}
