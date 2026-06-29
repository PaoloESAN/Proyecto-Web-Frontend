<script setup lang="ts">
import type {
  OfertaDetalleResponse,
  TransaccionCreateResponse,
  ErrorResponse,
  MetodoPagoResponse,
  TransaccionCreateRequest,
} from "~/types";

definePageMeta({
  back: "/marketplace",
});

const route = useRoute();
const toast = useToast();
const api = useApi();
const authStore = useAuthStore();

const offerId = Number(route.params.id);
const loading = ref(true);
const offer = ref<OfertaDetalleResponse | null>(null);
const errorMsg = ref<string | null>(null);
const transactionLoading = ref(false);
const confirmModalOpen = ref(false);
const selectedMetodoPagoId = ref<number | null>(null);

const metodosPago = ref<MetodoPagoResponse[]>([]);

async function fetchOffer() {
  loading.value = true;
  errorMsg.value = null;
  try {
    offer.value = await api<OfertaDetalleResponse>(`/api/ofertas/${offerId}`);
  } catch (err) {
    const error = err as { status?: number };
    if (error.status === 404) {
      errorMsg.value = "La oferta especificada no existe, está inactiva o ya fue completada.";
    } else {
      errorMsg.value = "No se pudo cargar la información de la oferta.";
    }
  } finally {
    loading.value = false;
  }
}

async function fetchAccounts() {
  if (!authStore.isAuthenticated) return;
  try {
    const response = await api<MetodoPagoResponse[]>("/api/users/metodos-pago");
    metodosPago.value = response;
  } catch {
    // ignore
  }
}

onMounted(async () => {
  await fetchOffer();
  await fetchAccounts();
});

const targetCurrency = computed(() => offer.value?.monedaRecibo ?? "");

const metodosPagoOptions = computed(() => {
  return metodosPago.value
    .filter((m) => m.tipoMoneda === targetCurrency.value)
    .map((m) => ({
      label: `${m.banco} - ${m.numeroCuenta} (${m.tipoMoneda})`,
      value: m.metodoPagoId,
    }));
});

const hasMatchingAccounts = computed(() => metodosPagoOptions.value.length > 0);

const isOwnOffer = computed(
  () =>
    authStore.isAuthenticated &&
    offer.value?.usuarioCreador?.usuarioId === authStore.usuario?.usuarioId
);

async function handleAcceptSubmit(metodoPagoId: number) {
  if (!authStore.isAuthenticated) {
    toast.add({
      title: "Inicia sesión",
      description: "Debes iniciar sesión para operar.",
      color: "warning",
    });
    await navigateTo("/login");
    return;
  }

  if (!authStore.usuario?.esVerificado) {
    toast.add({
      title: "Verificación requerida",
      description: "Debes verificar tu identidad en tu perfil antes de iniciar una transacción.",
      color: "warning",
      icon: "i-lucide-shield-alert",
    });
    return;
  }

  if (isOwnOffer.value) {
    toast.add({
      title: "Operación inválida",
      description: "No puedes tomar tu propia oferta.",
      color: "error",
    });
    return;
  }

  if (!hasMatchingAccounts.value) {
    toast.add({
      title: "Cuenta no disponible",
      description: `No tienes cuentas registradas en ${targetCurrency.value}. Agrega una en tu perfil.`,
      color: "warning",
    });
    return;
  }

  selectedMetodoPagoId.value = metodoPagoId;
  confirmModalOpen.value = true;
}

async function executeTransaction() {
  if (!selectedMetodoPagoId.value) return;
  transactionLoading.value = true;
  try {
    const payload: TransaccionCreateRequest = {
      ofertaId: offerId,
      metodoPagoParticipanteId: selectedMetodoPagoId.value,
    };

    const res = await api<TransaccionCreateResponse>("/api/transacciones", {
      method: "POST",
      body: payload,
    });

    toast.add({
      title: "Transacción iniciada",
      description: res.mensaje || "Se inició correctamente.",
      color: "success",
      icon: "i-lucide-circle-check",
    });

    confirmModalOpen.value = false;
    navigateTo(
      `/transaction/${res.transaccion.transaccionId}?accountId=${selectedMetodoPagoId.value}`,
      { replace: true }
    );
  } catch (error) {
    const err = error as { data?: ErrorResponse };
    const errorData = err.data;
    toast.add({
      title: "Error al procesar",
      description: errorData?.mensaje || "No se pudo crear la transacción.",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    transactionLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-dvh bg-linear-to-b from-neutral-50 to-neutral-100/70 dark:from-neutral-950 dark:to-neutral-950">
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div v-if="loading" class="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <USkeleton class="h-72 rounded-2xl" />
        <USkeleton class="h-72 rounded-2xl" />
      </div>

      <div
        v-else-if="errorMsg"
        class="max-w-3xl mx-auto bg-white dark:bg-neutral-900 border border-default rounded-2xl p-8 text-center"
      >
        <p class="text-red-500 font-semibold mb-2">Oferta no disponible</p>
        <p class="text-sm text-neutral-500">{{ errorMsg }}</p>
      </div>

      <template v-else-if="offer">
        <div class="flex items-center justify-between text-sm text-neutral-500">
          <div class="inline-flex items-center gap-2">
            <NuxtLink to="/marketplace" class="hover:text-primary transition-colors">Marketplace</NuxtLink>
            <UIcon name="i-lucide-chevron-right" class="size-4" />
            <span class="text-neutral-700 dark:text-neutral-200 font-semibold">Oferta #{{ offer.ofertaId }}</span>
          </div>
          <UButton
            label="Volver"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="xs"
            class="cursor-pointer"
            @click="navigateTo('/marketplace')"
          />
        </div>

        <div class="grid lg:grid-cols-[1.35fr_1fr] gap-6 items-start">
          <OffersDetailCard :offer="offer" :loading="loading" />

          <OffersAcceptForm
            :offer="offer"
            :has-matching-accounts="hasMatchingAccounts"
            :metodos-pago-options="metodosPagoOptions"
            :is-own-offer="isOwnOffer"
            :transaction-loading="transactionLoading"
            @submit="handleAcceptSubmit"
          />
        </div>
      </template>

      <UModal v-model:open="confirmModalOpen" title="Confirmar transacción">
        <template #body>
          <div v-if="offer" class="space-y-2 text-sm">
            <p>Vas a operar esta oferta con montos fijos:</p>
            <p><strong>Entregas:</strong> {{ Number(offer.montoTengo).toLocaleString() }} {{ offer.monedaTengo }}</p>
            <p><strong>Recibes:</strong> {{ Number(offer.montoRecibo).toLocaleString() }} {{ offer.monedaRecibo }}</p>
          </div>
        </template>
        <template #footer>
          <div class="flex gap-2 justify-end w-full">
            <UButton label="Cancelar" color="neutral" variant="outline" @click="confirmModalOpen = false" />
            <UButton label="Confirmar" color="primary" :loading="transactionLoading" @click="executeTransaction" />
          </div>
        </template>
      </UModal>
    </main>
  </div>
</template>
