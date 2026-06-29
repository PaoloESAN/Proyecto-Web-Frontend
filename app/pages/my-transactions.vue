<script setup lang="ts">
import type { TransaccionHistoryResponse } from "~/types";

definePageMeta({
  middleware: ["auth"],
  title: "Mis transacciones",
});

const api = useApi();
const toast = useToast();

const loading = ref(false);
const myTransactions = ref<TransaccionHistoryResponse["datos"]>([]);

async function fetchData() {
  loading.value = true;
  try {
    const txRes = await api<TransaccionHistoryResponse>(
      "/api/transacciones/history",
      {
        params: { page: 1, pageSize: 200 },
      }
    );

    myTransactions.value = (txRes?.datos ?? []).filter(
      (t) => t.estado !== "Finalizado"
    );
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudo cargar la información de transacciones.",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <main class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Mis transacciones</h1>
        <p class="text-sm text-neutral-500 mt-1">Transacciones donde participas (como comprador o vendedor).</p>
      </div>

      <div v-if="loading" class="grid gap-4">
        <USkeleton v-for="i in 3" :key="i" class="h-28 rounded-xl" />
      </div>

      <template v-else>
        <MyTransactionsList :transactions="myTransactions" />
      </template>
    </main>
  </div>
</template>
