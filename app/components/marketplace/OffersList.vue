<script setup lang="ts">
import type { GetMarketplaceOffersResponse } from "~/types";

const props = defineProps<{
  ofertasPaginadas: GetMarketplaceOffersResponse["datos"];
  totalOfertas: number;
  loading: boolean;
  pageSize: number;
}>();

const page = defineModel<number>("page", { required: true });
</script>

<template>
  <main class="space-y-4">
    <div class="flex items-center justify-between">
      <p class="text-sm text-neutral-500">
        {{ props.totalOfertas }} ofertas encontradas
      </p>
    </div>

    <div v-if="props.loading" class="grid gap-3">
      <USkeleton v-for="i in 4" :key="i" class="h-24 rounded-xl" />
    </div>

    <div
      v-else-if="props.totalOfertas === 0"
      class="bg-white dark:bg-neutral-900 border border-default rounded-xl p-8 text-center text-neutral-500"
    >
      No se encontraron ofertas con esos filtros
    </div>

    <div v-else class="grid gap-4">
      <NuxtLink
        v-for="item in props.ofertasPaginadas"
        :key="item.ofertaId"
        :to="`/offers/${item.ofertaId}`"
        class="group block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/25 transition-all duration-200"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3 min-w-0">
            <UAvatar
              :src="item.usuarioCreador?.fotoPerfilUrl || undefined"
              :alt="`${item.usuarioCreador?.nombres || 'Usuario'} ${item.usuarioCreador?.apellidos || ''}`"
              size="lg"
              class="ring-2 ring-primary/15"
            />

            <div class="min-w-0">
              <p class="font-bold text-base text-neutral-900 dark:text-white truncate">
                {{ item.usuarioCreador?.nombres || "Usuario" }} {{ item.usuarioCreador?.apellidos || "" }}
              </p>

              <div class="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                <CommonRatingStars
                  v-if="item.usuarioCreador"
                  :rating="item.usuarioCreador.calificacion"
                  size="sm"
                />
                <span v-else class="text-neutral-400">Sin calificación</span>
                <span>•</span>
                <span>Oferta #{{ item.ofertaId }}</span>
              </div>

              <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                <span v-if="item.tipoOperacion === 'Compra'">
                  Quiere comprar <strong>{{ item.monedaRecibo }}</strong> pagando en <strong>{{ item.monedaTengo }}</strong>
                </span>
                <span v-else>
                  Quiere vender <strong>{{ item.monedaTengo }}</strong> para recibir <strong>{{ item.monedaRecibo }}</strong>
                </span>
              </p>
            </div>
          </div>

          <UBadge
            :color="item.tipoOperacion === 'Venta' ? 'error' : 'success'"
            variant="soft"
            class="shrink-0"
          >
            {{ item.tipoOperacion }}
          </UBadge>
        </div>

        <div class="mt-4 grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <div class="rounded-xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/30 px-4 py-3">
            <p class="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">Entrega</p>
            <p class="text-lg font-extrabold text-neutral-900 dark:text-white">
              {{ Number(item.montoTengo).toLocaleString() }} {{ item.monedaTengo }}
            </p>
          </div>

          <div class="hidden sm:flex items-center justify-center text-neutral-400">
            <UIcon name="i-lucide-arrow-right-left" class="size-5" />
          </div>

          <div class="rounded-xl border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 px-4 py-3">
            <p class="text-[11px] uppercase tracking-wide text-primary/80 mb-1">Recibe</p>
            <p class="text-lg font-extrabold text-primary-700 dark:text-primary-300">
              {{ Number(item.montoRecibo).toLocaleString() }} {{ item.monedaRecibo }}
            </p>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div class="flex justify-center">
      <UPagination v-model:page="page" :total="props.totalOfertas" :items-per-page="props.pageSize" />
    </div>
  </main>
</template>
