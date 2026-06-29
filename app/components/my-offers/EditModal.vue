<script setup lang="ts">
const props = defineProps<{
  saving: boolean;
  initialCantidad: number;
}>();

const emit = defineEmits<{
  (e: "submit", cantidad: number): void;
}>();

const open = defineModel<boolean>("open", { required: true });

const cantidad = ref(0);

watch(
  () => open.value,
  (newVal) => {
    if (newVal) {
      cantidad.value = props.initialCantidad;
    }
  }
);
</script>

<template>
  <UModal v-model:open="open" title="Editar cantidad">
    <template #body>
      <UFormField label="Nueva cantidad" required>
        <UInput v-model.number="cantidad" type="number" step="0.01" :min="0" class="w-full" />
      </UFormField>
    </template>
    <template #footer>
      <div class="flex gap-2 justify-end w-full">
        <UButton label="Cerrar" color="neutral" variant="outline" @click="open = false" />
        <UButton label="Guardar" color="primary" :loading="props.saving" @click="emit('submit', cantidad)" />
      </div>
    </template>
  </UModal>
</template>
