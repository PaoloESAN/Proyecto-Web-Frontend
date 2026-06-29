<script setup lang="ts">
const props = defineProps<{
  selectedImage: string;
}>();

const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <!-- Modal para ver el comprobante en tamaño completo -->
  <UModal v-model:open="open" title="Vista Previa de Comprobante" :ui="{ content: 'max-w-4xl' }">
    <template #body>
      <div class="flex flex-col items-center">
        <div class="w-full overflow-auto max-h-[70vh] flex justify-center bg-neutral-100 dark:bg-neutral-900 rounded-lg p-2 border border-neutral-200 dark:border-neutral-800">
          <img :src="props.selectedImage" alt="Comprobante de Pago Completo" class="max-w-full h-auto object-contain rounded">
        </div>
      </div>
    </template>
    <template #footer="{ close }">
      <div class="w-full flex justify-end">
        <UButton label="Cerrar" color="neutral" variant="outline" @click="close" />
      </div>
    </template>
  </UModal>
</template>
