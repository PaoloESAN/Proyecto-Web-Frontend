<script setup lang="ts">
import type {
  GetMarketplaceOffersResponse,
  MatchesResponse,
  UsuarioOfertasResponse,
} from '~/types'

definePageMeta({
  middleware: ['auth'],
  title: 'Marketplace'
})

const api = useApi()
const toast = useToast()

const ALL = 'ALL'
const CURRENCIES = ['USD', 'PEN', 'EUR', 'GBP', 'MXN']

type SortBy = 'recientes' | 'tc_asc' | 'tc_desc' | 'recibe_asc' | 'recibe_desc'

const tipoOperacion = ref<'Compra' | 'Venta' | typeof ALL>(ALL)
const monedaOrigen = ref<string>(ALL)
const monedaDestino = ref<string>(ALL)
const monedaMontoRecibe = ref<string>(ALL)
const montoRecibeMin = ref<number | undefined>(undefined)
const montoRecibeMax = ref<number | undefined>(undefined)
const calificacionMin = ref<number>(0)
const ordenarPor = ref<SortBy>('recientes')

const page = ref(1)
const pageSize = ref(10)

const ofertasRaw = ref<GetMarketplaceOffersResponse['datos']>([])
const loading = ref(false)

const misOfertas = ref<UsuarioOfertasResponse>([])
const matchingOfferId = ref(0)
const ofertasMatches = ref<MatchesResponse>([])
const mostrarSoloMatches = ref(false)
const loadingMatches = ref(false)

const currencyOptions = computed(() => [
  { label: 'Todas', value: ALL },
  ...CURRENCIES.map(c => ({ label: c, value: c }))
])

const ordenarOptions = [
  { label: 'Más recientes', value: 'recientes' },
  { label: 'TC más bajo', value: 'tc_asc' },
  { label: 'TC más alto', value: 'tc_desc' },
  { label: 'Recibes (menor a mayor)', value: 'recibe_asc' },
  { label: 'Recibes (mayor a menor)', value: 'recibe_desc' }
]

async function fetchOfertas() {
  loading.value = true
  try {
    const res = await api<GetMarketplaceOffersResponse>('/api/ofertas/marketplace', {
      params: { page: 1, pageSize: 250 }
    })
    ofertasRaw.value = res.datos ?? []
  } finally {
    loading.value = false
  }
}

async function fetchMisOfertas() {
  try {
    const res = await api<UsuarioOfertasResponse>('/api/ofertas/usuario')
    misOfertas.value = (res ?? []).filter(o => o.estado === 'Activa')
  } catch {
    // ignore
  }
}

async function fetchMatchesForOffer(ofertaId: number) {
  if (ofertaId === 0) {
    ofertasMatches.value = []
    mostrarSoloMatches.value = false
    return
  }

  loadingMatches.value = true
  try {
    const res = await api<MatchesResponse>('/api/ofertas/matches', { params: { ofertaId } })
    ofertasMatches.value = res ?? []
    mostrarSoloMatches.value = true
  } catch {
    toast.add({ title: 'Error', description: 'No se pudieron buscar coincidencias', color: 'error' })
    mostrarSoloMatches.value = false
  } finally {
    loadingMatches.value = false
  }
}

watch(matchingOfferId, fetchMatchesForOffer)

const baseList = computed(() => (mostrarSoloMatches.value ? ofertasMatches.value : ofertasRaw.value))

const ofertasFiltradas = computed(() => {
  return baseList.value.filter(item => {
    if (tipoOperacion.value !== ALL && item.tipoOperacion !== tipoOperacion.value) return false
    if (monedaOrigen.value !== ALL && item.monedaTengo !== monedaOrigen.value) return false
    if (monedaDestino.value !== ALL && item.monedaRecibo !== monedaDestino.value) return false
    if (monedaMontoRecibe.value !== ALL && item.monedaRecibo !== monedaMontoRecibe.value) return false

    if (typeof montoRecibeMin.value === 'number' && item.montoRecibo < montoRecibeMin.value) return false
    if (typeof montoRecibeMax.value === 'number' && item.montoRecibo > montoRecibeMax.value) return false

    const rating = Number(item.usuarioCreador?.calificacion ?? 0)
    if (rating < calificacionMin.value) return false

    return true
  })
})

const ofertasOrdenadas = computed(() => {
  const items = [...ofertasFiltradas.value]

  switch (ordenarPor.value) {
    case 'tc_asc':
      return items.sort((a, b) => Number(a.tipoCambio) - Number(b.tipoCambio))
    case 'tc_desc':
      return items.sort((a, b) => Number(b.tipoCambio) - Number(a.tipoCambio))
    case 'recibe_asc':
      return items.sort((a, b) => Number(a.montoRecibo) - Number(b.montoRecibo))
    case 'recibe_desc':
      return items.sort((a, b) => Number(b.montoRecibo) - Number(a.montoRecibo))
    case 'recientes':
    default:
      return items.sort((a, b) => new Date(b.fechaPublicacion).getTime() - new Date(a.fechaPublicacion).getTime())
  }
})

const ofertasPaginadas = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return ofertasOrdenadas.value.slice(start, start + pageSize.value)
})

const misOfertasOptions = computed(() => [
  { label: 'Ninguna (Ver todo)', value: 0 },
  ...misOfertas.value.map(o => ({
    label: `${o.tipoOperacion}: ${Number(o.montoTengo).toLocaleString()} ${o.monedaTengo} → ${Number(o.montoRecibo).toLocaleString()} ${o.monedaRecibo}`,
    value: o.ofertaId
  }))
])

