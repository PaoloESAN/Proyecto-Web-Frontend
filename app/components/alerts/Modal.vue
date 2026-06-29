<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

const props = defineProps<{
  creating: boolean;
}>();

const emit = defineEmits<{
  (e: "submit", data: { moneda: string; tipoCambioDeseado: number }): void;
}>();

const open = defineModel<boolean>("open", { required: true });

const monedas = ["USD", "EUR", "GBP", "MXN", "PEN"];

const schema = z.object({
  moneda: z.string().min(1, "Selecciona una moneda"),
  tipoCambioDeseado: z.number({ message: "Debe ser un número" }).positive("Debe ser mayor a 0"),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  moneda: "",
  tipoCambioDeseado: undefined,
});

watch(
  () => open.value,
  (newVal) => {
    if (!newVal) {
      state.moneda = "";
      state.tipoCambioDeseado = undefined;
    }
  }
);

function handleFormSubmit(event: FormSubmitEvent<Schema>) {
  emit("submit", event.data);
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Nueva Alerta"
    description="Configura una alerta para recibir notificaciones cuando el tipo de cambio alcance el valor deseado."
  >
    <template #body>
      <UForm id="alerta-form" :schema="schema" :state="state" class="space-y-4" @submit="handleFormSubmit">
        <UFormField name="moneda" label="Moneda" required>
          <USelect v-model="state.moneda" :items="monedas" placeholder="Selecciona una moneda" class="w-full" />
        </UFormField>
        <UFormField name="tipoCambioDeseado" label="Tipo de Cambio Deseado" required>
          <UInput v-model="state.tipoCambioDeseado" type="number" step="0.01" placeholder="Ej: 3.75" class="w-full" />
        </UFormField>
      </UForm>
    </template>
    <template #footer="{ close }">
      <UButton label="Cancelar" color="neutral" variant="outline" @click="close" />
      <UButton type="submit" form="alerta-form" label="Crear alerta" :loading="props.creating" />
    </template>
  </UModal>
</template>
