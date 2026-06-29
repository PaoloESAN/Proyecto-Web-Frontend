<script setup lang="ts">
import type { GetDisputesAdminResponse } from "~/types";

const props = defineProps<{
  disputes: GetDisputesAdminResponse["datos"];
  selectedDisputeId: number | undefined;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: "select", dispute: GetDisputesAdminResponse["datos"][number]): void;
}>();

const searchQuery = defineModel<string>({ required: true });

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-PE", { month: "short", day: "numeric", year: "numeric" }) +
    " - " +
    d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
  );
}

const filteredDisputes = computed(() => {
  if (!searchQuery.value) return props.disputes;
  const q = searchQuery.value.toLowerCase();
  return props.disputes.filter((d) => {
    const txId = `tx-${d.transaccion.transaccionId}`;
    const buyer = `${d.transaccion.comprador.nombres} ${d.transaccion.comprador.apellidos}`.toLowerCase();
    const seller = `${d.transaccion.vendedor.nombres} ${d.transaccion.vendedor.apellidos}`.toLowerCase();
    return txId.includes(q) || buyer.includes(q) || seller.includes(q);
  });
});
</script>

<template>
  <div class="w-105 shrink-0 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">
    <div class="p-5 border-b border-neutral-100 dark:border-neutral-800">
      <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Disputas Activas</h1>
      <div class="mt-3">
        <UInput v-model="searchQuery" placeholder="Buscar por ID o nombre..." icon="i-lucide-search" class="w-full" />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <template v-if="props.loading">
        <USkeleton v-for="i in 4" :key="i" class="h-28 rounded-lg animate-pulse" />
      </template>

      <template v-else-if="filteredDisputes.length > 0">
        <div
          v-for="d in filteredDisputes"
          :key="d.disputaId"
          class="rounded-lg border p-4 cursor-pointer transition-all duration-150"
          :class="
            props.selectedDisputeId === d.disputaId
              ? 'border-neutral-400 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 shadow-sm'
              : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-500 hover:shadow-sm'
          "
          @click="emit('select', d)"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-neutral-900 dark:text-white text-sm">TX-{{ d.transaccion.transaccionId }}</span>
            <span
              class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
              :class="
                d.estado === 'Abierta'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
              "
            >
              {{ d.estado === "Abierta" ? "Activa" : "Resuelta" }}
            </span>
          </div>

          <p class="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
            {{ d.transaccion.comprador.nombres }} {{ d.transaccion.comprador.apellidos }}
            <span class="text-neutral-300 dark:text-neutral-600 mx-1">vs</span>
            {{ d.transaccion.vendedor.nombres }} {{ d.transaccion.vendedor.apellidos }}
          </p>

          <div class="flex items-center justify-between">
            <span class="font-bold text-sm text-neutral-900 dark:text-white">{{ formatCurrency(d.transaccion.montoOperacion) }}</span>
            <span class="text-[11px] text-neutral-400">{{ formatDate(d.fechaApertura) }}</span>
          </div>
        </div>
      </template>

      <div v-else class="flex flex-col items-center justify-center py-12 text-neutral-400">
        <UIcon name="i-lucide-inbox" class="size-8 mb-2" />
        <p class="text-sm">No se encontraron disputas</p>
      </div>
    </div>
  </div>
</template>
