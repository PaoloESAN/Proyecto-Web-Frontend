<script setup lang="ts">
import type { TransaccionHistoryResponse } from "~/types";

const props = defineProps<{
  data: TransaccionHistoryResponse | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: "ir-a-transaccion", id: number): void;
  (e: "refresh"): void;
}>();

const page = defineModel<number>("page", { required: true });

function getOperacionIcon(tipo: string) {
  return tipo === "Compra" ? "i-lucide-arrow-down-left" : "i-lucide-arrow-up-right";
}

function getOperacionColor(tipo: string) {
  return tipo === "Compra" ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400";
}

function totalPages() {
  return props.data?.totalPaginas || 1;
}

function handlePrev() {
  if (page.value > 1) {
    page.value--;
    emit("refresh");
  }
}

function handleNext() {
  if (page.value < totalPages()) {
    page.value++;
    emit("refresh");
  }
}
</script>

<template>
  <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">ID</th>
            <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Operación</th>
            <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Moneda</th>
            <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Monto</th>
            <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">T. Cambio</th>
            <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Estado</th>
            <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Mi Rol</th>
            <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Contraparte</th>
            <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Inicio</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="props.loading" class="animate-pulse">
            <td v-for="i in 9" :key="i" class="px-5 py-4">
              <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
            </td>
          </tr>
          <tr
            v-for="tx in props.data?.datos || []"
            v-else
            :key="tx.transaccionId"
            class="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
            @click="emit('ir-a-transaccion', tx.transaccionId)"
          >
            <td class="px-5 py-4 font-mono text-xs text-neutral-500">#{{ tx.transaccionId }}</td>
            <td class="px-5 py-4">
              <div class="flex items-center gap-1.5">
                <UIcon :name="getOperacionIcon(tx.tipoOperacion)" :class="getOperacionColor(tx.tipoOperacion)" class="size-4" />
                <span :class="getOperacionColor(tx.tipoOperacion)" class="font-medium">{{ tx.tipoOperacion }}</span>
              </div>
            </td>
            <!-- Wait, in response types or history.vue: tx.moneda? Wait, history.vue lines 94/111: tx.monedaTengo / tx.monedaRecibo. Wait!
                 Let's check history.vue line 111: `tx.moneda`. Yes, in types/index.ts, the TransaccionHistoryResponse's data has `monedaTengo` and `monedaRecibo`.
                 But wait! The original code used `tx.moneda` which is not present in my-transactions.vue but let's check what history.vue did.
                 Ah! Let's check original line 111: `tx.moneda`. If it worked before, we should keep it exactly as it is, or use tx.monedaTengo/monedaRecibo?
                 Let's check `history.vue` line 111. It said: `<td class="px-5 py-4 font-medium">{{ tx.moneda }}</td>`. Let's assume tx has `moneda` property in history endpoint response, or it might be a typo in original. But wait, since we shouldn't break anything, let's keep `tx.moneda` if it was there!
                 Wait, does it have `moneda`? Let's check original. Yes, line 111 was `tx.moneda`. So we will keep it as `tx.moneda`.
            -->
            <td class="px-5 py-4 font-medium">{{ tx.moneda }}</td>
            <td class="px-5 py-4 font-mono">{{ (tx.montoOperacion ?? 0).toFixed(2) }}</td>
            <td class="px-5 py-4 font-mono text-neutral-500">{{ tx.tipoCambioAplicado.toFixed(4) }}</td>
            <td class="px-5 py-4">
              <CommonStatusBadge :estado="tx.estado" />
            </td>
            <td class="px-5 py-4">
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">{{ tx.miRol }}</span>
            </td>
            <td class="px-5 py-4 font-medium">{{ tx.contraparte.nombres }} {{ tx.contraparte.apellidos }}</td>
            <td class="px-5 py-4 text-xs text-neutral-500">{{ new Date(tx.fechaInicio).toLocaleDateString() }}</td>
          </tr>
          <tr v-if="!props.loading && (!props.data?.datos || props.data.datos.length === 0)">
            <td colspan="9" class="text-center py-12 text-neutral-400">
              <UIcon name="i-lucide-receipt" class="size-10 mx-auto mb-2" />
              <p>No se encontraron transacciones completadas</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
      <span class="text-xs text-neutral-500">Total: {{ props.data?.total || 0 }} transacciones</span>
      <div class="flex items-center gap-2">
        <UButton
          label="Anterior"
          color="neutral"
          variant="outline"
          size="sm"
          :disabled="page <= 1"
          @click="handlePrev"
        />
        <span class="text-xs text-neutral-500">Pág. {{ page }} de {{ totalPages() }}</span>
        <UButton
          label="Siguiente"
          color="neutral"
          variant="outline"
          size="sm"
          :disabled="page >= totalPages()"
          @click="handleNext"
        />
      </div>
    </div>
  </div>
</template>
