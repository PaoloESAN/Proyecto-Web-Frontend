<script setup lang="ts">
import type {
  GetMarketplaceOffersResponse,
  MatchesResponse,
  UsuarioOfertasResponse,
} from "~/types";

definePageMeta({
  middleware: ["auth"],
  title: "Marketplace",
});

const api = useApi();
const toast = useToast();

const ALL = "ALL";
const CURRENCIES = ["USD", "PEN", "EUR", "GBP", "MXN"];

type SortBy = "recientes" | "tc_asc" | "tc_desc" | "recibe_asc" | "recibe_desc";

const tipoOperacion = ref<"Compra" | "Venta" | typeof ALL>(ALL);
const monedaOrigen = ref<string>(ALL);
const monedaDestino = ref<string>(ALL);
const monedaMontoRecibe = ref<string>(ALL);
const montoRecibeMin = ref<number | undefined>(undefined);
const montoRecibeMax = ref<number | undefined>(undefined);
const calificacionMin = ref<number>(0);
const ordenarPor = ref<SortBy>("recientes");

const page = ref(1);
const pageSize = ref(10);

const ofertasRaw = ref<GetMarketplaceOffersResponse["datos"]>([]);
const loading = ref(false);

const misOfertas = ref<UsuarioOfertasResponse>([]);
const matchingOfferId = ref(0);
const ofertasMatches = ref<MatchesResponse>([]);
const mostrarSoloMatches = ref(false);
const loadingMatches = ref(false);
const isFiltersOpen = ref(false);

const currencyOptions = computed(() => [
  { label: "Todas", value: ALL },
  ...CURRENCIES.map((c) => ({ label: c, value: c })),
]);

const ordenarOptions = [
  { label: "Más recientes", value: "recientes" },
  { label: "TC más bajo", value: "tc_asc" },
  { label: "TC más alto", value: "tc_desc" },
  { label: "Recibes (menor a mayor)", value: "recibe_asc" },
  { label: "Recibes (mayor a menor)", value: "recibe_desc" },
];

async function fetchOfertas() {
  loading.value = true;
  try {
    const res = await api<GetMarketplaceOffersResponse>(
      "/api/ofertas/marketplace",
      {
        params: { page: 1, pageSize: 250 },
      }
    );
    ofertasRaw.value = res.datos ?? [];
  } finally {
    loading.value = false;
  }
}

async function fetchMisOfertas() {
  try {
    const res = await api<UsuarioOfertasResponse>("/api/ofertas/usuario");
    misOfertas.value = (res ?? []).filter((o) => o.estado === "Activa");
  } catch {
    // ignore
  }
}

async function fetchMatchesForOffer(ofertaId: number) {
  if (ofertaId === 0) {
    ofertasMatches.value = [];
    mostrarSoloMatches.value = false;
    return;
  }

  loadingMatches.value = true;
  try {
    const res = await api<MatchesResponse>("/api/ofertas/matches", {
      params: { ofertaId },
    });
    ofertasMatches.value = res ?? [];
    mostrarSoloMatches.value = true;
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudieron buscar coincidencias",
      color: "error",
    });
    mostrarSoloMatches.value = false;
  } finally {
    loadingMatches.value = false;
  }
}

watch(matchingOfferId, fetchMatchesForOffer);

const baseList = computed(() =>
  mostrarSoloMatches.value ? ofertasMatches.value : ofertasRaw.value
);

const ofertasFiltradas = computed(() => {
  return baseList.value.filter((item) => {
    if (tipoOperacion.value !== ALL && item.tipoOperacion !== tipoOperacion.value)
      return false;
    if (monedaOrigen.value !== ALL && item.monedaTengo !== monedaOrigen.value)
      return false;
    if (monedaDestino.value !== ALL && item.monedaRecibo !== monedaDestino.value)
      return false;
    if (
      monedaMontoRecibe.value !== ALL &&
      item.monedaRecibo !== monedaMontoRecibe.value
    )
      return false;

    if (
      typeof montoRecibeMin.value === "number" &&
      item.montoRecibo < montoRecibeMin.value
    )
      return false;
    if (
      typeof montoRecibeMax.value === "number" &&
      item.montoRecibo > montoRecibeMax.value
    )
      return false;

    const rating = Number(item.usuarioCreador?.calificacion ?? 0);
    if (rating < calificacionMin.value) return false;

    return true;
  });
});

