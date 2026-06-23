<script setup lang="ts">
import type {
  GetMarketplaceOffersResponse,
  MatchesResponse,
  UsuarioOfertasResponse,
} from '~/types'

definePageMeta({
  middleware: ['auth'],
  title: 'Marketplace P2P'
})

const api = useApi()
const toast = useToast()

const ALL = 'ALL'

const tipoOperacion = ref(ALL)
const moneda = ref(ALL)
const page = ref(1)
const pageSize = ref(10)

const ofertasRaw = ref<GetMarketplaceOffersResponse['datos']>([])
const loading = ref(false)

const misOfertas = ref<UsuarioOfertasResponse>([])
const matchingOfferId = ref(0)
const ofertasMatches = ref<MatchesResponse>([])
const mostrarSoloMatches = ref(false)
const loadingMatches = ref(false)

async function fetchOfertas() {
  loading.value = true
  try {
    const res = await api<GetMarketplaceOffersResponse>('/api/ofertas/marketplace', {
      params: { page: 1, pageSize: 200 }
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
    if (moneda.value !== ALL && item.monedaTengo !== moneda.value && item.monedaRecibo !== moneda.value) return false
    return true
  })
})

const ofertasPaginadas = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return ofertasFiltradas.value.slice(start, start + pageSize.value)
})

const misOfertasOptions = computed(() => [
  { label: 'Ninguna (Ver todo)', value: 0 },
  ...misOfertas.value.map(o => ({
    label: `${o.tipoOperacion}: ${o.montoTengo} ${o.monedaTengo} → ${o.montoRecibo} ${o.monedaRecibo}`,
    value: o.ofertaId
  }))
])

onMounted(() => {
  fetchOfertas()
  fetchMisOfertas()
})
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[280px_1fr] gap-6">
      <aside class="bg-white dark:bg-neutral-900 border border-default rounded-xl p-4 space-y-4 h-fit">
        <USelect v-model="tipoOperacion" :items="[{ label: 'Todos', value: ALL }, { label: 'Compra', value: 'Compra' }, { label: 'Venta', value: 'Venta' }]" placeholder="Tipo" />
        <USelect v-model="moneda" :items="[{ label: 'Todas', value: ALL }, { label: 'USD', value: 'USD' }, { label: 'PEN', value: 'PEN' }, { label: 'EUR', value: 'EUR' }]" placeholder="Moneda" />

        <div class="pt-4 border-t border-default space-y-2">
          <p class="text-xs uppercase text-neutral-400 font-semibold">Matching automático</p>
          <USelect v-model.number="matchingOfferId" :items="misOfertasOptions" placeholder="Selecciona tu oferta" />
          <p v-if="loadingMatches" class="text-xs text-neutral-500">Buscando matches...</p>
        </div>
      </aside>

      <main class="space-y-4">
        <div v-if="loading" class="grid gap-3">
          <USkeleton v-for="i in 4" :key="i" class="h-24 rounded-xl" />
        </div>

        <div v-else-if="ofertasFiltradas.length === 0" class="bg-white dark:bg-neutral-900 border border-default rounded-xl p-8 text-center text-neutral-500">
          No se encontraron ofertas
        </div>

        <div v-else class="grid gap-3">
          <NuxtLink
            v-for="item in ofertasPaginadas"
            :key="item.ofertaId"
            :to="`/offers/${item.ofertaId}`"
            class="block bg-white dark:bg-neutral-900 border border-default rounded-xl p-4 hover:shadow"
          >
            <div class="flex justify-between items-start gap-3">
              <div>
                <p class="font-bold">{{ item.tipoOperacion }} · {{ item.monedaTengo }} → {{ item.monedaRecibo }}</p>
                <p class="text-xs text-neutral-500">Oferta #{{ item.ofertaId }}</p>
              </div>
              <UBadge :color="item.tipoOperacion === 'Venta' ? 'error' : 'success'" variant="soft">{{ item.tipoOperacion }}</UBadge>
            </div>

            <div class="grid sm:grid-cols-3 gap-2 mt-3 text-sm">
              <div>
                <p class="text-xs text-neutral-500">Entrega</p>
                <p class="font-semibold">{{ Number(item.montoTengo).toLocaleString() }} {{ item.monedaTengo }}</p>
              </div>
              <div>
                <p class="text-xs text-neutral-500">Recibe</p>
                <p class="font-semibold">{{ Number(item.montoRecibo).toLocaleString() }} {{ item.monedaRecibo }}</p>
              </div>
              <div>
                <p class="text-xs text-neutral-500">TC</p>
                <p class="font-semibold">{{ Number(item.tipoCambio).toFixed(6) }}</p>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div class="flex justify-center">
          <UPagination v-model:page="page" :total="ofertasFiltradas.length" :items-per-page="pageSize" />
        </div>
      </main>
    </div>
  </div>
</template>
