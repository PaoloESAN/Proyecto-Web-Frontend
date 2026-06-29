<script setup lang="ts">
import type { OfertaDetalleResponse } from "~/types";

const props = defineProps<{
  offer: OfertaDetalleResponse;
  loading: boolean;
}>();
</script>

<template>
  <section class="bg-white dark:bg-neutral-900 border border-default rounded-2xl p-6 sm:p-7 space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Oferta #{{ props.offer.ofertaId }}</h1>
        <p class="text-sm mt-1 text-neutral-500">
          {{ props.offer.tipoOperacion }} · {{ props.offer.monedaTengo }} → {{ props.offer.monedaRecibo }}
        </p>
      </div>

      <UBadge
        :color="props.offer.estado === 'Activa' ? 'success' : 'warning'"
        variant="soft"
        class="font-semibold"
      >
        {{ props.offer.estado }}
      </UBadge>
    </div>

    <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
      <div class="rounded-xl border border-default bg-muted/20 p-4">
        <p class="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Tú entregarás</p>
        <p class="mt-1.5 text-2xl font-black text-rose-500 leading-none">
          {{ Number(props.offer.montoTengo).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
        </p>
        <p class="mt-1 text-sm font-bold text-neutral-700 dark:text-neutral-200">{{ props.offer.monedaTengo }}</p>
      </div>

      <div class="rounded-xl border border-default bg-muted/20 p-4">
        <p class="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Tú recibirás</p>
        <p class="mt-1.5 text-2xl font-black text-emerald-500 leading-none">
          {{ Number(props.offer.montoRecibo).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
        </p>
        <p class="mt-1 text-sm font-bold text-neutral-700 dark:text-neutral-200">{{ props.offer.monedaRecibo }}</p>
      </div>

      <div class="rounded-xl border border-default bg-muted/20 p-4 sm:col-span-2 xl:col-span-1">
        <p class="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Tipo de cambio</p>
        <p class="mt-1.5 text-2xl font-black text-neutral-900 dark:text-white leading-none">
          {{ Number(props.offer.tipoCambio).toFixed(6) }}
        </p>
        <p class="mt-1 text-xs text-neutral-500">Actualizado al momento de publicar</p>
      </div>
    </div>

    <div class="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <p class="text-sm font-semibold text-primary">Resumen rápido</p>
      <p class="text-sm text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
        Intercambiarás
        <strong>{{ Number(props.offer.montoTengo).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} {{ props.offer.monedaTengo }}</strong>
        por
        <strong>{{ Number(props.offer.montoRecibo).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} {{ props.offer.monedaRecibo }}</strong>.
      </p>
    </div>
  </section>
</template>
