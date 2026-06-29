<script setup lang="ts">
const props = defineProps<{
  accountLabel: string;
}>();

const emit = defineEmits<{
  (e: "confirm"): void;
}>();

const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <UModal
    v-model:open="open"
    title="Eliminar cuenta"
    description="Esta acción no se puede deshacer. ¿Estás seguro de eliminar esta cuenta bancaria?"
  >
    <template #body>
      <div class="flex items-center gap-3 p-3 bg-muted rounded-lg">
        <UIcon name="i-lucide-alert-triangle" class="size-5 text-warning shrink-0" />
        <div>
          <p class="text-sm font-medium">Se eliminará:</p>
          <p class="text-sm text-muted">{{ props.accountLabel }}</p>
        </div>
      </div>
    </template>
    <template #footer="{ close }">
      <UButton label="Cancelar" color="neutral" variant="outline" @click="close" />
      <UButton
        label="Eliminar"
        color="error"
        icon="i-lucide-trash-2"
        class="cursor-pointer"
        @click="emit('confirm')"
      />
    </template>
  </UModal>
</template>
