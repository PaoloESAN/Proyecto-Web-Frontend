<script setup lang="ts">
import type { MetodoPagoResponse } from "~/types";

const props = defineProps<{
  destinationAccount: MetodoPagoResponse | null;
  myReceivingAccount: MetodoPagoResponse | null;
}>();
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Cuenta Destino (A donde envías el pago) -->
    <div class="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30">
      <h4 class="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
        <UIcon name="i-lucide-arrow-up-right" class="text-rose-500" />
        Cuenta Destino (Enviar Pago)
      </h4>
      <div v-if="props.destinationAccount" class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span class="text-xs text-neutral-500 block">Banco</span>
          <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ props.destinationAccount.banco }}</span>
        </div>
        <div>
          <span class="text-xs text-neutral-500 block">Moneda de Cuenta</span>
          <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ props.destinationAccount.tipoMoneda }}</span>
        </div>
        <div class="col-span-2">
          <span class="text-xs text-neutral-500 block">Número de Cuenta</span>
          <span class="font-mono font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-sm select-all">
            {{ props.destinationAccount.numeroCuenta }}
          </span>
        </div>
        <div class="col-span-2">
          <span class="text-xs text-neutral-500 block">Titular de la Cuenta</span>
          <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ props.destinationAccount.nombreTitular }}</span>
        </div>
      </div>
      <div v-else class="p-6 text-center text-xs text-neutral-400">
        <UIcon name="i-lucide-hourglass" class="animate-spin mr-1.5" />
        Esperando que la contraparte registre su método de pago...
      </div>
    </div>

    <!-- Tu Cuenta Receptora (Donde recibes el pago) -->
    <div class="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30">
      <h4 class="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
        <UIcon name="i-lucide-arrow-down-left" class="text-emerald-500" />
        Tu Cuenta de Recepción (Recibir Pago)
      </h4>
      <div v-if="props.myReceivingAccount" class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span class="text-xs text-neutral-500 block">Banco</span>
          <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ props.myReceivingAccount.banco }}</span>
        </div>
        <div>
          <span class="text-xs text-neutral-500 block">Moneda de Cuenta</span>
          <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ props.myReceivingAccount.tipoMoneda }}</span>
        </div>
        <div class="col-span-2">
          <span class="text-xs text-neutral-500 block">Número de Cuenta</span>
          <span class="font-mono font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-sm select-all">
            {{ props.myReceivingAccount.numeroCuenta }}
          </span>
        </div>
        <div class="col-span-2">
          <span class="text-xs text-neutral-500 block">Titular de la Cuenta</span>
          <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ props.myReceivingAccount.nombreTitular }}</span>
        </div>
      </div>
      <div v-else class="p-6 text-center text-xs text-neutral-400">
        <UIcon name="i-lucide-hourglass" class="animate-spin mr-1.5" />
        Cargando cuenta de recepción...
      </div>
    </div>
  </div>
</template>
