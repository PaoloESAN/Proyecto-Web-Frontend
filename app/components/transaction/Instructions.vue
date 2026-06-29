<script setup lang="ts">
const props = defineProps<{
  exactAmountToSend: { amount: number; currency: string };
  exactAmountToReceive: { amount: number; currency: string };
}>();

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
</script>

<template>
  <div class="space-y-6">
    <!-- Alerta informativa -->
    <div class="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3">
      <UIcon name="i-lucide-info" class="text-primary size-5 shrink-0 mt-0.5" />
      <div>
        <h3 class="text-sm font-bold text-primary-800 dark:text-primary-400">
          Instrucciones de pago
        </h3>
        <p class="text-xs text-primary-700/90 dark:text-primary-400/90 mt-1 flex flex-col gap-1">
          <span>1. Transfiere el monto a la cuenta bancaria de destino de la contraparte.</span>
          <span>2. Sube el voucher de pago para que la contraparte lo verifique.</span>
          <span>3. Una vez verificado el pago que recibiste, presiona "Confirmar Pago Correcto".</span>
        </p>
      </div>
    </div>

    <!-- Resumen de Envío y Recepción Exacto -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/20 rounded-xl">
      <div class="space-y-1">
        <span class="text-xs text-neutral-500 font-bold uppercase tracking-wider block">Debes Enviar Exactamente</span>
        <span class="text-2xl font-black text-rose-500 flex items-baseline gap-1 mt-0.5">
          {{ formatCurrency(props.exactAmountToSend.amount) }}
          <span class="text-sm font-bold">{{ props.exactAmountToSend.currency }}</span>
        </span>
      </div>
      <div class="space-y-1 sm:text-right border-t sm:border-t-0 sm:border-l border-neutral-200/50 dark:border-neutral-800/50 pt-3 sm:pt-0 sm:pl-4">
        <span class="text-xs text-neutral-500 font-bold uppercase tracking-wider block">Debes Recibir Exactamente</span>
        <span class="text-2xl font-black text-emerald-500 flex items-baseline gap-1 sm:justify-end mt-0.5">
          {{ formatCurrency(props.exactAmountToReceive.amount) }}
          <span class="text-sm font-bold">{{ props.exactAmountToReceive.currency }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
