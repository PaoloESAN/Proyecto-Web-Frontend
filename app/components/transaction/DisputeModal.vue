<script setup lang="ts">
const props = defineProps<{
  openingDispute: boolean;
}>();

const emit = defineEmits<{
  (e: "confirm"): void;
}>();

const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <UModal
    v-model:open="open"
    title="¿Seguro que deseas abrir una disputa?"
    description="Al iniciar una disputa, la transacción quedará retenida temporalmente y se notificará a un administrador de soporte técnico para que revise los comprobantes de transferencia y los chats de ambas partes. Esta acción no se puede revertir."
    :ui="{ footer: 'justify-end' }"
  >
    <template #footer>
      <UButton
        label="Cancelar"
        color="neutral"
        variant="outline"
        class="font-bold py-2 justify-center cursor-pointer"
        @click="open = false"
      />
      <UButton
        label="Iniciar Disputa"
        color="error"
        class="font-bold py-2 justify-center cursor-pointer"
        :loading="props.openingDispute"
        @click="emit('confirm')"
      />
    </template>
  </UModal>
</template>
