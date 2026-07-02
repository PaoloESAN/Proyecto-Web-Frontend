export interface TransaccionCreateRequest {
  ofertaId: number;
  metodoPagoParticipanteId: number;
}

export interface TransaccionCreateResponse {
  mensaje: string;
  transaccion: {
    transaccionId: number;
    ofertaId: number;
    usuarioCompradorId: number;
    usuarioVendedorId: number;
    metodoPagoParticipanteId: number;
    montoTengo: number;
    montoRecibo: number;
    tipoCambioAplicado: number;
    estado: "Pendiente";
    fechaInicio: string;
    fechaActualizacion: string;

    // Compatibilidad temporal
    metodoPagoCompradorId?: number;
    montoOperacion?: number;
  };
}

export interface TransaccionHistoryResponse {
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
  datos: {
    transaccionId: number;
    ofertaId: number;
    tipoOperacion: "Compra" | "Venta";
    monedaTengo: string;
    monedaRecibo: string;
    montoTengo: number;
    montoRecibo: number;
    tipoCambioAplicado: number;
    estado: string;
    fechaInicio: string;
    fechaActualizacion: string;
    miRol: "Comprador" | "Vendedor";
    contraparte: {
      usuarioId: number;
      nombres: string;
      apellidos: string;
    };
    yaCalificado: boolean;

    // Compatibilidad temporal
    moneda?: string;
    montoOperacion?: number;
  }[];
}

export interface TransaccionDetailResponse {
  transaccionId: number;
  ofertaId: number;
  monedaTengo: string;
  monedaRecibo: string;
  montoTengo: number;
  montoRecibo: number;
  tipoCambioAplicado: number;
  estado: string;
  fechaInicio: string;
  fechaActualizacion: string;
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
  instruccionesPago: {
    banco: string;
    numeroCuenta: string;
    nombreTitular: string;
    tipoMoneda: string;
  };
  metodoPagoParticipante?: {
    banco: string;
    numeroCuenta: string;
    nombreTitular: string;
    tipoMoneda: string;
  } | null;
  comprobantes?: ComprobanteDetail[];
  confirmadoComprador: boolean;
  confirmadoVendedor: boolean;
  yaCalificado: boolean;

  // Compatibilidad temporal
  montoOperacion?: number;
  metodoPagoComprador?: {
    banco: string;
    numeroCuenta: string;
    nombreTitular: string;
    tipoMoneda: string;
  } | null;
}

export interface ComprobanteDetail {
  comprobanteId: number;
  usuarioId: number;
  imagenUrl: string;
  fechaSubida: string;
}

export interface MensajeChatResponse {
  mensajeId: number;
  transaccionId: number;
  remitenteId: number;
  contenido: string;
  fechaEnvio: string;
}

export interface ConfirmReceiptResponse {
  mensaje: string;
  transaccionId: number;
  estado: string;
  confirmadoComprador: boolean;
  confirmadoVendedor: boolean;
  fechaActualizacion: string;
}

export interface OpenDisputeResponse {
  mensaje: string;
  disputa: {
    disputaId: number;
    transaccionId: number;
    estado: "Abierta";
    fechaApertura: string;
  };
}

export interface UploadVoucherResponse {
  mensaje: string;
  urlVoucher: string;
  estado: "En Proceso";
}
