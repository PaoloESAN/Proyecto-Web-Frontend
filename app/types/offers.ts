export interface OfertaCreateRequest {
  metodoPagoId: number;
  tipoOperacion: "Compra" | "Venta";
  moneda: string;
  montoTotal: number;
  montoMinimo: number;
  montoMaximo: number;
  tipoCambio: number;
}

export interface OfertaResponse {
  ofertaId: number;
  usuarioCreadorId: number;
  metodoPagoId: number;
  tipoOperacion: "Compra" | "Venta";
  moneda: string;
  montoTotal: number;
  montoMinimo: number;
  montoMaximo: number;
  tipoCambio: number;
  estado: string;
  fechaPublicacion: string;
}

export interface GetOffersResponse {
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
  datos: {
    ofertaId: number;
    tipoOperacion: "Compra" | "Venta";
    moneda: string;
    montoTotal: number;
    montoMinimo: number;
    montoMaximo: number;
    tipoCambio: number;
    estado: string;
    fechaPublicacion: string;
    metodoPago: {
      metodoPagoId: number;
      banco: string;
      nombreTitular: string;
      numeroCuenta: string;
      tipoMoneda: string;
    };
    usuarioCreador: {
      usuarioId: number;
      nombres: string;
      apellidos: string;
      correo: string;
      calificacion: number;
    };
  }[];
}

export interface MatchedOferta {
  ofertaId: number;
  tipoOperacion: string;
  moneda: string;
  montoTotal: number;
  montoMinimo: number;
  montoMaximo: number;
  tipoCambio: number;
  estado: string;
  fechaPublicacion: string;
  metodoPago: {
    metodoPagoId: number;
    banco: string;
    nombreTitular: string;
    numeroCuenta: string;
    tipoMoneda: string;
  };
  usuarioCreador: {
    usuarioId: number;
    nombres: string;
    apellidos: string;
    correo: string;
    calificacion: number;
  };
}

export type MatchesResponse = MatchedOferta[];

export interface OfertaUpdateRequest {
  monto_total: number;
  monto_minimo: number;
  monto_maximo: number;
  tipo_cambio: number;
}

export interface OfertaDetalleResponse {
  ofertaId: number;
  tipoOperacion: "Compra" | "Venta";
  moneda: string;
  montoTotal: number;
  montoMinimo: number;
  montoMaximo: number;
  tipoCambio: number;
  estado: string;
  fechaPublicacion: string;
  metodoPago: {
    metodoPagoId: number;
    banco: string;
    nombreTitular: string;
    numeroCuenta: string;
    tipoMoneda: string;
  } | null;
  usuarioCreador: {
    usuarioId: number;
    nombres: string;
    apellidos: string;
    correo: string;
    calificacion: number;
  } | null;
}

export type UsuarioOfertasResponse = {
  ofertaId: number;
  tipoOperacion: "Compra" | "Venta";
  moneda: string;
  montoTotal: number;
  montoMinimo: number;
  montoMaximo: number;
  tipoCambio: number;
  estado: string; // "Activa" | "En Proceso"
  fechaPublicacion: string;
  metodoPago: {
    metodoPagoId: number;
    banco: string;
    nombreTitular: string;
    numeroCuenta: string;
    tipoMoneda: string;
  } | null;
}[];