const ofertasOrdenadas = computed(() => {
  const items = [...ofertasFiltradas.value];

  switch (ordenarPor.value) {
    case "tc_asc":
      return items.sort((a, b) => Number(a.tipoCambio) - Number(b.tipoCambio));
    case "tc_desc":
      return items.sort((a, b) => Number(b.tipoCambio) - Number(a.tipoCambio));
    case "recibe_asc":
      return items.sort((a, b) => Number(a.montoRecibo) - Number(b.montoRecibo));
    case "recibe_desc":
      return items.sort((a, b) => Number(b.montoRecibo) - Number(a.montoRecibo));
    case "recientes":
    default:
      return items.sort(
        (a, b) =>
          new Date(b.fechaPublicacion).getTime() -
          new Date(a.fechaPublicacion).getTime()
      );
  }
});

const ofertasPaginadas = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return ofertasOrdenadas.value.slice(start, start + pageSize.value);
});

const misOfertasOptions = computed(() => [
  { label: "Ninguna (Ver todo)", value: 0 },
  ...misOfertas.value.map((o) => ({
    label: `${o.tipoOperacion}: ${Number(o.montoTengo).toLocaleString()} ${o.monedaTengo} → ${Number(o.montoRecibo).toLocaleString()} ${o.monedaRecibo}`,
    value: o.ofertaId,
  })),
]);

const monedaMontoLabel = computed(() => {
  if (monedaMontoRecibe.value !== ALL) return monedaMontoRecibe.value;
  if (monedaDestino.value !== ALL) return monedaDestino.value;
  return "Moneda";
});

function limpiarFiltros() {
  tipoOperacion.value = ALL;
  monedaOrigen.value = ALL;
  monedaDestino.value = ALL;
  monedaMontoRecibe.value = ALL;
  montoRecibeMin.value = undefined;
  montoRecibeMax.value = undefined;
  calificacionMin.value = 0;
  ordenarPor.value = "recientes";
  page.value = 1;
}

watch(
  [
    tipoOperacion,
    monedaOrigen,
    monedaDestino,
    monedaMontoRecibe,
    montoRecibeMin,
    montoRecibeMax,
    calificacionMin,
    ordenarPor,
    matchingOfferId,
  ],
  () => {
    page.value = 1;
  }
);

onMounted(() => {
  fetchOfertas();
  fetchMisOfertas();
});
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header bar for mobile (shows "Filtros" button) -->
      <div class="lg:hidden mb-6 flex items-center justify-between">
        <h2 class="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Marketplace
        </h2>
        <UButton
          label="Filtros"
          icon="i-lucide-sliders-horizontal"
          color="neutral"
          variant="outline"
          class="cursor-pointer font-medium"
          @click="isFiltersOpen = true"
        />
      </div>

      <div class="grid lg:grid-cols-[310px_1fr] gap-6">
        <!-- Desktop Filters sidebar -->
        <MarketplaceFilters
          v-model:tipo-operacion="tipoOperacion"
          v-model:moneda-origen="monedaOrigen"
          v-model:moneda-destino="monedaDestino"
          v-model:moneda-monto-recibe="monedaMontoRecibe"
          v-model:monto-recibe-min="montoRecibeMin"
          v-model:monto-recibe-max="montoRecibeMax"
          v-model:calificacion-min="calificacionMin"
          v-model:ordenar-por="ordenarPor"
          v-model:matching-offer-id="matchingOfferId"
          class="hidden lg:block"
          :currency-options="currencyOptions"
          :ordenar-options="ordenarOptions"
          :mis-ofertas-options="misOfertasOptions"
          :loading-matches="loadingMatches"
          :moneda-monto-label="monedaMontoLabel"
          @limpiar="limpiarFiltros"
        />

        <MarketplaceOffersList
          v-model:page="page"
          :ofertas-paginadas="ofertasPaginadas"
          :total-ofertas="ofertasOrdenadas.length"
          :loading="loading"
          :page-size="pageSize"
        />
      </div>
    </div>

    <!-- Bottom Drawer for Mobile Filters -->
    <UDrawer v-model:open="isFiltersOpen" title="Filtros del Marketplace" class="lg:hidden">
      <template #body>
        <div class="p-6 overflow-y-auto max-h-[75vh]">
          <MarketplaceFilters
            v-model:tipo-operacion="tipoOperacion"
            v-model:moneda-origen="monedaOrigen"
            v-model:moneda-destino="monedaDestino"
            v-model:moneda-monto-recibe="monedaMontoRecibe"
            v-model:monto-recibe-min="montoRecibeMin"
            v-model:monto-recibe-max="montoRecibeMax"
            v-model:calificacion-min="calificacionMin"
            v-model:ordenar-por="ordenarPor"
            v-model:matching-offer-id="matchingOfferId"
            :currency-options="currencyOptions"
            :ordenar-options="ordenarOptions"
            :mis-ofertas-options="misOfertasOptions"
            :loading-matches="loadingMatches"
            :moneda-monto-label="monedaMontoLabel"
            @limpiar="limpiarFiltros"
          />
        </div>
      </template>
    </UDrawer>
  </div>
</template>
