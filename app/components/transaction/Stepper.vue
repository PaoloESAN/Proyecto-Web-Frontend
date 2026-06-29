<script setup lang="ts">
const props = defineProps<{
  estado: string;
}>();
</script>

<template>
  <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
    <h2 class="text-xs font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase mb-4">
      Progreso del Intercambio
    </h2>
    <div class="grid grid-cols-3 gap-2 relative">
      <!-- Paso 1 -->
      <div class="flex flex-col items-center text-center space-y-1.5">
        <div
          class="size-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors"
          :class="[
            props.estado === 'Pendiente'
              ? 'bg-amber-500/10 text-amber-500 border-amber-500'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-transparent',
            ['Pagado', 'Finalizado', 'Disputa'].includes(props.estado)
              ? 'bg-emerald-500 text-white border-transparent'
              : '',
          ]"
        >
          <UIcon
            v-if="['Pagado', 'Finalizado', 'Disputa'].includes(props.estado)"
            name="i-lucide-check"
            class="size-4"
          />
          <span v-else>1</span>
        </div>
        <span
          class="text-xs font-bold"
          :class="props.estado === 'Pendiente' ? 'text-amber-500' : 'text-neutral-400'"
        >
          Pago Pendiente
        </span>
      </div>

      <!-- Paso 2 -->
      <div class="flex flex-col items-center text-center space-y-1.5">
        <div
          class="size-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors"
          :class="[
            props.estado === 'Pagado'
              ? 'bg-primary/10 text-primary border-primary'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-transparent',
            props.estado === 'Finalizado' ? 'bg-emerald-500 text-white border-transparent' : '',
            props.estado === 'Disputa' ? 'bg-red-500 text-white border-transparent' : '',
          ]"
        >
          <UIcon v-if="props.estado === 'Finalizado'" name="i-lucide-check" class="size-4" />
          <UIcon v-else-if="props.estado === 'Disputa'" name="i-lucide-alert-triangle" class="size-4" />
          <span v-else>2</span>
        </div>
        <span
          class="text-xs font-bold"
          :class="props.estado === 'Pagado' ? 'text-primary' : 'text-neutral-400'"
        >
          {{ props.estado === 'Disputa' ? 'Disputa' : 'Verificando' }}
        </span>
      </div>

      <!-- Paso 3 -->
      <div class="flex flex-col items-center text-center space-y-1.5">
        <div
          class="size-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors"
          :class="[
            props.estado === 'Finalizado'
              ? 'bg-emerald-500 text-white border-transparent'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-transparent',
            props.estado === 'Cancelado' ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-500' : '',
          ]"
        >
          <span v-if="props.estado === 'Cancelado'">❌</span>
          <UIcon v-else-if="props.estado === 'Finalizado'" name="i-lucide-party-popper" class="size-4" />
          <span v-else>3</span>
        </div>
        <span
          class="text-xs font-bold"
          :class="props.estado === 'Finalizado' ? 'text-emerald-500' : 'text-neutral-400'"
        >
          Finalizado
        </span>
      </div>
    </div>
  </div>
</template>
