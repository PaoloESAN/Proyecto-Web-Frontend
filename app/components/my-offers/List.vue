<script setup lang="ts">
import type { UsuarioOfertasResponse } from "~/types";

const props = defineProps<{
  offers: UsuarioOfertasResponse;
}>();

const emit = defineEmits<{
  (e: "open-in-progress" | "abrir-editar" | "confirmar-cancelar", item: UsuarioOfertasResponse[number]): void;
}>();

function formatAmount(value: number) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function offerStatusColor(estado: string) {
  if (estado === "Activa") return "success";
  if (estado === "En Proceso") return "warning";
  return "neutral";
}
</script>

<template>
  <div v-if="props.offers.length === 0" class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-16 text-center">
    <p class="text-neutral-500 font-medium">Aún no tienes ofertas creadas</p>
  </div>

  <div v-else class="grid gap-4">
    <div
      v-for="item in props.offers"
      :key="item.ofertaId"
      :class="[
        'group rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-5 space-y-4 transition-all duration-200',
        item.estado === 'En Proceso'
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30'
          : ''
      ]"
      @click="item.estado === 'En Proceso' ? emit('open-in-progress', item) : undefined"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-lg font-extrabold text-neutral-900 dark:text-white">Oferta #{{ item.ofertaId }}</p>
          <p class="text-xs sm:text-sm text-neutral-500 mt-0.5 truncate">
            {{ item.tipoOperacion }} · {{ item.monedaTengo }} → {{ item.monedaRecibo }}
          </p>
        </div>
        <UBadge :color="offerStatusColor(item.estado)" variant="soft" class="shrink-0">
          {{ item.estado }}
        </UBadge>
      </div>

      <div class="grid sm:grid-cols-3 gap-3 text-sm">
        <div class="rounded-xl border border-default bg-muted/20 p-3.5">
          <p class="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold">Tú entregas</p>
          <p class="font-extrabold text-rose-500 mt-1">{{ formatAmount(item.montoTengo) }} {{ item.monedaTengo }}</p>
        </div>
        <div class="rounded-xl border border-default bg-muted/20 p-3.5">
          <p class="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold">Tú recibes</p>
          <p class="font-extrabold text-emerald-500 mt-1">{{ formatAmount(item.montoRecibo) }} {{ item.monedaRecibo }}</p>
        </div>
        <div class="rounded-xl border border-default bg-muted/20 p-3.5">
          <p class="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold">Tipo de cambio</p>
          <p class="font-extrabold mt-1 text-neutral-900 dark:text-neutral-100">{{ Number(item.tipoCambio).toFixed(6) }}</p>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 flex-wrap">
        <p v-if="item.estado !== 'Activa'" class="text-xs text-neutral-500 font-medium">
          Esta oferta está en proceso y no puede editarse ni cancelarse.
        </p>

        <div
          v-if="item.estado === 'En Proceso'"
          class="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Abrir transacción
          <UIcon name="i-lucide-arrow-right" class="size-3.5 ml-1 inline-block" />
        </div>

        <div v-if="item.estado === 'Activa'" class="ml-auto flex justify-end gap-2">
          <UButton label="Editar" color="neutral" variant="outline" icon="i-lucide-pencil" class="cursor-pointer" @click.stop="emit('abrir-editar', item)" />
          <UButton label="Cancelar" color="error" variant="outline" icon="i-lucide-x" class="cursor-pointer" @click.stop="emit('confirmar-cancelar', item)" />
        </div>
      </div>
    </div>
  </div>
</template>
