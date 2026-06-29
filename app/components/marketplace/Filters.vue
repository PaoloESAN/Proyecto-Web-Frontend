<script setup lang="ts">
const props = defineProps<{
  currencyOptions: Array<{ label: string; value: string }>;
  ordenarOptions: Array<{ label: string; value: string }>;
  misOfertasOptions: Array<{ label: string; value: number }>;
  loadingMatches: boolean;
  monedaMontoLabel: string;
}>();

const emit = defineEmits<{
  (e: "limpiar"): void;
}>();

const tipoOperacion = defineModel<string>("tipo-operacion", { required: true });
const monedaOrigen = defineModel<string>("moneda-origen", { required: true });
const monedaDestino = defineModel<string>("moneda-destino", { required: true });
const monedaMontoRecibe = defineModel<string>("moneda-monto-recibe", { required: true });
const montoRecibeMin = defineModel<number | undefined>("monto-recibe-min", { required: true });
const montoRecibeMax = defineModel<number | undefined>("monto-recibe-max", { required: true });
const calificacionMin = defineModel<number>("calificacion-min", { required: true });
const ordenarPor = defineModel<string>("ordenar-por", { required: true });
const matchingOfferId = defineModel<number>("matching-offer-id", { required: true });

const ALL = "ALL";
</script>

<template>
  <aside class="bg-white dark:bg-neutral-900 border border-default rounded-xl p-4 space-y-5 h-fit lg:mt-10">
    <div class="flex items-center justify-between">
      <p class="text-xs uppercase text-neutral-400 font-semibold">Filtros</p>
      <UButton
        label="Limpiar"
        color="neutral"
        variant="link"
        size="xs"
        class="p-0 cursor-pointer"
        @click="emit('limpiar')"
      />
    </div>

    <!-- Tipo de Operacion -->
    <div class="space-y-2">
      <p class="text-xs font-semibold text-neutral-500">Operación</p>
      <div class="grid grid-cols-3 gap-1 bg-neutral-100 dark:bg-neutral-800/40 rounded-xl p-1">
        <button
          type="button"
          :class="[
            'text-xs font-semibold rounded-lg py-1.5 transition cursor-pointer',
            tipoOperacion === ALL
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          ]"
          @click="tipoOperacion = ALL"
        >
          Todos
        </button>
        <button
          type="button"
          :class="[
            'text-xs font-semibold rounded-lg py-1.5 transition cursor-pointer',
            tipoOperacion === 'Compra'
              ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          ]"
          @click="tipoOperacion = 'Compra'"
        >
          Compra
        </button>
        <button
          type="button"
          :class="[
            'text-xs font-semibold rounded-lg py-1.5 transition cursor-pointer',
            tipoOperacion === 'Venta'
              ? 'bg-white dark:bg-neutral-900 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          ]"
          @click="tipoOperacion = 'Venta'"
        >
          Venta
        </button>
      </div>
    </div>

    <!-- Par de monedas -->
    <div class="space-y-2">
      <p class="text-xs font-semibold text-neutral-500">Par de monedas</p>
      <UFormField label="De (moneda que entrega)" size="sm">
        <USelect v-model="monedaOrigen" :items="props.currencyOptions" placeholder="Todas" class="w-full" />
      </UFormField>
      <UFormField label="A (moneda que recibe)" size="sm">
        <USelect v-model="monedaDestino" :items="props.currencyOptions" placeholder="Todas" class="w-full" />
      </UFormField>
    </div>

    <!-- Cantidad a recibir -->
    <div class="space-y-2">
      <p class="text-xs font-semibold text-neutral-500">Cantidad a recibir</p>
      <UFormField label="Moneda" size="sm">
        <USelect v-model="monedaMontoRecibe" :items="props.currencyOptions" placeholder="Todas" class="w-full" />
      </UFormField>

      <div class="grid grid-cols-2 gap-2">
        <UFormField label="Mínima" size="sm">
          <UInput v-model.number="montoRecibeMin" type="number" placeholder="0" :min="0" step="0.01" class="w-full">
            <template #trailing>
              <span class="text-[10px] text-neutral-500">{{ props.monedaMontoLabel }}</span>
            </template>
          </UInput>
        </UFormField>
        <UFormField label="Máxima" size="sm">
          <UInput v-model.number="montoRecibeMax" type="number" placeholder="Sin límite" :min="0" step="0.01" class="w-full">
            <template #trailing>
              <span class="text-[10px] text-neutral-500">{{ props.monedaMontoLabel }}</span>
            </template>
          </UInput>
        </UFormField>
      </div>
    </div>

    <!-- Calificación mínima -->
    <div class="space-y-2">
      <p class="text-xs font-semibold text-neutral-500">Calificación mínima de contraparte</p>
      <div class="flex items-center gap-1.5">
        <button
          v-for="star in 5"
          :key="star"
          type="button"
          class="transition-transform hover:scale-110 cursor-pointer"
          @click="calificacionMin = calificacionMin === star ? 0 : star"
        >
          <UIcon
            name="i-lucide-star"
            :class="star <= calificacionMin ? 'size-5 text-amber-500 fill-amber-500' : 'size-5 text-neutral-300 dark:text-neutral-700'"
          />
        </button>
        <span class="text-xs text-neutral-500 ml-1">{{ calificacionMin > 0 ? `${calificacionMin}+` : 'Todas' }}</span>
      </div>
    </div>

    <!-- Ordenar -->
    <UFormField label="Ordenar" size="sm">
      <USelect v-model="ordenarPor" :items="props.ordenarOptions" class="w-full" />
    </UFormField>

    <!-- Matching automático -->
    <div class="pt-4 border-t border-default space-y-2">
      <p class="text-xs uppercase text-neutral-400 font-semibold">Matching automático</p>
      <USelect v-model.number="matchingOfferId" :items="props.misOfertasOptions" placeholder="Selecciona tu oferta" class="w-full" />
      <p v-if="props.loadingMatches" class="text-xs text-neutral-500">Buscando matches...</p>
    </div>
  </aside>
</template>
