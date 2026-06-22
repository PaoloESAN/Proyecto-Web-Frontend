<script setup lang="ts">
import type { GetOffersResponse, MatchesResponse, UsuarioOfertasResponse } from '~/types'

definePageMeta({
  middleware: ["auth"],
});

const api = useApi();
const toast = useToast();

// Estados reactivos de los filtros
const monedasSeleccionadas = ref<string[]>([]);
const tipoOperacion = ref("");
const montoMin = ref<number | undefined>(undefined);
const montoMax = ref<number | undefined>(undefined);
const calificacionMin = ref<number>(0);
const bancoSeleccionado = ref("TODOS");

const page = ref(1);
const pageSize = ref(6);

// Respuestas crudas del backend
const ofertasRaw = ref<GetOffersResponse["datos"]>([]);
const totalRaw = ref(0);
const loading = ref(false);

// Estados para Matching Automático
const misOfertas = ref<UsuarioOfertasResponse>([]);
const loadingMisOfertas = ref(false);
const matchingOfferId = ref(0);
const ofertasMatches = ref<MatchesResponse>([]);
const loadingMatches = ref(false);
const mostrarSoloMatches = ref(false);

async function fetchOfertas() {
  loading.value = true;
  try {
    const params = { page: 1, pageSize: 100 }; // Traer hasta 100 ofertas para filtrado local fluido
    const res = await api<GetOffersResponse>("/api/ofertas", { params });
    ofertasRaw.value = res.datos ?? [];
    totalRaw.value = res.total ?? 0;
  } catch {
    // errores manejados por el interceptor de api
  } finally {
    loading.value = false;
  }
}

const bancosDisponibles = computed(() => {
  const bancos = ofertasRaw.value
    .map((o) => o.metodoPago?.banco)
    .filter((b): b is string => !!b);
  const bancosUnicos = Array.from(new Set(bancos));
  return [
    { label: "Todos los bancos", value: "TODOS" },
    ...bancosUnicos.map((b) => ({ label: b, value: b })),
  ];
});

// Filtrado local en el cliente en tiempo real
const ofertasFiltradas = computed(() => {
  const base = mostrarSoloMatches.value && matchingOfferId.value > 0
    ? ofertasMatches.value
    : ofertasRaw.value

  return base.filter(item => {
    // 1. Filtrar por Monedas seleccionadas
    if (
      monedasSeleccionadas.value.length > 0 &&
      !monedasSeleccionadas.value.includes(item.moneda)
    ) {
      return false;
    }

    // 2. Filtrar por Tipo de Operación
    if (tipoOperacion.value && item.tipoOperacion !== tipoOperacion.value) {
      return false;
    }

    // 3. Filtrar por Monto Mínimo (evalúa si el total de la oferta cumple con el mínimo requerido)
    if (montoMin.value !== undefined && montoMin.value !== null) {
      if (item.montoTotal < montoMin.value) {
        return false;
      }
    }

    // 4. Filtrar por Monto Máximo (evalúa si el total de la oferta está bajo el límite máximo)
    if (montoMax.value !== undefined && montoMax.value !== null) {
      if (item.montoTotal > montoMax.value) {
        return false;
      }
    }

    // 5. Filtrar por Calificación del Creador
    if (calificacionMin.value > 0) {
      const calif = item.usuarioCreador?.calificacion ?? 0;
      if (calif < calificacionMin.value) {
        return false;
      }
    }

    // 6. Filtrar por Banco (se ignora si es 'TODOS')
    if (bancoSeleccionado.value && bancoSeleccionado.value !== "TODOS") {
      const bancoItem = item.metodoPago?.banco?.toLowerCase() ?? "";
      const bancoFiltro = bancoSeleccionado.value.toLowerCase();
      if (!bancoItem.includes(bancoFiltro)) {
        return false;
      }
    }

    return true;
  });
});

// Paginación local sobre la lista filtrada
const ofertasPaginadas = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return ofertasFiltradas.value.slice(start, end);
});

const totalPaginas = computed(() => {
  return Math.ceil(ofertasFiltradas.value.length / pageSize.value);
});

// Manejo de clicks en monedas (selección múltiple)
function toggleMoneda(m: string) {
  const index = monedasSeleccionadas.value.indexOf(m);
  if (index >= 0) {
    monedasSeleccionadas.value.splice(index, 1);
  } else {
    monedasSeleccionadas.value.push(m);
  }
}

