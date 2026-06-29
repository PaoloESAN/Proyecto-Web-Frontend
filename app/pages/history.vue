<script setup lang="ts">
import type { TransaccionHistoryResponse } from "~/types";

definePageMeta({
  middleware: ["auth"],
  title: "Historial de Transacciones",
});

const toast = useToast();
const api = useApi();

const page = ref(1);
const pageSize = 10;

const data = ref<TransaccionHistoryResponse | null>(null);
const loading = ref(false);

async function fetchHistory() {
  loading.value = true;
  try {
    const params: Record<string, string | number> = {
      page: page.value,
      pageSize,
      estado: "Finalizado",
    };
    const res = await api<TransaccionHistoryResponse>(
      "/api/transacciones/history",
      { params }
    );
    data.value = res;
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudieron cargar las transacciones",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    loading.value = false;
  }
}

function irATransaccion(id: number) {
  navigateTo(`/transaction/${id}`);
}

onMounted(() => {
  fetchHistory();
});
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <main class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden mb-4">
        <div class="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <p class="text-sm text-neutral-500">Mostrando solo transacciones completadas.</p>
          <UButton label="Actualizar" color="primary" :loading="loading" @click="fetchHistory" />
        </div>

        <HistoryTable
          v-model:page="page"
          :data="data"
          :loading="loading"
          @ir-a-transaccion="irATransaccion"
          @refresh="fetchHistory"
        />
      </div>
    </main>
  </div>
</template>
