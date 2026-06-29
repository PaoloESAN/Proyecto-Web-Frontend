<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

const props = defineProps<{
  monedas: Array<{ label: string; value: string }>;
  loadingAccounts: boolean;
  submitting: boolean;
  loadingQuote: boolean;
  quote: { rate: number; entregas: number; recibes: number } | null;
  metodosPagoItems: Array<{ label: string; value: number | null; disabled?: boolean; suffix?: string }>;
  previewEntrega: number;
  previewRecibe: number;
}>();

interface NewOfferState {
  metodoPagoId: number | undefined;
  tipoOperacion: "Compra" | "Venta";
  monedaTengo: string;
  monedaRecibo: string;
  cantidad: number | undefined;
}

const emit = defineEmits<{
  (e: "submit", eventData: NewOfferState): void;
}>();

const state = defineModel<NewOfferState>("state", { required: true });

const schema = z
  .object({
    metodoPagoId: z.number({ message: "Selecciona un método de pago" }).positive(),
    tipoOperacion: z.enum(["Compra", "Venta"], { message: "Selecciona una operación" }),
    monedaTengo: z.string().min(1, "Selecciona la moneda que tienes"),
    monedaRecibo: z.string().min(1, "Selecciona la moneda que quieres recibir"),
    cantidad: z.number({ message: "Debe ser un número" }).positive("Debe ser mayor a 0"),
  })
  .refine((v) => v.monedaTengo !== v.monedaRecibo, {
    message: "Las monedas deben ser diferentes",
    path: ["monedaRecibo"],
  });

type Schema = z.output<typeof schema>;

const cantidadLabel = computed(() =>
  state.value.tipoOperacion === "Compra"
    ? `Cantidad que quieres recibir (${state.value.monedaRecibo || "---"})`
    : `Cantidad que tienes para vender (${state.value.monedaTengo || "---"})`
);

function handleFormSubmit(event: FormSubmitEvent<Schema>) {
  emit("submit", event.data);
}
</script>

<template>
  <UForm :schema="schema" :state="state" class="space-y-8" @submit="handleFormSubmit">
    <section class="space-y-5">
      <div class="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider">
        <UIcon name="i-lucide-repeat" class="size-3.5" />
        Datos de la oferta
      </div>

      <div class="grid gap-4 p-4 bg-neutral-50/50 dark:bg-neutral-800/20 rounded-xl border border-neutral-100/50 dark:border-neutral-800/50">
        <UFormField name="tipoOperacion" label="¿Qué deseas hacer?" required>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              :class="[
                'relative flex items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer',
                state.tipoOperacion === 'Compra'
                  ? 'border-primary bg-primary/5 text-primary shadow-sm'
                  : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
              ]"
              @click="state.tipoOperacion = 'Compra'"
            >
              <div :class="['size-10 rounded-lg flex items-center justify-center transition-colors', state.tipoOperacion === 'Compra' ? 'bg-primary/10' : 'bg-neutral-100 dark:bg-neutral-700']">
                <UIcon name="i-lucide-arrow-down-to-line" class="size-5" />
              </div>
              <div class="text-left">
                <p class="text-sm font-bold">Comprar</p>
                <p class="text-xs text-muted">Ingresas cuánto quieres recibir</p>
              </div>
            </button>
            <button
              type="button"
              :class="[
                'relative flex items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer',
                state.tipoOperacion === 'Venta'
                  ? 'border-primary bg-primary/5 text-primary shadow-sm'
                  : 'border-neutral-200/60 dark:border-neutral-700/50 bg-neutral-50/80 dark:bg-neutral-800/20 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40'
              ]"
              @click="state.tipoOperacion = 'Venta'"
            >
              <div :class="['size-10 rounded-lg flex items-center justify-center transition-colors', state.tipoOperacion === 'Venta' ? 'bg-primary/10' : 'bg-neutral-200/70 dark:bg-neutral-700/50']">
                <UIcon name="i-lucide-arrow-up-from-line" class="size-5" />
              </div>
              <div class="text-left">
                <p class="text-sm font-bold">Vender</p>
                <p class="text-xs text-muted">Ingresas cuánto quieres entregar</p>
              </div>
            </button>
          </div>
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField name="monedaTengo" label="Moneda que tienes" required>
            <USelect v-model="state.monedaTengo" :items="props.monedas" placeholder="Selecciona" class="w-full" />
          </UFormField>

          <UFormField name="monedaRecibo" label="Moneda que quieres recibir" required>
            <USelect v-model="state.monedaRecibo" :items="props.monedas" placeholder="Selecciona" class="w-full" />
          </UFormField>
        </div>

        <UFormField name="cantidad" :label="cantidadLabel" required>
          <UInput v-model.number="state.cantidad" type="number" step="0.01" placeholder="Ej: 1000" class="w-full" :min="0" />
        </UFormField>

        <UFormField name="metodoPagoId" label="Tu cuenta bancaria (de la moneda que tienes)" required>
          <USelect
            v-if="!props.loadingAccounts"
            v-model="state.metodoPagoId"
            :items="props.metodosPagoItems"
            placeholder="Elige una cuenta"
            class="w-full"
          />
          <UInput v-else disabled placeholder="Cargando cuentas..." class="w-full" />
        </UFormField>
      </div>
    </section>

    <section class="space-y-5">
      <div class="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider">
        <UIcon name="i-lucide-calculator" class="size-3.5" />
        Vista previa de conversión
      </div>

      <div class="p-4 bg-neutral-50/50 dark:bg-neutral-800/20 rounded-xl border border-neutral-100/50 dark:border-neutral-800/50 space-y-2">
        <p v-if="props.loadingQuote" class="text-sm text-neutral-500">Calculando tipo de cambio...</p>
        <template v-else-if="props.quote">
          <p class="text-sm text-neutral-500">Tipo de cambio actual: <strong>{{ props.quote.rate.toFixed(6) }}</strong></p>
          <p class="text-sm">Tú entregas: <strong>{{ props.previewEntrega.toLocaleString() }} {{ state.monedaTengo }}</strong></p>
          <p class="text-sm">Tú recibes: <strong>{{ props.previewRecibe.toLocaleString() }} {{ state.monedaRecibo }}</strong></p>
        </template>
        <p v-else class="text-sm text-neutral-500">Completa monedas y cantidad para ver el cálculo automático.</p>
      </div>
    </section>

    <div class="flex items-center justify-end gap-3 pt-6 border-t border-neutral-100 dark:border-neutral-800">
      <UButton label="Cancelar" color="neutral" variant="outline" size="lg" class="cursor-pointer" @click="navigateTo('/my-offers')" />
      <UButton type="submit" label="Publicar oferta" color="primary" size="lg" class="cursor-pointer" :loading="props.submitting" icon="i-lucide-rocket" trailing />
    </div>
  </UForm>
</template>
