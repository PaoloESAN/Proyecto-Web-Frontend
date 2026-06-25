<script setup lang="ts">
import * as z from "zod";
import * as signalR from "@microsoft/signalr";
import type { FormSubmitEvent } from "@nuxt/ui";
import type {
  TransaccionDetailResponse,
  MensajeChatResponse,
  ConfirmReceiptResponse,
  OpenDisputeResponse,
  CalificacionResponse,
  ErrorResponse,
  MetodoPagoResponse,
} from "~/types";

definePageMeta({
  middleware: ["auth"],
  title: "Sala de Transacción",
  back: "/history",
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const api = useApi();
const authStore = useAuthStore();

const transactionId = Number(route.params.id);
const selectedAccountId = Number(route.query.accountId);

const loading = ref(true);
const transaction = ref<TransaccionDetailResponse | null>(null);
const messages = ref<MensajeChatResponse[]>([]);
const errorMsg = ref<string | null>(null);

// Control de estados
const confirmingReceipt = ref(false);
const openingDispute = ref(false);
const showDisputeModal = ref(false);
const submittingRating = ref(false);
const ratingSubmitted = ref(false);

// Voucher upload state
const voucherFile = ref<File | null>(null);
const uploadingVoucher = ref(false);
const voucherPreview = ref<string | null>(null);

// Chat state
const newMessage = ref("");
const sendingMessage = ref(false);
const chatContainer = ref<HTMLElement | null>(null);
const signalrState = ref<
  "disconnected" | "connecting" | "connected" | "reconnecting"
>("disconnected");
let connection: signalR.HubConnection | null = null;

// Rating state
const ratingState = reactive({
  puntaje: 5,
  comentario: "",
});

const ratingSchema = z.object({
  puntaje: z.number().min(1, "Selecciona al menos 1 estrella").max(5),
  comentario: z
    .string()
    .max(500, "El comentario no puede exceder los 500 caracteres")
    .optional(),
});

type RatingSchema = z.output<typeof ratingSchema>;

// Determinar roles
const isBuyer = computed(() => {
  if (!transaction.value || !authStore.usuario) return false;
  return transaction.value.comprador.usuarioId === authStore.usuario.usuarioId;
});

const isSeller = computed(() => {
  if (!transaction.value || !authStore.usuario) return false;
  return transaction.value.vendedor.usuarioId === authStore.usuario.usuarioId;
});

const contraparte = computed(() => {
  if (!transaction.value) return null;
  return isBuyer.value
    ? transaction.value.vendedor
    : transaction.value.comprador;
});

// Cargar transacción y oferta asociada
async function fetchTransaction() {
  loading.value = true;
  errorMsg.value = null;
  try {
    const response = await api<TransaccionDetailResponse>(
      `/api/transacciones/${transactionId}`,
    );
    transaction.value = response;
    ratingSubmitted.value = response.yaCalificado || false;


  } catch (err: any) {
    if (err.status === 404) {
      errorMsg.value = "La transacción especificada no existe.";
    } else if (err.status === 403) {
      errorMsg.value = "No tienes permiso para acceder a esta transacción.";
    } else {
      errorMsg.value = "Ocurrió un error al cargar la transacción.";
    }
  } finally {
    loading.value = false;
  }
}

async function fetchMessages() {
  try {
    const response = await api<MensajeChatResponse[]>(
      `/api/transacciones/${transactionId}/messages`,
    );
    messages.value = response;
    nextTick(scrollChatToBottom);
  } catch (err) {
    console.error("Error al cargar los mensajes del chat:", err);
  }
}

function scrollChatToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
}

// Conectar SignalR
function connectSignalR() {
  const config = useRuntimeConfig();
  signalrState.value = "connecting";

  const tokenVal = useCookie("auth_token").value;
  console.log(
    "[SignalR CLIENT] Intentando conectar a:",
    `${config.public.apiBase}/api/chat`,
  );
  console.log(
    "[SignalR CLIENT] Valor de cookie auth_token:",
    tokenVal ? `Presente (L: ${tokenVal.length})` : "Ausente/Nulo",
  );

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${config.public.apiBase}/api/chat`, {
      accessTokenFactory: () => {
        const token = useCookie("auth_token").value;
        console.log(
          "[SignalR CLIENT] accessTokenFactory invocada. Token retornado:",
          token ? `Presente (L: ${token.length})` : "Nulo/Vacío",
        );
        return token || "";
      },
    })
    .withAutomaticReconnect()
    .build();

  connection.on("ReceiveMessage", (message: MensajeChatResponse) => {
    console.log("[SignalR CLIENT] Evento 'ReceiveMessage' recibido:", message);
    if (!messages.value.some((m) => m.mensajeId === message.mensajeId)) {
      messages.value.push(message);
      nextTick(scrollChatToBottom);
    }
  });

  connection.onreconnecting((err) => {
    console.warn("[SignalR CLIENT] Conexión reconectando...", err);
    signalrState.value = "reconnecting";
  });

  connection.onreconnected((connectionId) => {
    console.log(
      "[SignalR CLIENT] Conexión reconectada. ConnectionId:",
      connectionId,
    );
    signalrState.value = "connected";
    connection
      ?.invoke("JoinRoom", String(transactionId))
      .then(() =>
        console.log(`[SignalR CLIENT] Re-unido a la sala ${transactionId}`),
      )
      .catch((err) =>
        console.error("[SignalR CLIENT] Error al re-unirse a la sala:", err),
      );
  });

  connection.onclose((err) => {
    console.error("[SignalR CLIENT] Conexión cerrada.", err);
    signalrState.value = "disconnected";
  });

  connection
    .start()
    .then(async () => {
      console.log(
        "[SignalR CLIENT] Conexión iniciada con éxito. Estado:",
        connection?.state,
      );
      signalrState.value = "connected";
      await connection?.invoke("JoinRoom", String(transactionId));
      console.log(
        `[SignalR CLIENT] Unido con éxito a la sala de transacción ${transactionId}`,
      );
    })
    .catch((err) => {
      signalrState.value = "disconnected";
      console.error(
        "[SignalR CLIENT] Error fatal al iniciar conexión SignalR:",
        err,
      );
    });
}

function disconnectSignalR() {
  if (connection) {
    connection
      .stop()
      .then(() => {
        console.log("[SignalR CLIENT] Desconectado con éxito");
      })
      .catch(console.error);
    connection = null;
  }
}

// Enviar mensaje en el chat
async function sendChatMessage() {
  if (!newMessage.value.trim() || sendingMessage.value) return;
  const content = newMessage.value.trim();
  newMessage.value = "";
  sendingMessage.value = true;

  console.log(
    `[SignalR CLIENT] Enviando mensaje a sala ${transactionId}: "${content}"`,
  );
  try {
    if (connection && signalrState.value === "connected") {
      await connection.invoke("SendMessage", String(transactionId), content);
      console.log(
        "[SignalR CLIENT] Mensaje enviado a través de connection.invoke('SendMessage')",
      );
    } else {
      console.warn(
        "[SignalR CLIENT] Intento de envío fallido: sin conexión. Estado actual:",
        signalrState.value,
      );
      toast.add({
        title: "Chat sin conexión",
        description: "Reconectando con el chat en tiempo real...",
        color: "warning",
      });
      connectSignalR();
    }
  } catch (err) {
    console.error("[SignalR CLIENT] Error al enviar mensaje:", err);
    toast.add({
      title: "Error de envío",
      description: "No se pudo enviar el mensaje. Inténtalo de nuevo.",
      color: "error",
    });
  } finally {
    sendingMessage.value = false;
  }
}

// Lógica de roles financieros
const participantPaymentMethod = computed(() => {
  if (!transaction.value) return null;
  return (
    transaction.value.metodoPagoParticipante ||
    transaction.value.metodoPagoComprador ||
    null
  );
});

const destinationAccount = computed(() => {
  if (!transaction.value) return null;
  return isBuyer.value
    ? transaction.value.instruccionesPago
    : participantPaymentMethod.value;
});

const myReceivingAccount = computed(() => {
  if (!transaction.value) return null;
  return isBuyer.value
    ? participantPaymentMethod.value
    : transaction.value.instruccionesPago;
});

const hasConfirmed = computed(() => {
  if (!transaction.value) return false;
  return isBuyer.value
    ? transaction.value.confirmadoComprador
    : transaction.value.confirmadoVendedor;
});

const contraparteConfirmed = computed(() => {
  if (!transaction.value) return false;
  return isBuyer.value
    ? transaction.value.confirmadoVendedor
    : transaction.value.confirmadoComprador;
});

function getAmountByCurrency(currency: string): number {
  if (!transaction.value) return 0;

  if (currency === transaction.value.monedaTengo) {
    return Number(transaction.value.montoTengo ?? transaction.value.montoOperacion ?? 0);
  }

  if (currency === transaction.value.monedaRecibo) {
    const montoRecibo = transaction.value.montoRecibo;
    if (typeof montoRecibo === "number") return Number(montoRecibo);

    return Number(
      ((transaction.value.montoOperacion ?? 0) * transaction.value.tipoCambioAplicado).toFixed(2),
    );
  }

  return 0;
}

const exactAmountToSend = computed(() => {
  if (!destinationAccount.value) return { amount: 0, currency: "" };

  const currency = destinationAccount.value.tipoMoneda;
  return {
    amount: getAmountByCurrency(currency),
    currency,
  };
});

const exactAmountToReceive = computed(() => {
  if (!myReceivingAccount.value) return { amount: 0, currency: "" };

  const currency = myReceivingAccount.value.tipoMoneda;
  return {
    amount: getAmountByCurrency(currency),
    currency,
  };
});

// Confirmar recepción del dinero (Solo Vendedor)
async function confirmReceipt() {
  confirmingReceipt.value = true;
  try {
    const res = await api<ConfirmReceiptResponse>(
      `/api/transacciones/${transactionId}/confirm`,
      {
        method: "POST",
      },
    );

    const finalizada = res?.estado === "Finalizado";

    toast.add({
      title: finalizada ? "Transacción finalizada" : "Pago confirmado",
      description: finalizada
        ? "Ambas partes confirmaron. La transacción se cerró correctamente."
        : "Tu confirmación fue registrada. Falta la confirmación de la contraparte.",
      color: "success",
      icon: "i-lucide-check-circle",
    });

    await fetchTransaction();
  } catch (err: any) {
    const errorData = err.data as ErrorResponse | undefined;
    toast.add({
      title: "Error al confirmar",
      description: errorData?.mensaje || "No se pudo registrar la confirmación.",
      color: "error",
    });
  } finally {
    confirmingReceipt.value = false;
  }
}

// Abrir disputa - mostrar confirmación
function openDispute() {
  showDisputeModal.value = true;
}

// Confirmar e iniciar disputa
async function confirmOpenDispute() {
  showDisputeModal.value = false;
  openingDispute.value = true;
  try {
    await api<OpenDisputeResponse>(
      `/api/transacciones/${transactionId}/dispute`,
      {
        method: "POST",
      },
    );
    toast.add({
      title: "Disputa Iniciada",
      description:
        "Se ha abierto una disputa. El equipo de administración revisará el caso.",
      color: "warning",
      icon: "i-lucide-alert-triangle",
    });
    await fetchTransaction();
  } catch (err: any) {
    const errorData = err.data as ErrorResponse | undefined;
    toast.add({
      title: "Error al abrir disputa",
      description: errorData?.mensaje || "No se pudo abrir la disputa.",
      color: "error",
    });
  } finally {
    openingDispute.value = false;
  }
}

// Enviar Calificación
async function submitRating(event: FormSubmitEvent<RatingSchema>) {
  submittingRating.value = true;
  try {
    await api<CalificacionResponse>("/api/calificaciones", {
      method: "POST",
      body: {
        transaccionId: transactionId,
        puntaje: event.data.puntaje,
        comentario: event.data.comentario || undefined,
      },
    });
    toast.add({
      title: "Calificación enviada",
      description: "¡Gracias por valorar a la contraparte!",
      color: "success",
      icon: "i-lucide-check-circle",
    });
    ratingSubmitted.value = true;
  } catch (err: any) {
    const errorData = err.data as ErrorResponse | undefined;
    toast.add({
      title: "Error",
      description:
        errorData?.mensaje ||
        "No se pudo enviar la calificación. Tal vez ya calificaste o la transacción no finalizó.",
      color: "error",
    });
  } finally {
    submittingRating.value = false;
  }
}

// Lógica de carga de voucher
function onVoucherSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: "Archivo demasiado grande",
      description: "El comprobante debe pesar menos de 5MB.",
      color: "warning",
    });
    return;
  }

  if (file.type !== "image/jpeg" && file.type !== "image/png") {
    toast.add({
      title: "Formato no soportado",
      description: "Solo se admiten imágenes en formato JPG o PNG.",
      color: "warning",
    });
    return;
  }

  voucherFile.value = file;
  voucherPreview.value = URL.createObjectURL(file);
}

function removeVoucher() {
  voucherFile.value = null;
  voucherPreview.value = null;
}

async function uploadVoucher() {
  if (!voucherFile.value) return;
  uploadingVoucher.value = true;

  try {
    const formData = new FormData();
    formData.append("file", voucherFile.value);

    await api<any>(`/api/transacciones/${transactionId}/voucher`, {
      method: "POST",
      body: formData,
    });

    toast.add({
      title: "Voucher subido",
      description:
        "El comprobante de pago fue subido y la transacción pasó a estado 'Pagado'.",
      color: "success",
      icon: "i-lucide-check-circle",
    });

    removeVoucher();
    await fetchTransaction();
  } catch (err: any) {
    const errorData = err.data as ErrorResponse | undefined;
    toast.add({
      title: "Error al subir voucher",
      description:
        errorData?.mensaje || "Hubo un inconveniente al cargar el comprobante.",
      color: "error",
    });
  } finally {
    uploadingVoucher.value = false;
  }
}

// Comprobantes filtrados por rol
const buyerVoucher = computed(() => {
  if (!transaction.value || !transaction.value.comprobantes) return null;
  return (
    transaction.value.comprobantes.find(
      (c) => c.usuarioId === transaction.value!.comprador.usuarioId,
    ) || null
  );
});

const sellerVoucher = computed(() => {
  if (!transaction.value || !transaction.value.comprobantes) return null;
  return (
    transaction.value.comprobantes.find(
      (c) => c.usuarioId === transaction.value!.vendedor.usuarioId,
    ) || null
  );
});

const myVoucher = computed(() => {
  return isBuyer.value ? buyerVoucher.value : sellerVoucher.value;
});

const contraparteVoucher = computed(() => {
  return isBuyer.value ? sellerVoucher.value : buyerVoucher.value;
});

const canUploadVoucher = computed(() => {
  if (!transaction.value) return false;
  if (myVoucher.value !== null) return false;
  return (
    transaction.value.estado === "Pendiente" ||
    transaction.value.estado === "Pagado"
  );
});

// Formatear fechas
function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Formatear monedas
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Configuración del SignalR & Datos al cargar
onMounted(() => {
  fetchTransaction();
  fetchMessages();
  connectSignalR();
});

onBeforeUnmount(() => {
  disconnectSignalR();
});
</script>

<template>
  <div
    class="min-h-dvh bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50"
  >
    <!-- Content -->
    <main class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Encabezado de la Transacción -->
      <div v-if="transaction" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            Sala de Transacción
            <span class="font-mono text-sm px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-md">
              #{{ transactionId }}
            </span>
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <UBadge
            v-if="transaction.estado === 'Pendiente'"
            color="warning"
            variant="subtle"
            class="font-bold uppercase tracking-wider text-[10px]"
          >
            <UIcon name="i-lucide-clock" class="mr-1 animate-pulse" />
            Pendiente
          </UBadge>
          <UBadge
            v-else-if="transaction.estado === 'Pagado'"
            color="primary"
            variant="subtle"
            class="font-bold uppercase tracking-wider text-[10px]"
          >
            <UIcon name="i-lucide-wallet" class="mr-1" />
            Pagado
          </UBadge>
          <UBadge
            v-else-if="transaction.estado === 'Finalizado'"
            color="success"
            variant="subtle"
            class="font-bold uppercase tracking-wider text-[10px]"
          >
            <UIcon name="i-lucide-check-circle-2" class="mr-1" />
            Finalizado
          </UBadge>
          <UBadge
            v-else-if="transaction.estado === 'Disputa'"
            color="error"
            variant="subtle"
            class="font-bold uppercase tracking-wider text-[10px]"
          >
            <UIcon name="i-lucide-alert-triangle" class="mr-1 animate-bounce" />
            En Disputa
          </UBadge>
          <UBadge
            v-else
            color="neutral"
            variant="subtle"
            class="font-bold uppercase tracking-wider text-[10px]"
          >
            <UIcon name="i-lucide-ban" class="mr-1" />
            Cancelado
          </UBadge>
        </div>
      </div>
      <!-- Loading State -->
      <div v-if="loading" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-6">
            <USkeleton class="h-48 w-full rounded-2xl" />
            <USkeleton class="h-64 w-full rounded-2xl" />
          </div>
          <div class="space-y-6">
            <USkeleton class="h-32 w-full rounded-2xl" />
            <USkeleton class="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMsg" class="max-w-xl mx-auto py-12 text-center">
        <div class="p-4 bg-error/10 text-error rounded-2xl inline-block mb-4">
          <UIcon name="i-lucide-alert-circle" class="size-10" />
        </div>
        <h2 class="text-xl font-bold text-neutral-900 dark:text-white mb-2">
          Acceso no permitido
        </h2>
        <p class="text-neutral-500 dark:text-neutral-400 mb-6">
          {{ errorMsg }}
        </p>
        <UButton
          label="Volver al Historial"
          color="neutral"
          icon="i-lucide-arrow-left"
          class="cursor-pointer"
          @click="navigateTo('/history')"
        />
      </div>

      <!-- Main Layout -->
      <div
        v-else-if="transaction"
        class="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        <!-- Columna Izquierda: Información de transacción y flujo -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Stepper Visual -->
          <div
            class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm"
          >
            <h2
              class="text-xs font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase mb-4"
            >
              Progreso del Intercambio
            </h2>
            <div class="grid grid-cols-3 gap-2 relative">
              <!-- Paso 1 -->
              <div class="flex flex-col items-center text-center space-y-1.5">
                <div
                  class="size-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors"
                  :class="[
                    transaction.estado === 'Pendiente'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-transparent',
                    ['Pagado', 'Finalizado', 'Disputa'].includes(
                      transaction.estado,
                    )
                      ? 'bg-emerald-500 text-white border-transparent'
                      : '',
                  ]"
                >
                  <UIcon
                    v-if="
                      ['Pagado', 'Finalizado', 'Disputa'].includes(
                        transaction.estado,
                      )
                    "
                    name="i-lucide-check"
                    class="size-4"
                  />
                  <span v-else>1</span>
                </div>
                <span
                  class="text-xs font-bold"
                  :class="
                    transaction.estado === 'Pendiente'
                      ? 'text-amber-500'
                      : 'text-neutral-400'
                  "
                  >Pago Pendiente</span
                >
              </div>

              <!-- Paso 2 -->
              <div class="flex flex-col items-center text-center space-y-1.5">
                <div
                  class="size-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors"
                  :class="[
                    transaction.estado === 'Pagado'
                      ? 'bg-primary/10 text-primary border-primary'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-transparent',
                    transaction.estado === 'Finalizado'
                      ? 'bg-emerald-500 text-white border-transparent'
                      : '',
                    transaction.estado === 'Disputa'
                      ? 'bg-red-500 text-white border-transparent'
                      : '',
                  ]"
                >
                  <UIcon
                    v-if="transaction.estado === 'Finalizado'"
                    name="i-lucide-check"
                    class="size-4"
                  />
                  <UIcon
                    v-else-if="transaction.estado === 'Disputa'"
                    name="i-lucide-alert-triangle"
                    class="size-4"
                  />
                  <span v-else>2</span>
                </div>
                <span
                  class="text-xs font-bold"
                  :class="
                    transaction.estado === 'Pagado'
                      ? 'text-primary'
                      : 'text-neutral-400'
                  "
                >
                  {{
                    transaction.estado === "Disputa" ? "Disputa" : "Verificando"
                  }}
                </span>
              </div>

              <!-- Paso 3 -->
              <div class="flex flex-col items-center text-center space-y-1.5">
                <div
                  class="size-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors"
                  :class="[
                    transaction.estado === 'Finalizado'
                      ? 'bg-emerald-500 text-white border-transparent'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-transparent',
                    transaction.estado === 'Cancelado'
                      ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-500'
                      : '',
                  ]"
                >
                  <span v-if="transaction.estado === 'Cancelado'">❌</span>
                  <UIcon
                    v-else-if="transaction.estado === 'Finalizado'"
                    name="i-lucide-party-popper"
                    class="size-4"
                  />
                  <span v-else>3</span>
                </div>
                <span
                  class="text-xs font-bold"
                  :class="
                    transaction.estado === 'Finalizado'
                      ? 'text-emerald-500'
                      : 'text-neutral-400'
                  "
                  >Finalizado</span
                >
              </div>
            </div>
          </div>

          <!-- Acciones de Flujo de Pago -->
          <div
            class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-6"
          >
            <!-- CASO: ESTADO PENDIENTE O PAGADO -->
            <div
              v-if="
                transaction.estado === 'Pendiente' ||
                transaction.estado === 'Pagado'
              "
              class="space-y-6"
            >
              <!-- Alerta informativa -->
              <div
                class="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3"
              >
                <UIcon
                  name="i-lucide-info"
                  class="text-primary size-5 shrink-0 mt-0.5"
                />
                <div>
                  <h3
                    class="text-sm font-bold text-primary-800 dark:text-primary-400"
                  >
                    Instrucciones de pago
                  </h3>
                  <p
                    class="text-xs text-primary-700/90 dark:text-primary-400/90 mt-1 flex flex-col gap-1"
                  >
                    <span
                      >1. Transfiere el monto a la cuenta bancaria de destino de
                      la contraparte.</span
                    >
                    <span
                      >2. Sube el voucher de pago para que la contraparte lo
                      verifique.</span
                    >
                    <span
                      >3. Una vez verificado el pago que recibiste, presiona
                      "Confirmar Pago Correcto".</span
                    >
                  </p>
                </div>
              </div>

              <!-- Resumen de Envío y Recepción Exacto -->
              <div
                class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/20 rounded-xl"
              >
                <div class="space-y-1">
                  <span
                    class="text-xs text-neutral-500 font-bold uppercase tracking-wider block"
                    >Debes Enviar Exactamente</span
                  >
                  <span
                    class="text-2xl font-black text-rose-500 flex items-baseline gap-1 mt-0.5"
                  >
                    {{ formatCurrency(exactAmountToSend.amount) }}
                    <span class="text-sm font-bold">{{
                      exactAmountToSend.currency
                    }}</span>
                  </span>
                </div>
                <div
                  class="space-y-1 sm:text-right border-t sm:border-t-0 sm:border-l border-neutral-200/50 dark:border-neutral-800/50 pt-3 sm:pt-0 sm:pl-4"
                >
                  <span
                    class="text-xs text-neutral-500 font-bold uppercase tracking-wider block"
                    >Debes Recibir Exactamente</span
                  >
                  <span
                    class="text-2xl font-black text-emerald-500 flex items-baseline gap-1 sm:justify-end mt-0.5"
                  >
                    {{ formatCurrency(exactAmountToReceive.amount) }}
                    <span class="text-sm font-bold">{{
                      exactAmountToReceive.currency
                    }}</span>
                  </span>
                </div>
              </div>

              <!-- Cuentas Bancarias de Intercambio -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Cuenta Destino (A donde envías el pago) -->
                <div
                  class="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30"
                >
                  <h4
                    class="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5"
                  >
                    <UIcon
                      name="i-lucide-arrow-up-right"
                      class="text-rose-500"
                    />
                    Cuenta Destino (Enviar Pago)
                  </h4>
                  <div
                    v-if="destinationAccount"
                    class="grid grid-cols-2 gap-3 text-sm"
                  >
                    <div>
                      <span class="text-xs text-neutral-500 block">Banco</span>
                      <span
                        class="font-bold text-neutral-800 dark:text-neutral-200"
                        >{{ destinationAccount.banco }}</span
                      >
                    </div>
                    <div>
                      <span class="text-xs text-neutral-500 block"
                        >Moneda de Cuenta</span
                      >
                      <span
                        class="font-bold text-neutral-800 dark:text-neutral-200"
                        >{{ destinationAccount.tipoMoneda }}</span
                      >
                    </div>
                    <div class="col-span-2">
                      <span class="text-xs text-neutral-500 block"
                        >Número de Cuenta</span
                      >
                      <span
                        class="font-mono font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-sm select-all"
                      >
                        {{ destinationAccount.numeroCuenta }}
                      </span>
                    </div>
                    <div class="col-span-2">
                      <span class="text-xs text-neutral-500 block"
                        >Titular de la Cuenta</span
                      >
                      <span
                        class="font-bold text-neutral-800 dark:text-neutral-200"
                        >{{ destinationAccount.nombreTitular }}</span
                      >
                    </div>
                  </div>
                  <div v-else class="p-6 text-center text-xs text-neutral-400">
                    <UIcon
                      name="i-lucide-hourglass"
                      class="animate-spin mr-1.5"
                    />
                    Esperando que la contraparte registre su método de pago...
                  </div>
                </div>

                <!-- Tu Cuenta Receptora (Donde recibes el pago) -->
                <div
                  class="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30"
                >
                  <h4
                    class="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5"
                  >
                    <UIcon
                      name="i-lucide-arrow-down-left"
                      class="text-emerald-500"
                    />
                    Tu Cuenta de Recepción (Recibir Pago)
                  </h4>
                  <div
                    v-if="myReceivingAccount"
                    class="grid grid-cols-2 gap-3 text-sm"
                  >
                    <div>
                      <span class="text-xs text-neutral-500 block">Banco</span>
                      <span
                        class="font-bold text-neutral-800 dark:text-neutral-200"
                        >{{ myReceivingAccount.banco }}</span
                      >
                    </div>
                    <div>
                      <span class="text-xs text-neutral-500 block"
                        >Moneda de Cuenta</span
                      >
                      <span
                        class="font-bold text-neutral-800 dark:text-neutral-200"
                        >{{ myReceivingAccount.tipoMoneda }}</span
                      >
                    </div>
                    <div class="col-span-2">
                      <span class="text-xs text-neutral-500 block"
                        >Número de Cuenta</span
                      >
                      <span
                        class="font-mono font-bold text-neutral-800 dark:text-neutral-200"
                      >
                        {{ myReceivingAccount.numeroCuenta }}
                      </span>
                    </div>
                    <div class="col-span-2">
                      <span class="text-xs text-neutral-500 block"
                        >Titular de la Cuenta</span
                      >
                      <span
                        class="font-bold text-neutral-800 dark:text-neutral-200"
                        >{{ myReceivingAccount.nombreTitular }}</span
                      >
                    </div>
                  </div>
                  <div v-else class="p-6 text-center text-xs text-neutral-400">
                    <UIcon
                      name="i-lucide-hourglass"
                      class="animate-spin mr-1.5"
                    />
                    Cargando cuenta de recepción...
                  </div>
                </div>
              </div>

              <!-- Estado de Confirmaciones y Acciones -->
              <div
                class="border-t border-neutral-100 dark:border-neutral-800 pt-6 space-y-4"
              >
                <!-- Banners de Confirmación Personal -->
                <div
                  v-if="hasConfirmed"
                  class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3"
                >
                  <UIcon
                    name="i-lucide-hourglass"
                    class="text-amber-500 size-5 shrink-0 mt-0.5 animate-pulse"
                  />
                  <div>
                    <h3
                      class="text-sm font-bold text-amber-800 dark:text-amber-400"
                    >
                      Has confirmado la operación
                    </h3>
                    <p
                      class="text-xs text-amber-700/90 dark:text-amber-400/90 mt-1"
                    >
                      Has validado el pago de la contraparte. Esperando que la
                      contraparte también presione "Confirmar Pago Correcto"
                      para completar la liberación de fondos.
                    </p>
                  </div>
                </div>

                <!-- Banners de Confirmación de Contraparte -->
                <div
                  v-if="contraparteConfirmed"
                  class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3"
                >
                  <UIcon
                    name="i-lucide-check-circle"
                    class="text-emerald-500 size-5 shrink-0 mt-0.5"
                  />
                  <div>
                    <h3
                      class="text-sm font-bold text-emerald-800 dark:text-emerald-400"
                    >
                      La contraparte ya confirmó tu pago
                    </h3>
                    <p
                      class="text-xs text-emerald-700/90 dark:text-emerald-400/90 mt-1"
                    >
                      La contraparte ya validó tu transferencia. Una vez que tú
                      también verifiques su pago, confirma para finalizar el
                      intercambio.
                    </p>
                  </div>
                </div>

                <!-- Botones Principales (Si no he confirmado) -->
                <div v-if="!hasConfirmed" class="space-y-4 pt-2">
                  <!-- Aviso si la contraparte no ha subido comprobante -->
                  <div
                    v-if="!contraparteVoucher"
                    class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3"
                  >
                    <UIcon
                      name="i-lucide-alert-triangle"
                      class="text-amber-500 size-5 shrink-0 mt-0.5"
                    />
                    <div class="text-left">
                      <h3
                        class="text-xs font-bold text-amber-800 dark:text-amber-400"
                      >
                        Esperando comprobante de contraparte
                      </h3>
                      <p
                        class="text-[11px] text-amber-700/90 dark:text-amber-400/90 mt-1"
                      >
                        Podrás presionar "Confirmar Pago Correcto" una vez que
                        la contraparte suba su comprobante de transferencia. Si
                        surge algún problema, puedes iniciar una disputa en
                        cualquier momento.
                      </p>
                    </div>
                  </div>

                  <div class="flex flex-col sm:flex-row gap-3">
                    <UButton
                      v-if="contraparteVoucher"
                      label="Confirmar Pago Correcto"
                      color="success"
                      class="flex-1 font-bold py-3 transition-transform active:scale-[0.99] justify-center"
                      icon="i-lucide-check-circle"
                      :loading="confirmingReceipt"
                      @click="confirmReceipt"
                    />
                    <UButton
                      label="Abrir Disputa"
                      color="error"
                      variant="soft"
                      class="font-bold py-3 transition-transform active:scale-[0.99] justify-center"
                      :class="contraparteVoucher ? 'flex-1' : 'w-full'"
                      icon="i-lucide-alert-triangle"
                      :loading="openingDispute"
                      @click="openDispute"
                    />
                  </div>
                </div>

                <!-- Botón de disputa alternativo (si ya confirmé pero la contraparte no) -->
                <div v-else class="text-center pt-2">
                  <p class="text-xs text-neutral-400 mb-3">
                    ¿Ocurrió algún problema con la liberación o no recibes
                    respuesta de la contraparte?
                  </p>
                  <UButton
                    label="Iniciar Disputa"
                    color="error"
                    variant="soft"
                    class="font-bold py-2 px-6 transition-transform active:scale-[0.99]"
                    icon="i-lucide-alert-triangle"
                    :loading="openingDispute"
                    @click="openDispute"
                  />
                </div>
              </div>
            </div>

            <!-- CASO: ESTADO FINALIZADO -->
            <div
              v-else-if="transaction.estado === 'Finalizado'"
              class="space-y-6"
            >
              <div
                class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-center sm:text-left flex-col sm:flex-row"
              >
                <div
                  class="p-2 bg-emerald-500 text-white rounded-full mx-auto sm:mx-0"
                >
                  <UIcon name="i-lucide-check-circle" class="size-6" />
                </div>
                <div>
                  <h3
                    class="text-sm font-bold text-emerald-800 dark:text-emerald-400"
                  >
                    ¡Transacción Finalizada con Éxito!
                  </h3>
                  <p
                    class="text-xs text-emerald-700/90 dark:text-emerald-400/90 mt-1"
                  >
                    Ambas partes han confirmado correctamente la recepción de
                    sus pagos. Los fondos se han transferido de forma segura.
                  </p>
                </div>
              </div>

              <!-- Formulario de Calificación si no se ha enviado -->
              <div
                v-if="!ratingSubmitted"
                class="border-t border-neutral-100 dark:border-neutral-800 pt-6 space-y-4"
              >
                <div class="space-y-1">
                  <h3
                    class="text-base font-bold text-neutral-900 dark:text-white"
                  >
                    Califica tu experiencia con la contraparte
                  </h3>
                  <p class="text-xs text-neutral-400">
                    Tu opinión es muy importante para mantener una comunidad
                    confiable y segura.
                  </p>
                </div>

                <UForm
                  :schema="ratingSchema"
                  :state="ratingState"
                  class="space-y-4"
                  @submit="submitRating"
                >
                  <UFormField
                    name="puntaje"
                    label="Calificación (Estrellas)"
                    required
                  >
                    <div class="flex items-center gap-1.5 mt-1">
                      <button
                        v-for="star in 5"
                        :key="star"
                        type="button"
                        class="p-1 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                        :class="
                          star <= ratingState.puntaje
                            ? 'text-amber-500'
                            : 'text-neutral-300 dark:text-neutral-700'
                        "
                        @click="ratingState.puntaje = star"
                      >
                        <UIcon
                          name="i-lucide-star"
                          class="size-7 fill-current"
                        />
                      </button>
                    </div>
                  </UFormField>

                  <UFormField
                    name="comentario"
                    label="Comentario u Opinión (Opcional)"
                  >
                    <UInput
                      v-model="ratingState.comentario"
                      placeholder="Escribe un comentario breve sobre la rapidez, comunicación y amabilidad..."
                      maxlength="500"
                      class="w-full"
                    />
                  </UFormField>

                  <UButton
                    type="submit"
                    label="Enviar Calificación"
                    color="primary"
                    icon="i-lucide-star"
                    class="font-bold py-2.5"
                    :loading="submittingRating"
                  />
                </UForm>
              </div>

              <!-- Calificación ya enviada -->
              <div
                v-else
                class="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl text-center text-sm text-neutral-500 border border-neutral-100 dark:border-neutral-800"
              >
                <UIcon
                  name="i-lucide-heart"
                  class="text-rose-500 mr-1 animate-pulse"
                />
                ¡Ya has calificado esta transacción! Gracias por tu
                colaboración.
              </div>
            </div>

            <!-- CASO: ESTADO DISPUTA -->
            <div v-else-if="transaction.estado === 'Disputa'" class="space-y-4">
              <div
                class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
              >
                <UIcon
                  name="i-lucide-alert-triangle"
                  class="text-red-500 size-6 shrink-0 mt-0.5"
                />
                <div>
                  <h3 class="text-sm font-bold text-red-800 dark:text-red-400">
                    Esta transacción está en disputa
                  </h3>
                  <p class="text-xs text-red-700/90 dark:text-red-400/90 mt-1">
                    Un moderador de administración ha sido notificado y evaluará
                    las pruebas del caso (chats, vouchers y cuentas bancarias)
                    para liberar los fondos o resolver el conflicto. Puedes
                    seguir comunicándote mediante el chat.
                  </p>
                </div>
              </div>
            </div>

            <!-- CASO: ESTADO CANCELADO -->
            <div v-else class="space-y-4">
              <div
                class="p-4 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700/50 rounded-xl flex items-start gap-3"
              >
                <UIcon
                  name="i-lucide-ban"
                  class="text-neutral-500 size-6 shrink-0 mt-0.5"
                />
                <div>
                  <h3
                    class="text-sm font-bold text-neutral-700 dark:text-neutral-400"
                  >
                    Transacción Cancelada
                  </h3>
                  <p
                    class="text-xs text-neutral-500/90 dark:text-neutral-400/90 mt-1"
                  >
                    Esta operación ha sido cancelada. Los fondos no fueron
                    intercambiados y volvieron al vendedor.
                  </p>
                </div>
              </div>
            </div>

            <!-- Reusable Voucher Uploader -->
            <div
              v-if="canUploadVoucher"
              class="border-t border-neutral-100 dark:border-neutral-800 pt-6 mt-6 space-y-4"
            >
              <div>
                <h4 class="text-sm font-bold text-neutral-900 dark:text-white">
                  Sube tu comprobante de pago de transferencia
                </h4>
                <p class="text-xs text-neutral-400 mt-0.5">
                  Por favor, transfiere a la cuenta bancaria de destino
                  correspondiente y sube aquí la imagen del voucher de la
                  transferencia (máximo 5MB, JPG o PNG).
                </p>
              </div>

              <div class="space-y-3">
                <div
                  v-if="!voucherPreview"
                  class="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl p-6 text-center hover:border-primary/50 transition-colors relative"
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    @change="onVoucherSelected"
                  />
                  <div class="space-y-1">
                    <UIcon
                      name="i-lucide-upload-cloud"
                      class="size-8 text-neutral-400 mx-auto"
                    />
                    <p
                      class="text-xs font-bold text-neutral-600 dark:text-neutral-300"
                    >
                      Selecciona una imagen o arrástrala aquí
                    </p>
                    <p class="text-[10px] text-neutral-400">
                      Formatos aceptados: JPG, PNG
                    </p>
                  </div>
                </div>

                <!-- Vista previa del comprobante seleccionado -->
                <div
                  v-else
                  class="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-3"
                >
                  <div class="flex items-center justify-between">
                    <span
                      class="text-xs font-bold truncate text-neutral-700 dark:text-neutral-300"
                    >
                      {{ voucherFile?.name }}
                    </span>
                    <UButton
                      icon="i-lucide-trash"
                      color="error"
                      variant="ghost"
                      size="xs"
                      @click="removeVoucher"
                    />
                  </div>
                  <div
                    class="aspect-video w-full max-h-48 rounded-lg overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center"
                  >
                    <img
                      :src="voucherPreview"
                      alt="Vista previa del comprobante"
                      class="max-h-full object-contain"
                    />
                  </div>
                  <UButton
                    label="Enviar Comprobante y Registrar Pago"
                    color="success"
                    class="w-full font-bold justify-center"
                    icon="i-lucide-check"
                    :loading="uploadingVoucher"
                    @click="uploadVoucher"
                  />
                </div>
              </div>
            </div>

            <!-- Comprobantes de Pago Cargados -->
            <div
              v-if="buyerVoucher || sellerVoucher"
              class="border-t border-neutral-100 dark:border-neutral-800 pt-6 mt-6 space-y-6"
            >
              <h3
                class="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5"
              >
                <UIcon name="i-lucide-file-text" class="size-4" />
                Comprobantes de Transferencia
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <!-- Comprobante del Comprador -->
                <div
                  v-if="buyerVoucher"
                  class="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30"
                >
                  <div class="flex items-center justify-between">
                    <span
                      class="text-xs font-bold text-neutral-700 dark:text-neutral-300"
                      >Voucher del Comprador</span
                    >
                    <span class="text-[9px] text-neutral-400 font-mono">{{
                      formatDate(buyerVoucher.fechaSubida)
                    }}</span>
                  </div>
                  <div
                    class="aspect-video w-full max-h-44 rounded-lg overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center"
                  >
                    <a
                      :href="buyerVoucher.imagenUrl"
                      target="_blank"
                      class="block cursor-zoom-in"
                    >
                      <img
                        :src="buyerVoucher.imagenUrl"
                        alt="Comprobante Comprador"
                        class="max-h-full object-contain hover:scale-105 transition-transform"
                      />
                    </a>
                  </div>
                  <div class="text-center">
                    <a
                      :href="buyerVoucher.imagenUrl"
                      target="_blank"
                      class="text-xs text-primary hover:underline font-bold inline-flex items-center gap-1"
                    >
                      <UIcon name="i-lucide-external-link" />
                      Ver pantalla completa
                    </a>
                  </div>
                </div>

                <!-- Comprobante del Vendedor -->
                <div
                  v-if="sellerVoucher"
                  class="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30"
                >
                  <div class="flex items-center justify-between">
                    <span
                      class="text-xs font-bold text-neutral-700 dark:text-neutral-300"
                      >Voucher del Vendedor</span
                    >
                    <span class="text-[9px] text-neutral-400 font-mono">{{
                      formatDate(sellerVoucher.fechaSubida)
                    }}</span>
                  </div>
                  <div
                    class="aspect-video w-full max-h-44 rounded-lg overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center"
                  >
                    <a
                      :href="sellerVoucher.imagenUrl"
                      target="_blank"
                      class="block cursor-zoom-in"
                    >
                      <img
                        :src="sellerVoucher.imagenUrl"
                        alt="Comprobante Vendedor"
                        class="max-h-full object-contain hover:scale-105 transition-transform"
                      />
                    </a>
                  </div>
                  <div class="text-center">
                    <a
                      :href="sellerVoucher.imagenUrl"
                      target="_blank"
                      class="text-xs text-primary hover:underline font-bold inline-flex items-center gap-1"
                    >
                      <UIcon name="i-lucide-external-link" />
                      Ver pantalla completa
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Contraparte e Interfaces del Chat -->
        <div class="space-y-6">
          <!-- Ficha de Contraparte -->
          <div
            v-if="contraparte"
            class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-4"
          >
            <h2
              class="text-xs font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase"
            >
              Tu Contraparte Comercial
            </h2>
            <div class="flex items-center gap-3">
              <div
                class="size-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20"
              >
                {{ contraparte.nombres[0] }}{{ contraparte.apellidos[0] }}
              </div>
              <div class="overflow-hidden">
                <span
                  class="block font-bold text-sm text-neutral-900 dark:text-white truncate"
                >
                  {{ contraparte.nombres }} {{ contraparte.apellidos }}
                </span>
                <span
                  class="inline-block text-[10px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-full font-bold uppercase mt-0.5"
                >
                  {{ isBuyer ? "Vendedor" : "Comprador" }}
                </span>
              </div>
            </div>

            <div
              class="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 space-y-1"
            >
              <span class="block"
                >Correo:
                <span
                  class="font-mono text-neutral-700 dark:text-neutral-300 font-medium"
                  >{{ contraparte.correo }}</span
                ></span
              >
              <span class="block"
                >ID Usuario:
                <span
                  class="font-mono text-neutral-700 dark:text-neutral-300 font-bold"
                  >#{{ contraparte.usuarioId }}</span
                ></span
              >
            </div>
          </div>

          <!-- Chat en Tiempo Real -->
          <div
            class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-120"
          >
            <!-- Chat Header -->
            <div
              class="px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex justify-between items-center"
            >
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-messages-square"
                  class="text-primary size-5"
                />
                <span class="text-sm font-bold">Chat de la Transacción</span>
              </div>

              <!-- SignalR Connection Status Indicator -->
              <div class="flex items-center">
                <span
                  v-if="signalrState === 'connected'"
                  class="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold"
                >
                  <span
                    class="size-2 bg-emerald-500 rounded-full animate-pulse"
                  ></span>
                  Conectado
                </span>
                <span
                  v-else-if="
                    signalrState === 'connecting' ||
                    signalrState === 'reconnecting'
                  "
                  class="inline-flex items-center gap-1 text-[10px] text-amber-500 font-bold animate-pulse"
                >
                  <span class="size-2 bg-amber-500 rounded-full"></span>
                  Conectando
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 text-[10px] text-neutral-400 font-bold"
                >
                  <span class="size-2 bg-neutral-400 rounded-full"></span>
                  Desconectado
                </span>
              </div>
            </div>

            <!-- Messages Area -->
            <div
              ref="chatContainer"
              class="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/30 dark:bg-neutral-900/10"
            >
              <div
                v-if="messages.length === 0"
                class="text-center py-12 text-neutral-400 text-xs"
              >
                <UIcon
                  name="i-lucide-messages-square"
                  class="size-8 text-neutral-300 dark:text-neutral-800 mx-auto mb-2"
                />
                No hay mensajes aún en esta sala.<br />¡Saluda a tu contraparte!
              </div>

              <div
                v-for="msg in messages"
                :key="msg.mensajeId"
                class="w-full mb-2"
              >
                <!-- Mensaje de Sistema de Cuenta Bancaria -->
                <div
                  v-if="msg.contenido.startsWith('[AUTOMATICO-CUENTA]')"
                  class="mx-auto max-w-md my-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50 text-center text-xs text-neutral-500"
                >
                  <div
                    class="font-bold flex items-center justify-center gap-1 mb-1 text-neutral-700 dark:text-neutral-300"
                  >
                    <UIcon
                      name="i-lucide-landmark"
                      class="size-3.5 text-primary"
                    />
                    Cuenta Bancaria de Contraparte
                  </div>
                  <span>{{
                    msg.contenido.replace("[AUTOMATICO-CUENTA] ", "")
                  }}</span>
                </div>

                <!-- Mensaje de Chat Normal -->
                <div
                  v-else
                  class="flex flex-col max-w-[80%]"
                  :class="[
                    msg.remitenteId === authStore.usuario?.usuarioId
                      ? 'ml-auto items-end'
                      : 'mr-auto items-start',
                  ]"
                >
                  <!-- Bubble -->
                  <div
                    class="px-3.5 py-2.5 rounded-2xl text-sm wrap-break-word shadow-xs"
                    :class="[
                      msg.remitenteId === authStore.usuario?.usuarioId
                        ? 'bg-primary text-white rounded-br-none'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-bl-none',
                    ]"
                  >
                    {{ msg.contenido }}
                  </div>
                  <!-- Time -->
                  <span class="text-[9px] text-neutral-400 mt-1 px-1 font-mono">
                    {{ formatDate(msg.fechaEnvio) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Message Input Form -->
            <form
              @submit.prevent="sendChatMessage"
              class="p-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2"
            >
              <UInput
                v-model="newMessage"
                placeholder="Escribe un mensaje..."
                class="flex-1"
                autocomplete="off"
                :disabled="sendingMessage || signalrState !== 'connected'"
              />
              <UButton
                type="submit"
                icon="i-lucide-send-horizontal"
                color="primary"
                :disabled="
                  !newMessage.trim() ||
                  sendingMessage ||
                  signalrState !== 'connected'
                "
                :loading="sendingMessage"
              />
            </form>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal de Confirmación de Disputa -->
    <UModal
      v-model:open="showDisputeModal"
      title="¿Seguro que deseas abrir una disputa?"
      description="Al iniciar una disputa, la transacción quedará retenida temporalmente y se notificará a un administrador de soporte técnico para que revise los comprobantes de transferencia y los chats de ambas partes. Esta acción no se puede revertir."
      :ui="{ footer: 'justify-end' }"
    >
      <template #footer>
        <UButton
          label="Cancelar"
          color="neutral"
          variant="outline"
          class="font-bold py-2 justify-center"
          @click="showDisputeModal = false"
        />
        <UButton
          label="Iniciar Disputa"
          color="error"
          class="font-bold py-2 justify-center"
          :loading="openingDispute"
          @click="confirmOpenDispute"
        />
      </template>
    </UModal>
  </div>
</template>

<style scoped>
/* Scrollbar estilos discretos para el chat */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--ui-neutral-300);
  border-radius: 4px;
}
.dark ::-webkit-scrollbar-thumb {
  background: var(--ui-neutral-700);
}
</style>