const monedaMontoLabel = computed(() => {
  if (monedaMontoRecibe.value !== ALL) return monedaMontoRecibe.value
  if (monedaDestino.value !== ALL) return monedaDestino.value
  return 'Moneda'
})

function limpiarFiltros() {
  tipoOperacion.value = ALL
  monedaOrigen.value = ALL
  monedaDestino.value = ALL
  monedaMontoRecibe.value = ALL
  montoRecibeMin.value = undefined
  montoRecibeMax.value = undefined
  calificacionMin.value = 0
  ordenarPor.value = 'recientes'
  page.value = 1
}

watch([
  tipoOperacion,
  monedaOrigen,
  monedaDestino,
  monedaMontoRecibe,
  montoRecibeMin,
  montoRecibeMax,
  calificacionMin,
  ordenarPor,
  matchingOfferId
], () => {
  page.value = 1
})

onMounted(() => {
  fetchOfertas()
  fetchMisOfertas()
})
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[310px_1fr] gap-6">
      <aside class="bg-white dark:bg-neutral-900 border border-default rounded-xl p-4 space-y-5 h-fit lg:mt-10">
        <div class="flex items-center justify-between">
          <p class="text-xs uppercase text-neutral-400 font-semibold">Filtros</p>
          <UButton label="Limpiar" color="neutral" variant="link" size="xs" class="p-0" @click="limpiarFiltros" />
        </div>

        <div class="space-y-2">
          <p class="text-xs font-semibold text-neutral-500">Operación</p>
          <div class="grid grid-cols-3 gap-1 bg-neutral-100 dark:bg-neutral-800/40 rounded-xl p-1">
            <button
              type="button"
              :class="[
                'text-xs font-semibold rounded-lg py-1.5 transition',
                tipoOperacion === ALL ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              ]"
              @click="tipoOperacion = ALL"
            >
              Todos
            </button>
            <button
              type="button"
              :class="[
                'text-xs font-semibold rounded-lg py-1.5 transition',
                tipoOperacion === 'Compra' ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              ]"
              @click="tipoOperacion = 'Compra'"
            >
              Compra
            </button>
            <button
              type="button"
              :class="[
                'text-xs font-semibold rounded-lg py-1.5 transition',
                tipoOperacion === 'Venta' ? 'bg-white dark:bg-neutral-900 text-red-600 dark:text-red-400 shadow-sm' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              ]"
              @click="tipoOperacion = 'Venta'"
            >
              Venta
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-semibold text-neutral-500">Par de monedas</p>
          <UFormField label="De (moneda que entrega)" size="sm">
            <USelect v-model="monedaOrigen" :items="currencyOptions" placeholder="Todas" />
          </UFormField>
          <UFormField label="A (moneda que recibe)" size="sm">
            <USelect v-model="monedaDestino" :items="currencyOptions" placeholder="Todas" />
          </UFormField>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-semibold text-neutral-500">Cantidad a recibir</p>
          <UFormField label="Moneda" size="sm">
            <USelect v-model="monedaMontoRecibe" :items="currencyOptions" placeholder="Todas" />
          </UFormField>

          <div class="grid grid-cols-2 gap-2">
            <UFormField label="Mínima" size="sm">
              <UInput v-model.number="montoRecibeMin" type="number" placeholder="0" :min="0" step="0.01">
                <template #trailing>
                  <span class="text-[10px] text-neutral-500">{{ monedaMontoLabel }}</span>
                </template>
              </UInput>
            </UFormField>
            <UFormField label="Máxima" size="sm">
              <UInput v-model.number="montoRecibeMax" type="number" placeholder="Sin límite" :min="0" step="0.01">
                <template #trailing>
                  <span class="text-[10px] text-neutral-500">{{ monedaMontoLabel }}</span>
                </template>
              </UInput>
            </UFormField>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-semibold text-neutral-500">Calificación mínima de contraparte</p>
          <div class="flex items-center gap-1.5">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              class="transition-transform hover:scale-110"
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

        <UFormField label="Ordenar" size="sm">
          <USelect v-model="ordenarPor" :items="ordenarOptions" />
        </UFormField>

        <div class="pt-4 border-t border-default space-y-2">
          <p class="text-xs uppercase text-neutral-400 font-semibold">Matching automático</p>
          <USelect v-model.number="matchingOfferId" :items="misOfertasOptions" placeholder="Selecciona tu oferta" />
          <p v-if="loadingMatches" class="text-xs text-neutral-500">Buscando matches...</p>
        </div>
      </aside>

      <main class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-sm text-neutral-500">
            {{ ofertasOrdenadas.length }} ofertas encontradas
          </p>
        </div>

        <div v-if="loading" class="grid gap-3">
          <USkeleton v-for="i in 4" :key="i" class="h-24 rounded-xl" />
        </div>

        <div v-else-if="ofertasOrdenadas.length === 0" class="bg-white dark:bg-neutral-900 border border-default rounded-xl p-8 text-center text-neutral-500">
          No se encontraron ofertas con esos filtros
        </div>

        <div v-else class="grid gap-4">
          <NuxtLink
            v-for="item in ofertasPaginadas"
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
                    {{ item.usuarioCreador?.nombres || 'Usuario' }} {{ item.usuarioCreador?.apellidos || '' }}
                  </p>

                  <div class="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                    <span class="inline-flex items-center gap-1 text-amber-500 dark:text-amber-400 font-semibold">
                      <UIcon name="i-lucide-star" class="size-3.5 fill-amber-500" />
                      {{ Number(item.usuarioCreador?.calificacion ?? 0).toFixed(1) }}
                    </span>
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
          <UPagination v-model:page="page" :total="ofertasOrdenadas.length" :items-per-page="pageSize" />
        </div>
      </main>
    </div>
  </div>
</template>