function limpiarFiltros() {
  monedasSeleccionadas.value = [];
  tipoOperacion.value = "";
  montoMin.value = undefined;
  montoMax.value = undefined;
  calificacionMin.value = 0;
  bancoSeleccionado.value = "TODOS";
  page.value = 1;
}

function irPagina(p: number) {
  page.value = p;
}

async function fetchMisOfertas() {
  loadingMisOfertas.value = true;
  try {
    const res = await api<UsuarioOfertasResponse>("/api/ofertas/usuario");
    misOfertas.value = (res ?? []).filter((o) => o.estado === "Activa");
  } catch {
    // silent
  } finally {
    loadingMisOfertas.value = false;
  }
}

const misOfertasOptions = computed(() => {
  return [
    { label: "Ninguna (Ver todo)", value: 0 },
    ...misOfertas.value.map((o) => ({
      label: `${o.tipoOperacion === "Compra" ? "Compro" : "Vendo"} ${o.montoTotal} ${o.moneda} (TC ${o.tipoCambio})`,
      value: o.ofertaId,
    })),
  ];
});

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
      description: "No se pudieron buscar coincidencias automáticas",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
    mostrarSoloMatches.value = false;
  } finally {
    loadingMatches.value = false;
  }
}

watch(matchingOfferId, (newId) => {
  fetchMatchesForOffer(newId);
});

// Reactividad instantánea al modificar cualquier filtro
watch(
  [
    monedasSeleccionadas,
    tipoOperacion,
    montoMin,
    montoMax,
    calificacionMin,
    bancoSeleccionado,
  ],
  () => {
    page.value = 1;
  },
  { deep: true },
);

const monedas = ["USD", "EUR", "GBP", "MXN", "PEN"];

