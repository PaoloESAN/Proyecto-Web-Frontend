<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { MetodoPagoResponse } from "~/types";

const props = defineProps<{
  editingAccountId: number | null;
  initialData: Partial<MetodoPagoResponse>;
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: "submit", data: AccountSchema): void;
}>();

const open = defineModel<boolean>("open", { required: true });

const accountSchema = z.object({
  banco: z.string().min(1, "El banco es requerido"),
  numeroCuenta: z.string().min(1, "El número de cuenta es requerido"),
  nombreTitular: z.string().min(1, "El nombre del titular es requerido"),
  tipoMoneda: z.string().min(1, "Selecciona una moneda"),
});

type AccountSchema = z.output<typeof accountSchema>;

const accountState = reactive<Partial<AccountSchema>>({
  banco: "",
  numeroCuenta: "",
  nombreTitular: "",
  tipoMoneda: "USD",
});

const monedas = [
  { label: "USD - Dólar Estadounidense", value: "USD" },
  { label: "EUR - Euro", value: "EUR" },
  { label: "GBP - Libra Esterlina", value: "GBP" },
  { label: "MXN - Peso Mexicano", value: "MXN" },
  { label: "PEN - Sol Peruano", value: "PEN" },
];

watch(
  () => open.value,
  (newVal) => {
    if (newVal) {
      accountState.banco = props.initialData.banco ?? "";
      accountState.numeroCuenta = props.initialData.numeroCuenta ?? "";
      accountState.nombreTitular = props.initialData.nombreTitular ?? "";
      accountState.tipoMoneda = props.initialData.tipoMoneda ?? "USD";
    }
  }
);

function handleFormSubmit(event: FormSubmitEvent<AccountSchema>) {
  emit("submit", event.data);
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="props.editingAccountId ? 'Editar cuenta bancaria' : 'Agregar cuenta bancaria'"
    :description="
      props.editingAccountId
        ? 'Actualiza los datos de tu cuenta bancaria.'
        : 'Ingresa los datos de tu cuenta para recibir pagos.'
    "
  >
    <template #body>
      <UForm
        id="account-form"
        :schema="accountSchema"
        :state="accountState"
        class="space-y-4"
        @submit="handleFormSubmit"
      >
        <UFormField name="banco" label="Banco" required>
          <UInput v-model="accountState.banco" placeholder="Ej: Banco Santander" class="w-full" />
        </UFormField>
        <UFormField name="numeroCuenta" label="Número de cuenta" required>
          <UInput v-model="accountState.numeroCuenta" placeholder="Ej: 1234 5678 9012 3456" class="w-full" />
        </UFormField>
        <UFormField name="nombreTitular" label="Titular" required>
          <UInput v-model="accountState.nombreTitular" placeholder="Nombre del titular" class="w-full" />
        </UFormField>
        <UFormField name="tipoMoneda" label="Moneda" required>
          <USelect v-model="accountState.tipoMoneda" :items="monedas" class="w-full" />
        </UFormField>
      </UForm>
    </template>
    <template #footer="{ close }">
      <UButton label="Cancelar" color="neutral" variant="outline" @click="close" />
      <UButton
        type="submit"
        form="account-form"
        :label="props.editingAccountId ? 'Guardar cambios' : 'Guardar cuenta'"
        :loading="props.saving"
      />
    </template>
  </UModal>
</template>
