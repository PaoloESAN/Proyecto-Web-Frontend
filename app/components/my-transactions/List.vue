<script setup lang="ts">
import type { TransaccionHistoryResponse } from "~/types";

const props = defineProps<{
  transactions: TransaccionHistoryResponse["datos"];
}>();

function formatAmount(value: number) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function roleColor(rol: "Comprador" | "Vendedor") {
  return rol === "Comprador" ? "primary" : "secondary";
}

function getAmountToSend(tx: TransaccionHistoryResponse["datos"][number]) {
  return tx.miRol === "Comprador"
    ? { amount: tx.montoTengo, currency: tx.monedaTengo }
    : { amount: tx.montoRecibo, currency: tx.monedaRecibo };
}

function getAmountToReceive(tx: TransaccionHistoryResponse["datos"][number]) {
  return tx.miRol === "Comprador"
    ? { amount: tx.montoRecibo, currency: tx.monedaRecibo }
    : { amount: tx.montoTengo, currency: tx.monedaTengo };
}
</script>

<template>
  <div v-if="props.transactions.length === 0" class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-16 text-center">
    <p class="text-neutral-500 font-medium">Aún no tienes transacciones</p>
    <p class="text-sm text-neutral-400 mt-1">Cuando inicies o recibas una operación aparecerá aquí.</p>
  </div>

  <div v-else class="grid gap-4">
    <NuxtLink
      v-for="tx in props.transactions"
      :key="tx.transaccionId"
      :to="`/transaction/${tx.transaccionId}`"
      class="group block rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-5 space-y-4 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30 transition-all duration-200"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-lg font-extrabold text-neutral-900 dark:text-white">Transacción #{{ tx.transaccionId }}</p>
          <p class="text-xs sm:text-sm text-neutral-500 mt-0.5 truncate">
            Oferta #{{ tx.ofertaId }} · {{ tx.tipoOperacion }} · {{ tx.monedaTengo }} → {{ tx.monedaRecibo }}
          </p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <UBadge :color="roleColor(tx.miRol)" variant="subtle">{{ tx.miRol }}</UBadge>
          <CommonStatusBadge :estado="tx.estado" />
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-4 text-sm">
        <div class="rounded-xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/30 p-4">
          <p class="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold mb-1">Debes enviar</p>
          <p class="text-lg font-extrabold text-rose-500">
            {{ formatAmount(getAmountToSend(tx).amount) }} {{ getAmountToSend(tx).currency }}
          </p>
        </div>

        <div class="rounded-xl border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 p-4">
          <p class="text-[11px] uppercase tracking-wide text-primary/80 font-semibold mb-1">Debes recibir</p>
          <p class="text-lg font-extrabold text-emerald-500">
            {{ formatAmount(getAmountToReceive(tx).amount) }} {{ getAmountToReceive(tx).currency }}
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-4 text-xs text-neutral-400">
        <p>Iniciada: {{ new Date(tx.fechaInicio).toLocaleString() }}</p>
        <p class="font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Ir a la sala de transacción
          <UIcon name="i-lucide-arrow-right" class="size-3 ml-1 inline-block" />
        </p>
      </div>
    </NuxtLink>
  </div>
</template>
