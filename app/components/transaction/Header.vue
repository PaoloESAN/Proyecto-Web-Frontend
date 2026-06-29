<script setup lang="ts">
const props = defineProps<{
  transactionId: number;
  estado: string;
}>();
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div class="flex items-center gap-2">
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
        Sala de Transacción
        <span class="font-mono text-sm px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-md">
          #{{ props.transactionId }}
        </span>
      </h1>
    </div>
    <div class="flex items-center gap-2">
      <CommonStatusBadge :estado="props.estado" />
    </div>
  </div>
</template>
