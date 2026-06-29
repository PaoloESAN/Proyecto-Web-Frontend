<script setup lang="ts">
import type {
  UsuarioOfertasResponse,
  OfertaUpdateRequest,
  TransaccionHistoryResponse,
} from "~/types";

definePageMeta({
  middleware: ["auth"],
  title: "Mis ofertas",
});

const api = useApi();
const toast = useToast();
const route = useRoute();

const offers = ref<UsuarioOfertasResponse>([]);
const receivedTransactions = ref<TransaccionHistoryResponse["datos"]>([]);
const loading = ref(false);

const editModalOpen = ref(false);
const editingOffer = ref<UsuarioOfertasResponse[number] | null>(null);
const editCantidad = ref<number>(0);
const saving = ref(false);

const confirmCancelOpen = ref(false);
const cancellingOffer = ref<UsuarioOfertasResponse[number] | null>(null);
const deleting = ref(false);

const inProgressTxByOfferId = computed(() => {
  const map = new Map<number, number>();
  for (const tx of receivedTransactions.value) {
    if (!map.has(tx.ofertaId)) {
      map.set(tx.ofertaId, tx.transaccionId);
    }
  }
  return map;
});

function getInProgressTransactionId(ofertaId: number) {
  return inProgressTxByOfferId.value.get(ofertaId) ?? null;
}

function openInProgressOffer(item: UsuarioOfertasResponse[number]) {
  if (item.estado !== "En Proceso") return;

  const txId = getInProgressTransactionId(item.ofertaId);
  if (!txId) {
    toast.add({
      title: "Transacción no encontrada",
      description: "No se pudo resolver la transacción asociada a esta oferta.",
      color: "warning",
    });
    return;
  }

  navigateTo(`/transaction/${txId}`);
}

async function fetchAllData() {
  loading.value = true;
  try {
    const [offersRes, txRes] = await Promise.all([
      api<UsuarioOfertasResponse>("/api/ofertas/usuario"),
      api<TransaccionHistoryResponse>("/api/transacciones/history", {
        params: { page: 1, pageSize: 200 },
      }),
    ]);

    offers.value = offersRes ?? [];
    receivedTransactions.value = (txRes?.datos ?? []).filter(
      (t) => t.miRol === "Vendedor" && t.estado !== "Finalizado"
    );
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudo cargar la información de ofertas.",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

function abrirEditar(item: UsuarioOfertasResponse[number]) {
  if (item.estado !== "Activa") return;
  editingOffer.value = item;
  editCantidad.value =
    item.tipoOperacion === "Compra" ? item.montoRecibo : item.montoTengo;
  editModalOpen.value = true;
}

async function guardarEdicion(cantidad: number) {
  if (!editingOffer.value) return;
  saving.value = true;
  try {
    const body: OfertaUpdateRequest = { cantidad };
    await api(`/api/ofertas/${editingOffer.value.ofertaId}`, {
      method: "PUT",
      body,
    });
    toast.add({
      title: "Oferta actualizada",
      description: "La cantidad se actualizó correctamente.",
      color: "success",
    });
    editModalOpen.value = false;
    await fetchAllData();
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudo actualizar la oferta.",
      color: "error",
    });
  } finally {
    saving.value = false;
  }
}

function confirmarCancelar(item: UsuarioOfertasResponse[number]) {
  if (item.estado !== "Activa") return;
  cancellingOffer.value = item;
  confirmCancelOpen.value = true;
}

async function ejecutarCancelacion() {
  if (!cancellingOffer.value) return;
  deleting.value = true;
  try {
    await api(`/api/ofertas/${cancellingOffer.value.ofertaId}`, {
      method: "DELETE",
    });
    toast.add({ title: "Oferta cancelada", color: "success" });
    confirmCancelOpen.value = false;
    await fetchAllData();
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudo cancelar la oferta.",
      color: "error",
    });
  } finally {
    deleting.value = false;
  }
}

onMounted(async () => {
  if (route.query.view) {
    await navigateTo("/my-offers", { replace: true });
    return;
  }
  await fetchAllData();
});
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <main class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Mis ofertas</h1>
          <p class="text-sm text-neutral-500 mt-1">Gestiona tus ofertas publicadas.</p>
        </div>

        <UButton
          label="Nueva Oferta"
          color="primary"
          icon="i-lucide-plus"
          class="font-semibold cursor-pointer"
          @click="navigateTo('/offers/new')"
        />
      </div>

      <div v-if="loading" class="grid gap-4">
        <USkeleton v-for="i in 3" :key="i" class="h-28 rounded-xl" />
      </div>

      <template v-else>
        <MyOffersList
          :offers="offers"
          @open-in-progress="openInProgressOffer"
          @abrir-editar="abrirEditar"
          @confirmar-cancelar="confirmarCancelar"
        />
      </template>
    </main>

    <MyOffersEditModal
      v-model:open="editModalOpen"
      :saving="saving"
      :initial-cantidad="editCantidad"
      @submit="guardarEdicion"
    />

    <MyOffersCancelModal
      v-model:open="confirmCancelOpen"
      :deleting="deleting"
      @confirm="ejecutarCancelacion"
    />
  </div>
</template>
