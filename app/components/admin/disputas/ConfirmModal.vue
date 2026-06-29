<script setup lang="ts">
const props = defineProps<{
  pendingResolution: "A favor del comprador" | "A favor del vendedor" | null;
}>();

const emit = defineEmits<{
  (e: "confirm"): void;
}>();

const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <!-- Modal de confirmación para resolver disputa -->
  <UModal v-model:open="open" title="Confirmar Resolución de Disputa">
    <template #body>
      <div class="space-y-3">
        <p class="text-sm text-neutral-600 dark:text-neutral-300">
          ¿Estás seguro de que deseas resolver esta disputa <strong class="text-neutral-900 dark:text-white">{{ props.pendingResolution }}</strong>?
        </p>
        <div class="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 text-xs border border-neutral-100 dark:border-neutral-800/50 space-y-2">
          <p v-if="props.pendingResolution === 'A favor del comprador'" class="text-neutral-500 dark:text-neutral-400 leading-relaxed">
            <span class="font-bold text-red-500 uppercase block mb-1">Efecto de la resolución:</span>
            La transacción será cancelada y la oferta correspondiente volverá a estar <strong>Activa</strong> en el mercado para recibir solicitudes de intercambio.
          </p>
          <p v-else-if="props.pendingResolution === 'A favor del vendedor'" class="text-neutral-500 dark:text-neutral-400 leading-relaxed">
            <span class="font-bold text-green-500 uppercase block mb-1">Efecto de la resolución:</span>
            La transacción será marcada como <strong>Finalizada</strong> de manera definitiva en el sistema.
          </p>
        </div>
      </div>
    </template>
    <template #footer="{ close }">
      <div class="w-full flex justify-end gap-3">
        <UButton label="Cancelar" color="neutral" variant="outline" @click="close" />
        <UButton
          :label="props.pendingResolution === 'A favor del comprador' ? 'Confirmar a favor del Comprador' : 'Confirmar a favor del Vendedor'"
          :color="props.pendingResolution === 'A favor del comprador' ? 'error' : 'primary'"
          class="cursor-pointer font-semibold"
          @click="emit('confirm')"
        />
      </div>
    </template>
  </UModal>
</template>
