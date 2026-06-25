export interface OfertaCreateRequest {
  metodoPagoId: number;
  tipoOperacion: "Compra" | "Venta";
  monedaTengo: string;
  monedaRecibo: string;
  cantidad: number;
}

export interface OfertaResponse {
  ofertaId: number;
  usuarioCreadorId: number;
  metodoPagoId: number;
  tipoOperacion: "Compra" | "Venta";
  monedaTengo: string;
  monedaRecibo: string;
  montoTengo: number;
  montoRecibo: number;
  tipoCambio: number;
  estado: string;
  fechaPublicacion: string;

  // Compatibilidad temporal
  moneda: string;
  montoTotal: number;
  montoMinimo: number;
  montoMaximo: number;
}

export interface OfferCommonItem {
  ofertaId: number;
  tipoOperacion: "Compra" | "Venta";
  monedaTengo: string;
  monedaRecibo: string;
  montoTengo: number;
  montoRecibo: number;
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
  usuarioCreador?: {
    usuarioId: number;
    nombres: string;
    apellidos: string;
    correo: string;
    calificacion: number;
    fotoPerfilUrl?: string | null;
  } | null;

  // Compatibilidad temporal
  moneda: string;
  montoTotal: number;
  montoMinimo: number;
  montoMaximo: number;
}

export interface GetOffersResponse {
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
  datos: OfferCommonItem[];
}

export interface GetMarketplaceOffersResponse {
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
  datos: OfferCommonItem[];
}

export type MatchedOferta = OfferCommonItem;
export type MatchesResponse = MatchedOferta[];

export interface OfertaUpdateRequest {
  cantidad: number;
}

export interface OfertaDetalleResponse {
  ofertaId: number;
  tipoOperacion: "Compra" | "Venta";
  monedaTengo: string;
  monedaRecibo: string;
  montoTengo: number;
  montoRecibo: number;
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

  // Compatibilidad temporal
  moneda: string;
  montoTotal: number;
  montoMinimo: number;
  montoMaximo: number;
}

export type UsuarioOfertasResponse = {
  ofertaId: number;
  tipoOperacion: "Compra" | "Venta";
  monedaTengo: string;
  monedaRecibo: string;
  montoTengo: number;
  montoRecibo: number;
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

  // Compatibilidad temporal
  moneda: string;
  montoTotal: number;
  montoMinimo: number;
  montoMaximo: number;
}[];

export interface ExchangeConvertResponse {
  from: string;
  to: string;
  amount: number;
  rate: number;
  convertedAmount: number;
}
