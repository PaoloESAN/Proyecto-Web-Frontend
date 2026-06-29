<script setup lang="ts">
const props = defineProps<{
  availableRoutes: Array<{
    path: string;
    linkPath: string;
    isDynamic: boolean;
    name: string;
  }>;
}>();

const emit = defineEmits<{
  (e: "navigate", linkPath: string): void;
}>();

const testTransactionId = defineModel<string>("test-transaction-id", { required: true });
const testOfferId = defineModel<string>("test-offer-id", { required: true });
</script>

<template>
  <div class="space-y-8">
    <!-- Configurador de Parámetros de Prueba -->
    <section class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-md space-y-4">
      <h2 class="text-lg font-bold flex items-center gap-2">
        <UIcon name="i-lucide-sliders-horizontal" class="text-primary size-5" />
        Configuración de Rutas Dinámicas (Simulación de IDs)
      </h2>
      <p class="text-xs text-neutral-500 dark:text-neutral-400">
        Modifica estos valores para cambiar el ID de destino al hacer clic en
        las rutas dinámicas como `/transaction/:id` o `/offers/:id`.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="ID de Transacción de prueba">
          <UInput
            v-model="testTransactionId"
            type="text"
            placeholder="1, 12, 100, etc."
            class="w-full"
            icon="i-lucide-message-square"
          />
        </UFormField>
        <UFormField label="ID de Oferta de prueba">
          <UInput
            v-model="testOfferId"
            type="text"
            placeholder="1, 5, 23, etc."
            class="w-full"
            icon="i-lucide-tag"
          />
        </UFormField>
      </div>
    </section>

    <!-- Listado de Rutas Detectadas -->
    <section class="space-y-4">
      <h2 class="text-xl font-bold flex items-center gap-2 px-1">
        <UIcon name="i-lucide-compass" class="text-primary size-6" />
        Páginas Registradas en la App ({{ props.availableRoutes.length }})
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <UCard
          v-for="route in props.availableRoutes"
          :key="route.path"
          class="cursor-pointer bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1.5 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-2xl hover:shadow-primary-500/10 hover:ring-1 hover:ring-primary-500/20"
          :ui="{ body: 'p-5' }"
          @click="emit('navigate', route.linkPath)"
        >
          <div class="flex flex-col space-y-3">
            <!-- Ruta en Grande -->
            <span class="text-xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">
              {{ route.path }}
            </span>

            <!-- Meta y Badge -->
            <div class="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <span class="font-mono text-[10px] truncate max-w-40" :title="route.name">
                {{ route.name }}
              </span>

              <span
                v-if="route.isDynamic"
                class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
              >
                Dinámica
              </span>
              <span
                v-else
                class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20"
              >
                Estática
              </span>
            </div>
          </div>
        </UCard>
      </div>
    </section>
  </div>
</template>
