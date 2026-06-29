<script setup lang="ts">
const props = defineProps<{
  deleting: boolean;
}>();

const emit = defineEmits<{
  (e: "confirm"): void;
}>();

const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <UModal v-model:open="open" title="Cancelar oferta">
    <template #body>
      <p class="text-sm">¿Seguro que deseas cancelar esta oferta?</p>
    </template>
    <template #footer>
      <div class="flex gap-2 justify-end w-full">
        <UButton label="No, mantener" color="neutral" variant="outline" @click="open = false" />
        <UButton label="Sí, cancelar" color="error" :loading="props.deleting" @click="emit('confirm')" />
      </div>
    </template>
  </UModal>
</template>
