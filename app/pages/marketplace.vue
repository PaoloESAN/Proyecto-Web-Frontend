<script setup lang="ts">
import type { GetOffersResponse, MatchesResponse } from '~/types'

definePageMeta({
  middleware: ['auth']
})

const api = useApi()
const toast = useToast()

const moneda = ref('')
const tipoOperacion = ref('')
const monto = ref<number | undefined>(undefined)
const page = ref(1)
const pageSize = ref(10)

const ofertas = ref<GetOffersResponse | null>(null)
const loading = ref(false)
const checkingMatches = ref(false)

async function fetchOfertas() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, pageSize: pageSize.value }
    if (moneda.value) params.moneda = moneda.value
    if (tipoOperacion.value) params.tipoOperacion = tipoOperacion.value
    if (monto.value !== undefined && monto.value !== null) params.monto = monto.value

    ofertas.value = await api<GetOffersResponse>('/api/ofertas', { params })
  } catch {
    // errors handled by api plugin
  } finally {
    loading.value = false
  }
}

async function checkMatches() {
  checkingMatches.value = true
  try {
    const params: Record<string, any> = {}
    if (moneda.value) params.moneda = moneda.value
    if (tipoOperacion.value) params.tipoOperacion = tipoOperacion.value
    if (monto.value !== undefined && monto.value !== null) params.monto = monto.value

    const matches = await api<MatchesResponse>('/api/ofertas/matches', {
      params,
      ignoreGlobalErrors: true,
    } as any)

    if (matches && matches.length > 0) {
      toast.add({
        title: '¡Coincidencia encontrada!',
        description: `Se encontraron ${matches.length} oferta(s) que coinciden con tus criterios de búsqueda.`,
        color: 'success',
        icon: 'i-lucide-sparkles',
      })
    }
  } catch {
    // silent fail
  } finally {
    checkingMatches.value = false
  }
}

function aplicarFiltros() {
  page.value = 1
  fetchOfertas()
  checkMatches()
}

function limpiarFiltros() {
  moneda.value = ''
  tipoOperacion.value = ''
  monto.value = undefined
  page.value = 1
  fetchOfertas()
}

function irPagina(p: number) {
  page.value = p
  fetchOfertas()
}

const monedas = ['USD', 'EUR', 'GBP', 'MXN', 'PEN']
const tiposOperacion = ['Compra', 'Venta']

onMounted(() => {
  fetchOfertas()
})
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <header class="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <h1 class="text-xl font-bold">Marketplace de Cambio</h1>
        <UButton label="Volver" color="neutral" variant="ghost" icon="i-lucide-arrow-left" @click="navigateTo('/debug')" />
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-6 py-8 flex gap-8">
      <aside class="w-72 shrink-0 space-y-6">
        <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-5">
          <h2 class="font-semibold text-sm uppercase tracking-wider text-neutral-500">Filtros</h2>

          <div class="space-y-2">
            <label class="text-xs font-medium text-neutral-500">Moneda</label>
            <USelect
              v-model="moneda"
              :items="monedas"
              placeholder="Todas las monedas"
              class="w-full"
              clearable
            />
          </div>

          <div class="space-y-2">
            <label class="text-xs font-medium text-neutral-500">Tipo de Operación</label>
            <USelect
              v-model="tipoOperacion"
              :items="tiposOperacion"
              placeholder="Todos"
              class="w-full"
              clearable
            />
          </div>

          <div class="space-y-2">
            <label class="text-xs font-medium text-neutral-500">Monto</label>
            <UInput
              v-model="monto"
              type="number"
              placeholder="Ej: 500"
              class="w-full"
              :min="0"
            />
          </div>

          <div class="flex gap-2 pt-2">
            <UButton label="Aplicar" color="primary" class="flex-1" @click="aplicarFiltros" />
            <UButton label="Limpiar" color="neutral" variant="outline" class="flex-1" @click="limpiarFiltros" />
          </div>
        </div>

        <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 text-center">
          <UIcon name="i-lucide-search" class="size-8 text-neutral-300 dark:text-neutral-600 mb-2" />
          <p class="text-xs text-neutral-400">
            Las coincidencias se verifican automáticamente al aplicar filtros.
          </p>
        </div>
      </aside>

      <main class="flex-1 min-w-0 space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-sm text-neutral-500">
            <template v-if="ofertas">
              Mostrando {{ ofertas.datos.length }} de {{ ofertas.total }} ofertas
            </template>
            <span v-if="checkingMatches" class="ml-2 text-xs">Buscando coincidencias...</span>
          </p>
        </div>

        <div v-if="loading" class="grid gap-4">
          <div v-for="i in 3" :key="i" class="animate-pulse bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-3">
            <div class="flex justify-between">
              <div class="h-5 w-24 bg-neutral-200 dark:bg-neutral-700 rounded" />
              <div class="h-5 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
            </div>
            <div class="h-4 w-full bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div class="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div class="flex justify-between">
              <div class="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
              <div class="h-8 w-24 bg-neutral-200 dark:bg-neutral-700 rounded" />
            </div>
          </div>
        </div>

        <div v-else-if="ofertas && ofertas.datos.length === 0" class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-16 text-center">
          <UIcon name="i-lucide-inbox" class="size-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
          <p class="text-neutral-500 font-medium">No se encontraron ofertas</p>
          <p class="text-sm text-neutral-400 mt-1">Prueba ajustando los filtros de búsqueda.</p>
        </div>

        <div v-else class="grid gap-4">
          <NuxtLink
            v-for="item in ofertas?.datos ?? []"
            :key="item.ofertaId"
            :to="`/offers/${item.ofertaId}`"
            class="block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2">
                <UBadge :color="item.tipoOperacion === 'Venta' ? 'error' : 'success'" variant="soft" size="sm">
                  {{ item.tipoOperacion }}
                </UBadge>
                <span class="text-lg font-bold">{{ item.moneda }}</span>
              </div>
              <span class="text-lg font-mono font-semibold">
                TC {{ Number(item.tipoCambio).toFixed(2) }}
              </span>
            </div>

            <div class="grid grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <p class="text-neutral-400 text-xs">Total</p>
                <p class="font-medium">{{ Number(item.montoTotal).toLocaleString() }} {{ item.moneda }}</p>
              </div>
              <div>
                <p class="text-neutral-400 text-xs">Mínimo</p>
                <p class="font-medium">{{ Number(item.montoMinimo).toLocaleString() }} {{ item.moneda }}</p>
              </div>
              <div>
                <p class="text-neutral-400 text-xs">Máximo</p>
                <p class="font-medium">{{ Number(item.montoMaximo).toLocaleString() }} {{ item.moneda }}</p>
              </div>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-lucide-user" class="size-4 text-neutral-400" />
                <span>{{ item.usuarioCreador.nombres }} {{ item.usuarioCreador.apellidos }}</span>
                <span v-if="item.usuarioCreador.calificacion" class="text-xs text-neutral-400">
                  ({{ Number(item.usuarioCreador.calificacion).toFixed(1) }})
                </span>
              </div>
              <div class="flex items-center gap-1 text-sm text-neutral-500">
                <UIcon name="i-lucide-building" class="size-4" />
                <span>{{ item.metodoPago.banco }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div v-if="ofertas && ofertas.totalPaginas > 1" class="flex justify-center pt-4">
          <UPagination
            :page="page"
            :total="ofertas.total"
            :page-size="pageSize"
            @update:page="irPagina"
          />
        </div>
      </main>
    </div>
  </div>
</template>
