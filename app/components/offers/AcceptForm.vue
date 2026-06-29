<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { OfertaDetalleResponse } from "~/types";

const props = defineProps<{
  offer: OfertaDetalleResponse;
  hasMatchingAccounts: boolean;
  metodosPagoOptions: Array<{ label: string; value: number }>;
  isOwnOffer: boolean;
  transactionLoading: boolean;
}>();

const emit = defineEmits<{
  (e: "submit", metodoPagoId: number): void;
}>();

const state = reactive({
  metodoPagoId: undefined as number | undefined,
});

const schema = z.object({
  metodoPagoId: z.number({ message: "Selecciona una cuenta bancaria" }),
});

type Schema = z.output<typeof schema>;

// Watch for initial auto-selection if any options are loaded
watch(
  () => props.metodosPagoOptions,
  (newVal) => {
    if (newVal && newVal.length > 0 && !state.metodoPagoId) {
      state.metodoPagoId = newVal[0].value;
    }
  },
  { immediate: true }
);

function handleFormSubmit(_event: FormSubmitEvent<Schema>) {
  if (state.metodoPagoId) {
    emit("submit", state.metodoPagoId);
  }
}
</script>

<template>
  <section class="bg-white dark:bg-neutral-900 border border-default rounded-2xl p-6 sm:p-7 space-y-4">
    <div>
      <h2 class="text-lg font-bold text-neutral-900 dark:text-white">Tomar oferta</h2>
      <p class="text-sm text-neutral-500 mt-1">Selecciona la cuenta donde deseas recibir {{ props.offer.monedaRecibo }}.</p>
    </div>

    <UForm :schema="schema" :state="state" class="space-y-4" @submit="handleFormSubmit">
      <UFormField
        v-if="props.hasMatchingAccounts"
        name="metodoPagoId"
        :label="`Tu cuenta para recibir (${props.offer.monedaRecibo})`"
        required
      >
        <USelect
          v-model.number="state.metodoPagoId"
          :items="props.metodosPagoOptions"
          placeholder="Selecciona una cuenta"
          class="w-full"
        />
      </UFormField>

      <UAlert
        v-if="!props.hasMatchingAccounts"
        color="warning"
        variant="soft"
        icon="i-lucide-alert-triangle"
        :title="`No tienes cuentas en ${props.offer.monedaRecibo}`"
        :description="`Para tomar esta oferta necesitas registrar una cuenta bancaria en ${props.offer.monedaRecibo}.`"
      />

      <div class="flex items-center gap-2 pt-1">
        <UButton
          v-if="props.hasMatchingAccounts"
          type="submit"
          label="Iniciar transacción"
          color="primary"
          size="lg"
          block
          class="cursor-pointer font-semibold"
          :loading="props.transactionLoading"
          :disabled="props.isOwnOffer"
        />
        <UButton
          v-if="!props.hasMatchingAccounts"
          label="Agregar cuenta"
          color="warning"
          variant="outline"
          icon="i-lucide-wallet"
          block
          class="cursor-pointer"
          @click="navigateTo('/profile')"
        />
      </div>
    </UForm>
  </section>
</template>
