<script setup lang="ts">
import type {
  TransaccionDetailResponse,
  ConfirmReceiptResponse,
  OpenDisputeResponse,
  CalificacionResponse,
  ErrorResponse,
} from "~/types";

definePageMeta({
  middleware: ["auth"],
  title: "Sala de Transacción",
  back: "/history",
});

const route = useRoute();
const toast = useToast();
const api = useApi();
const authStore = useAuthStore();

const transactionId = Number(route.params.id);

const loading = ref(true);
const transaction = ref<TransaccionDetailResponse | null>(null);
const errorMsg = ref<string | null>(null);

// Control de estados
const confirmingReceipt = ref(false);
const openingDispute = ref(false);
const showDisputeModal = ref(false);
const submittingRating = ref(false);
const ratingSubmitted = ref(false);
const uploadingVoucher = ref(false);

const chatRef = ref<{ fetchMessages: () => void } | null>(null);

// Determinar roles
const isBuyer = computed(() => {
  if (!transaction.value || !authStore.usuario) return false;
  return transaction.value.comprador.usuarioId === authStore.usuario.usuarioId;
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
      `/api/transacciones/${transactionId}`
    );
    transaction.value = response;
    ratingSubmitted.value = response.yaCalificado || false;
  } catch (err) {
    const error = err as { status?: number };
    if (error.status === 404) {
      errorMsg.value = "La transacción especificada no existe.";
    } else if (error.status === 403) {
      errorMsg.value = "No tienes permiso para acceder a esta transacción.";
    } else {
      errorMsg.value = "Ocurrió un error al cargar la transacción.";
    }
  } finally {
    loading.value = false;
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
      ((transaction.value.montoOperacion ?? 0) * transaction.value.tipoCambioAplicado).toFixed(2)
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
      }
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
  } catch (err) {
    const error = err as { data?: ErrorResponse };
    const errorData = error.data;
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
      }
    );
    toast.add({
      title: "Disputa Iniciada",
      description: "Se ha abierto una disputa. El equipo de administración revisará el caso.",
      color: "warning",
      icon: "i-lucide-alert-triangle",
    });
    await fetchTransaction();
  } catch (err) {
    const error = err as { data?: ErrorResponse };
    const errorData = error.data;
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
async function handleRatingSubmit(payload: { puntaje: number; comentario: string }) {
  submittingRating.value = true;
  try {
    await api<CalificacionResponse>("/api/calificaciones", {
      method: "POST",
      body: {
        transaccionId: transactionId,
        puntaje: payload.puntaje,
        comentario: payload.comentario || undefined,
      },
    });
    toast.add({
      title: "Calificación enviada",
      description: "¡Gracias por valorar a la contraparte!",
      color: "success",
      icon: "i-lucide-check-circle",
    });
    ratingSubmitted.value = true;
  } catch (err) {
    const error = err as { data?: ErrorResponse };
    const errorData = error.data;
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

async function handleVoucherUploaded() {
  await fetchTransaction();
  if (chatRef.value) {
    chatRef.value.fetchMessages();
  }
}

// Comprobantes filtrados por rol
const buyerVoucher = computed(() => {
  if (!transaction.value || !transaction.value.comprobantes) return null;
  return (
    transaction.value.comprobantes.find(
      (c) => c.usuarioId === transaction.value!.comprador.usuarioId
    ) || null
  );
});

const sellerVoucher = computed(() => {
  if (!transaction.value || !transaction.value.comprobantes) return null;
  return (
    transaction.value.comprobantes.find(
      (c) => c.usuarioId === transaction.value!.vendedor.usuarioId
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
    transaction.value.estado === "En Proceso"
  );
});

onMounted(() => {
  fetchTransaction();
});
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
    <!-- Content -->
    <main class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Encabezado de la Transacción -->
      <TransactionHeader v-if="transaction" :transaction-id="transactionId" :estado="transaction.estado" />

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
        <h2 class="text-xl font-bold text-neutral-900 dark:text-white mb-2">Acceso no permitido</h2>
        <p class="text-neutral-500 dark:text-neutral-400 mb-6">{{ errorMsg }}</p>
        <UButton
          label="Volver al Historial"
          color="neutral"
          icon="i-lucide-arrow-left"
          class="cursor-pointer"
          @click="navigateTo('/history')"
        />
      </div>

      <!-- Main Layout -->
      <div v-else-if="transaction" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Columna Izquierda: Información de transacción y flujo -->
        <div class="lg:col-span-2 space-y-6">
          <TransactionStepper :estado="transaction.estado" />

          <!-- Flujo según estado -->
          <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-6">
            <!-- CASO: ESTADO PENDIENTE O EN PROCESO -->
            <div v-if="transaction.estado === 'Pendiente' || transaction.estado === 'En Proceso'" class="space-y-6">
              <TransactionInstructions
                :exact-amount-to-send="exactAmountToSend"
                :exact-amount-to-receive="exactAmountToReceive"
              />

              <TransactionAccounts
                :destination-account="destinationAccount"
                :my-receiving-account="myReceivingAccount"
              />

              <!-- Confirmación de pagos y acciones -->
              <div class="border-t border-neutral-100 dark:border-neutral-800 pt-6 space-y-4">
                <!-- Banners de Confirmación Personal -->
                <div v-if="hasConfirmed" class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                  <UIcon name="i-lucide-hourglass" class="text-amber-500 size-5 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h3 class="text-sm font-bold text-amber-800 dark:text-amber-400">Has confirmado la operación</h3>
                    <p class="text-xs text-amber-700/90 dark:text-amber-400/90 mt-1">
                      Has validado el pago de la contraparte. Esperando que la contraparte también presione "Confirmar Pago Correcto" para completar la liberación de fondos.
                    </p>
                  </div>
                </div>

                <!-- Banners de Confirmación de Contraparte -->
                <div v-if="contraparteConfirmed" class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                  <UIcon name="i-lucide-check-circle" class="text-emerald-500 size-5 shrink-0 mt-0.5" />
                  <div>
                    <h3 class="text-sm font-bold text-emerald-800 dark:text-emerald-400">La contraparte ya confirmó tu pago</h3>
                    <p class="text-xs text-emerald-700/90 dark:text-emerald-400/90 mt-1">
                      La contraparte ya validó tu transferencia. Una vez que tú también verifiques su pago, confirma para finalizar el intercambio.
                    </p>
                  </div>
                </div>

                <!-- Botones Principales (Si no he confirmado) -->
                <div v-if="!hasConfirmed" class="space-y-4 pt-2">
                  <div v-if="!contraparteVoucher" class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                    <UIcon name="i-lucide-alert-triangle" class="text-amber-500 size-5 shrink-0 mt-0.5" />
                    <div class="text-left">
                      <h3 class="text-xs font-bold text-amber-800 dark:text-amber-400">Esperando comprobante de contraparte</h3>
                      <p class="text-[11px] text-amber-700/90 dark:text-amber-400/90 mt-1">
                        Podrás presionar "Confirmar Pago Correcto" una vez que la contraparte suba su comprobante de transferencia. Si surge algún problema, puedes iniciar una disputa en cualquier momento.
                      </p>
                    </div>
                  </div>

                  <div class="flex flex-col sm:flex-row gap-3">
                    <UButton
                      v-if="contraparteVoucher"
                      label="Confirmar Pago Correcto"
                      color="success"
                      class="flex-1 font-bold py-3 transition-transform active:scale-[0.99] justify-center cursor-pointer"
                      icon="i-lucide-check-circle"
                      :loading="confirmingReceipt"
                      @click="confirmReceipt"
                    />
                    <UButton
                      label="Abrir Disputa"
                      color="error"
                      variant="soft"
                      class="font-bold py-3 transition-transform active:scale-[0.99] justify-center cursor-pointer"
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
                    ¿Ocurrió algún problema con la liberación o no recibes respuesta de la contraparte?
                  </p>
                  <UButton
                    label="Iniciar Disputa"
                    color="error"
                    variant="soft"
                    class="font-bold py-2 px-6 transition-transform active:scale-[0.99] cursor-pointer"
                    icon="i-lucide-alert-triangle"
                    :loading="openingDispute"
                    @click="openDispute"
                  />
                </div>
              </div>
            </div>

            <!-- CASO: ESTADO FINALIZADO -->
            <div v-else-if="transaction.estado === 'Finalizado'" class="space-y-6">
              <div class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-center sm:text-left flex-col sm:flex-row">
                <div class="p-2 bg-emerald-500 text-white rounded-full mx-auto sm:mx-0">
                  <UIcon name="i-lucide-check-circle" class="size-6" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-emerald-800 dark:text-emerald-400">¡Transacción Finalizada con Éxito!</h3>
                  <p class="text-xs text-emerald-700/90 dark:text-emerald-400/90 mt-1">
                    Ambas partes han confirmado correctamente la recepción de sus pagos. Los fondos se han transferido de forma segura.
                  </p>
                </div>
              </div>

              <TransactionRating
                :rating-submitted="ratingSubmitted"
                :submitting-rating="submittingRating"
                @submit="handleRatingSubmit"
              />
            </div>

            <!-- CASO: ESTADO DISPUTA -->
            <div v-else-if="transaction.estado === 'Disputa'" class="space-y-4">
              <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <UIcon name="i-lucide-alert-triangle" class="text-red-500 size-6 shrink-0 mt-0.5" />
                <div>
                  <h3 class="text-sm font-bold text-red-800 dark:text-red-400">Esta transacción está en disputa</h3>
                  <p class="text-xs text-red-700/90 dark:text-red-400/90 mt-1">
                    Un moderador de administración ha sido notificado y evaluará las pruebas del caso (chats, vouchers y cuentas bancarias) para liberar los fondos o resolver el conflicto. Puedes seguir comunicándote mediante el chat.
                  </p>
                </div>
              </div>
            </div>

            <!-- CASO: ESTADO CANCELADO -->
            <div v-else class="space-y-4">
              <div class="p-4 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700/50 rounded-xl flex items-start gap-3">
                <UIcon name="i-lucide-ban" class="text-neutral-500 size-6 shrink-0 mt-0.5" />
                <div>
                  <h3 class="text-sm font-bold text-neutral-700 dark:text-neutral-400">Transacción Cancelada</h3>
                  <p class="text-xs text-neutral-500/90 dark:text-neutral-400/90 mt-1">
                    Esta operación ha sido cancelada. Los fondos no fueron intercambiados y volvieron al vendedor.
                  </p>
                </div>
              </div>
            </div>

            <!-- Reusable Voucher Uploader -->
            <TransactionVoucherUpload
              v-if="canUploadVoucher"
              :transaction-id="transactionId"
              :uploading-voucher="uploadingVoucher"
              @voucher-uploaded="handleVoucherUploaded"
            />

            <!-- Comprobantes Cargados -->
            <TransactionVoucherGallery
              :buyer-voucher="buyerVoucher"
              :seller-voucher="sellerVoucher"
            />
          </div>
        </div>

        <!-- Columna Derecha: Contraparte e Interfaces del Chat -->
        <div class="space-y-6">
          <!-- Ficha de Contraparte -->
          <div v-if="contraparte" class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-4">
            <h2 class="text-xs font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">Tu Contraparte Comercial</h2>
            <div class="flex items-center gap-3">
              <div class="size-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20">
                {{ contraparte.nombres[0] }}{{ contraparte.apellidos[0] }}
              </div>
              <div class="overflow-hidden">
                <span class="block font-bold text-sm text-neutral-900 dark:text-white truncate">
                  {{ contraparte.nombres }} {{ contraparte.apellidos }}
                </span>
                <span class="inline-block text-[10px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-full font-bold uppercase mt-0.5">
                  {{ isBuyer ? "Vendedor" : "Comprador" }}
                </span>
              </div>
            </div>

            <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 space-y-1">
              <span class="block">Correo: <span class="font-mono text-neutral-700 dark:text-neutral-300 font-medium">{{ contraparte.correo }}</span></span>
              <span class="block">ID Usuario: <span class="font-mono text-neutral-700 dark:text-neutral-300 font-bold">#{{ contraparte.usuarioId }}</span></span>
            </div>
          </div>

          <!-- Chat en Tiempo Real -->
          <TransactionChat ref="chatRef" :transaction-id="transactionId" />
        </div>
      </div>
    </main>

    <!-- Modal de Confirmación de Disputa -->
    <TransactionDisputeModal
      v-model:open="showDisputeModal"
      :opening-dispute="openingDispute"
      @confirm="confirmOpenDispute"
    />
  </div>
</template>
