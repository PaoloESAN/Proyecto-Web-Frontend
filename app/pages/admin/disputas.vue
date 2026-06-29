<script setup lang="ts">
import type {
  GetDisputesAdminResponse,
  ResolveDisputeResponse,
  MensajeChatResponse,
  TransaccionDetailResponse,
  OfertaDetalleResponse,
} from "~/types";

definePageMeta({
  middleware: ["auth"],
  title: "Administración - Disputas",
});

const toast = useToast();
const api = useApi();
const authStore = useAuthStore();

const searchQuery = ref("");
const disputes = ref<GetDisputesAdminResponse["datos"]>([]);
const selectedDispute = ref<GetDisputesAdminResponse["datos"][0] | null>(null);
const transactionDetails = ref<TransaccionDetailResponse | null>(null);
const offerDetails = ref<OfertaDetalleResponse | null>(null);
const chatMessages = ref<MensajeChatResponse[]>([]);

const loading = ref(true);
const loadingTxDetails = ref(false);
const loadingMessages = ref(false);
const resolving = ref(false);

// Estados para previsualizar imágenes de comprobantes
const isImageModalOpen = ref(false);
const selectedImage = ref("");

async function fetchDisputes() {
  loading.value = true;
  try {
    const res = await api<GetDisputesAdminResponse>("/api/admin/disputes", {
      params: { page: 1, pageSize: 50 },
    });
    disputes.value = res.datos;
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudieron cargar las disputas",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    loading.value = false;
  }
}

async function selectDispute(d: GetDisputesAdminResponse["datos"][0]) {
  selectedDispute.value = d;
  loadingMessages.value = true;
  loadingTxDetails.value = true;
  chatMessages.value = [];
  transactionDetails.value = null;
  offerDetails.value = null;

  try {
    const tx = await api<TransaccionDetailResponse>(
      `/api/transacciones/${d.transaccion.transaccionId}`
    );
    transactionDetails.value = tx;

    try {
      const off = await api<OfertaDetalleResponse>(
        `/api/ofertas/${tx.ofertaId}`
      );
      offerDetails.value = off;
    } catch (err) {
      console.error("Error al obtener los detalles de la oferta:", err);
    }
  } catch (err) {
    console.error("Error al obtener los detalles de la transacción:", err);
    toast.add({
      title: "Error",
      description:
        "No se pudieron cargar los detalles completos de la transacción",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    loadingTxDetails.value = false;
  }

  try {
    const msgs = await api<MensajeChatResponse[]>(
      `/api/transacciones/${d.transaccion.transaccionId}/messages`,
      {
        ignoreGlobalErrors: true,
      } as { ignoreGlobalErrors?: boolean }
    );
    chatMessages.value = msgs;
  } catch {
    chatMessages.value = [];
  } finally {
    loadingMessages.value = false;
  }
}

// Estados para confirmación de resolución
const isConfirmModalOpen = ref(false);
const pendingResolution = ref<
  "A favor del comprador" | "A favor del vendedor" | null
>(null);

function confirmResolveDispute(
  resolucion: "A favor del comprador" | "A favor del vendedor"
) {
  pendingResolution.value = resolucion;
  isConfirmModalOpen.value = true;
}

async function executeResolveDispute() {
  if (!pendingResolution.value) return;
  const resolucion = pendingResolution.value;
  isConfirmModalOpen.value = false;
  await resolveDispute(resolucion);
  pendingResolution.value = null;
}

async function resolveDispute(
  resolucion: "A favor del comprador" | "A favor del vendedor"
) {
  if (!selectedDispute.value) return;
  resolving.value = true;
  try {
    await api<ResolveDisputeResponse>(
      `/api/admin/disputes/${selectedDispute.value.disputaId}/resolve`,
      {
        method: "POST",
        body: { resolucion },
      }
    );
    toast.add({
      title: "Disputa resuelta",
      description:
        resolucion === "A favor del comprador"
          ? "A favor del comprador"
          : "A favor del vendedor",
      color: "success",
      icon: "i-lucide-circle-check",
    });
    selectedDispute.value = null;
    await fetchDisputes();
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudo resolver la disputa",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    resolving.value = false;
  }
}

function openPreview(url: string) {
  selectedImage.value = url;
  isImageModalOpen.value = true;
}

const buyerSendsAmount = computed(() => {
  if (!transactionDetails.value) return { amount: 0, currency: "" };
  const accountCurrency =
    transactionDetails.value.instruccionesPago.tipoMoneda;
  const offerCurrency = offerDetails.value?.monedaTengo || "USD"; // Wait, in types it's monedaTengo or moneda. If typo, let's keep it safe.

  if (accountCurrency === offerCurrency) {
    return {
      amount: transactionDetails.value.montoOperacion ?? 0,
      currency: accountCurrency,
    };
  } else {
    return {
      amount: Number(
        (
          (transactionDetails.value.montoOperacion ?? 0) *
          transactionDetails.value.tipoCambioAplicado
        ).toFixed(2)
      ),
      currency: accountCurrency,
    };
  }
});

const sellerSendsAmount = computed(() => {
  if (!transactionDetails.value || !transactionDetails.value.metodoPagoComprador)
    return null;
  const accountCurrency =
    transactionDetails.value.metodoPagoComprador.tipoMoneda;
  const offerCurrency = offerDetails.value?.monedaTengo || "USD";

  if (accountCurrency === offerCurrency) {
    return {
      amount: transactionDetails.value.montoOperacion ?? 0,
      currency: accountCurrency,
    };
  } else {
    return {
      amount: Number(
        (
          (transactionDetails.value.montoOperacion ?? 0) *
          transactionDetails.value.tipoCambioAplicado
        ).toFixed(2)
      ),
      currency: accountCurrency,
    };
  }
});

onMounted(() => {
  if (!authStore.isAdmin) {
    toast.add({
      title: "Acceso Denegado",
      description: "No tienes permisos de administrador",
      color: "error",
    });
    navigateTo("/debug");
    return;
  }
  fetchDisputes();
});
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950 flex flex-col">
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <AdminDisputasSidebar
        v-model="searchQuery"
        :disputes="disputes"
        :selected-dispute-id="selectedDispute?.disputaId"
        :loading="loading"
        @select="selectDispute"
      />

      <!-- Main content -->
      <template v-if="selectedDispute">
        <AdminDisputasDetail
          :selected-dispute="selectedDispute"
          :transaction-details="transactionDetails"
          :loading-tx-details="loadingTxDetails"
          :loading-messages="loadingMessages"
          :chat-messages="chatMessages"
          :resolving="resolving"
          :buyer-sends-amount="buyerSendsAmount"
          :seller-sends-amount="sellerSendsAmount"
          @open-preview="openPreview"
          @resolve="confirmResolveDispute"
        />
      </template>

      <!-- Empty state -->
      <div v-else class="flex-1 flex items-center justify-center">
        <div class="text-center text-neutral-400">
          <UIcon name="i-lucide-arrow-left-from-line" class="size-10 mx-auto mb-3" />
          <p class="text-sm font-medium">Selecciona una disputa para revisar</p>
          <p class="text-xs mt-1">Elige un caso de la barra lateral para ver los detalles e iniciar la revisión</p>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <AdminDisputasImageModal
      v-model:open="isImageModalOpen"
      :selected-image="selectedImage"
    />

    <AdminDisputasConfirmModal
      v-model:open="isConfirmModalOpen"
      :pending-resolution="pendingResolution"
      @confirm="executeResolveDispute"
    />
  </div>
</template>