onMounted(() => {
  fetchOfertas();
  fetchMisOfertas();
});
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <header
      class="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800"
    >
      <div
        class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between"
      >
        <h1 class="text-xl font-bold">Marketplace de Cambio</h1>
        <UButton
          label="Volver"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          @click="navigateTo('/debug')"
        />
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-6 py-8 flex gap-8">
      <aside class="w-72 shrink-0 space-y-6">
        <div
          class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-5"
        >
          <div class="flex items-center justify-between">
            <h2
              class="font-bold text-xs uppercase tracking-wider text-neutral-400"
            >
              Filtros
            </h2>
            <UButton
              v-if="monedasSeleccionadas.length > 0 || tipoOperacion || montoMin !== undefined || montoMax !== undefined || calificacionMin > 0 || (bancoSeleccionado && bancoSeleccionado !== 'TODOS')"
              label="Limpiar todo"
              color="neutral"
              variant="link"
              size="xs"
              class="p-0 text-primary-500 hover:text-primary-600"
              @click="limpiarFiltros"
            />
          </div>

          <!-- Filtro de Monedas Múltiples (Chips) -->
          <div class="space-y-2">
            <label
              class="text-xs font-semibold text-neutral-500 dark:text-neutral-400"
              >Monedas</label
            >
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="m in monedas"
                :key="m"
                type="button"
                :class="[
                  'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-200',
                  monedasSeleccionadas.includes(m)
                    ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-950/40 dark:border-primary-500 dark:text-primary-300 shadow-sm'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700',
                ]"
                @click="toggleMoneda(m)"
              >
                {{ m }}
              </button>
            </div>
          </div>

          <!-- Filtro de Tipo de Operación (Segmentado) -->
          <div class="space-y-2">
            <label
              class="text-xs font-semibold text-neutral-500 dark:text-neutral-400"
              >Tipo de Operación</label
            >
            <div
              class="grid grid-cols-3 gap-1 bg-neutral-100 dark:bg-neutral-800/40 p-1 rounded-xl"
            >
              <button
                v-for="op in ['', 'Compra', 'Venta']"
                :key="op"
                type="button"
                :class="[
                  'py-1 rounded-lg text-xs font-medium transition-all duration-200 text-center',
                  tipoOperacion === op
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200',
                ]"
                @click="tipoOperacion = op"
              >
                {{ op === "" ? "Todos" : op }}
              </button>
            </div>
          </div>

          <!-- Filtro de Montos Mín y Máx -->
          <div class="space-y-2">
            <label
              class="text-xs font-semibold text-neutral-500 dark:text-neutral-400"
              >Rango de Monto</label
            >
            <div class="grid grid-cols-2 gap-2">
              <div class="space-y-1">
                <span
                  class="text-[10px] text-neutral-400 uppercase tracking-wider block"
                  >Mínimo</span
                >
                <UInput
                  v-model="montoMin"
                  type="number"
                  placeholder="0.00"
                  class="w-full"
                  :min="0"
                  size="sm"
                />
              </div>
              <div class="space-y-1">
                <span
                  class="text-[10px] text-neutral-400 uppercase tracking-wider block"
                  >Máximo</span
                >
                <UInput
                  v-model="montoMax"
                  type="number"
                  placeholder="Sin límite"
                  class="w-full"
                  :min="0"
                  size="sm"
                />
              </div>
            </div>
          </div>

          <!-- Filtro de Banco Dinámico -->
          <div class="space-y-2">
            <label
              class="text-xs font-semibold text-neutral-500 dark:text-neutral-400"
              >Banco</label
            >
            <USelect
              v-model="bancoSeleccionado"
              :items="bancosDisponibles"
              placeholder="Todos los bancos"
              class="w-full"
              clearable
              size="sm"
            />
          </div>

          <!-- Filtro de Calificación de Creador (Estrellas) -->
          <div class="space-y-2">
            <label
              class="text-xs font-semibold text-neutral-500 dark:text-neutral-400"
              >Calificación del Vendedor</label
            >
            <div class="flex items-center gap-1">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                class="text-xl focus:outline-none transition-transform hover:scale-110"
                @click="calificacionMin = calificacionMin === star ? 0 : star"
              >
                <UIcon
                  name="i-lucide-star"
                  :class="[
                    'size-5 transition-colors',
                    star <= calificacionMin
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-neutral-200 dark:text-neutral-800',
                  ]"
                />
              </button>
              <span
                v-if="calificacionMin > 0"
                class="text-xs font-medium text-amber-500 dark:text-amber-400 ml-1"
              >
                {{ calificacionMin }}+
              </span>
            </div>
          </div>
        </div>

        <!-- Tarjeta de Matching Automático -->
        <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-4">
          <div class="flex items-center gap-2 text-primary-500">
            <UIcon name="i-lucide-sparkles" class="size-5" />
            <h2 class="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white">Matching Automático</h2>
          </div>
          
          <p class="text-xs text-neutral-400">
            Selecciona una de tus ofertas activas para encontrar de forma instantánea coincidencias de intercambio.
          </p>

          <div class="space-y-2">
            <label class="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Tu Oferta Activa</label>
            <USelect
              v-model.number="matchingOfferId"
              :items="misOfertasOptions"
              placeholder="Selecciona tu oferta"
              class="w-full"
              size="sm"
            />
          </div>
          
          <div v-if="loadingMatches" class="flex items-center justify-center gap-2 py-1 text-xs text-neutral-400">
            <UIcon name="i-lucide-loader-2" class="size-4 animate-spin text-primary" />
            <span>Buscando matches...</span>
          </div>
        </div>
      </aside>

      <main class="flex-1 min-w-0 space-y-4">
        <!-- Banner informativo de Matching Automático -->
        <div
          v-if="mostrarSoloMatches && matchingOfferId > 0"
          class="bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800/50 rounded-xl p-4 flex items-center justify-between gap-4"
        >
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-sparkles" class="size-5 text-primary-500 shrink-0 mt-0.5" />
            <div>
              <h3 class="text-sm font-semibold text-primary-900 dark:text-primary-200">Matching Automático Activo</h3>
              <p class="text-xs text-primary-700 dark:text-primary-400 mt-0.5">
                Mostrando únicamente las ofertas de otros usuarios que son compatibles con tu oferta seleccionada.
              </p>
            </div>
          </div>
          <UButton
            label="Ver todo el catálogo"
            color="primary"
            variant="outline"
            size="xs"
            icon="i-lucide-x"
            @click="matchingOfferId = 0"
          />
        </div>

        <div class="flex items-center justify-between">
          <p class="text-sm text-neutral-500">
            <template v-if="!loading">
              Mostrando {{ ofertasPaginadas.length }} de
              {{ ofertasFiltradas.length }} ofertas
              <span
                v-if="ofertasFiltradas.length !== totalRaw"
                class="text-neutral-400 text-xs"
              >
                (filtradas de un total de {{ totalRaw }})
              </span>
            </template>
            <span v-if="loadingMatches" class="ml-2 text-xs text-primary-500 font-medium">
              Buscando coincidencias...
            </span>
          </p>
        </div>

        <!-- Loader -->
        <div v-if="loading" class="grid gap-4">
          <div
            v-for="i in 3"
            :key="i"
            class="animate-pulse bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-3"
          >
            <div class="flex justify-between">
              <div
                class="h-5 w-24 bg-neutral-200 dark:bg-neutral-700 rounded"
              />
              <div
                class="h-5 w-16 bg-neutral-200 dark:bg-neutral-700 rounded"
              />
            </div>
            <div
              class="h-4 w-full bg-neutral-200 dark:bg-neutral-700 rounded"
            />
            <div class="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div class="flex justify-between">
              <div
                class="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded"
              />
              <div
                class="h-8 w-24 bg-neutral-200 dark:bg-neutral-700 rounded"
              />
            </div>
          </div>
        </div>

        <!-- Sin resultados -->
        <div
          v-else-if="ofertasFiltradas.length === 0"
          class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-16 text-center"
        >
          <UIcon
            name="i-lucide-inbox"
            class="size-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3"
          />
          <p class="text-neutral-500 font-medium">No se encontraron ofertas</p>
          <p class="text-sm text-neutral-400 mt-1">
            Prueba ajustando o limpiando los filtros de búsqueda.
          </p>
        </div>

        <!-- Listado de Ofertas -->
        <div v-else class="grid gap-4">
          <NuxtLink
            v-for="item in ofertasPaginadas"
            :key="item.ofertaId"
            :to="`/offers/${item.ofertaId}`"
            class="block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:border-primary-500/50 hover:shadow-sm transition-all duration-200"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2">
                <UBadge
                  :color="item.tipoOperacion === 'Venta' ? 'error' : 'success'"
                  variant="soft"
                  size="sm"
                >
                  {{ item.tipoOperacion }}
                </UBadge>
                <span class="text-lg font-bold">{{ item.moneda }}</span>
              </div>
              <span
                class="text-lg font-mono font-semibold text-neutral-900 dark:text-neutral-100"
              >
                TC {{ Number(item.tipoCambio).toFixed(2) }}
              </span>
            </div>

            <div class="grid grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <p class="text-neutral-400 text-xs">Total</p>
                <p class="font-medium">
                  {{ Number(item.montoTotal).toLocaleString() }}
                  {{ item.moneda }}
                </p>
              </div>
              <div>
                <p class="text-neutral-400 text-xs">Mínimo</p>
                <p class="font-medium">
                  {{ Number(item.montoMinimo).toLocaleString() }}
                  {{ item.moneda }}
                </p>
              </div>
              <div>
                <p class="text-neutral-400 text-xs">Máximo</p>
                <p class="font-medium">
                  {{ Number(item.montoMaximo).toLocaleString() }}
                  {{ item.moneda }}
                </p>
              </div>
            </div>

            <div
              class="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800"
            >
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-lucide-user" class="size-4 text-neutral-400" />
                <span class="font-medium"
                  >{{ item.usuarioCreador?.nombres }}
                  {{ item.usuarioCreador?.apellidos }}</span
                >
                <span
                  v-if="item.usuarioCreador?.calificacion"
                  class="inline-flex items-center gap-0.5 text-xs text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded"
                >
                  <UIcon name="i-lucide-star" class="size-3 fill-amber-500" />
                  {{ Number(item.usuarioCreador.calificacion).toFixed(1) }}
                </span>
              </div>
              <div class="flex items-center gap-1 text-sm text-neutral-500">
                <UIcon name="i-lucide-building" class="size-4" />
                <span>{{
                  item.metodoPago?.banco ?? "Sin banco asignado"
                }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Paginación -->
        <div v-if="totalPaginas > 1" class="flex justify-center pt-4">
          <UPagination
            v-model:page="page"
            :total="ofertasFiltradas.length"
            :items-per-page="pageSize"
          />
        </div>
      </main>
    </div>
  </div>
</template>
