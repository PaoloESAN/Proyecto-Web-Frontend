<script setup lang="ts">
import type { TransaccionHistoryResponse } from '~/types'

definePageMeta({
  middleware: ['auth']
})

const toast = useToast()
const api = useApi()

const estadoFilter = ref('Todos')
const page = ref(1)
const pageSize = 10

const data = ref<TransaccionHistoryResponse | null>(null)
const loading = ref(false)

function getEstadoParam(val: string) {
  return val === 'Todos' ? '' : val
}

async function fetchHistory() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, pageSize }
    const estado = getEstadoParam(estadoFilter.value)
    if (estado) params.estado = estado
    const res = await api<TransaccionHistoryResponse>('/api/transacciones/history', { params })
    data.value = res
  } catch {
    toast.add({ title: 'Error', description: 'No se pudieron cargar las transacciones', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    loading.value = false
  }
}

const estadoOptions = ['Todos', 'Pendiente', 'Pagado', 'Finalizado', 'Disputa', 'Cancelado']

function getEstadoColor(estado: string) {
  switch (estado) {
    case 'Pendiente': return 'warning'
    case 'Pagado': return 'info'
    case 'Finalizado': return 'success'
    case 'Disputa': return 'error'
    case 'Cancelado': return 'neutral'
    default: return 'neutral'
  }
}

function getOperacionIcon(tipo: string) {
  return tipo === 'Compra' ? 'i-lucide-arrow-down-left' : 'i-lucide-arrow-up-right'
}

function getOperacionColor(tipo: string) {
  return tipo === 'Compra' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
}

function irATransaccion(id: number) {
  navigateTo(`/transaction/${id}`)
}

watch(estadoFilter, () => { page.value = 1; fetchHistory() })

function totalPages() {
  return data.value?.totalPaginas || 1
}

onMounted(() => {
  fetchHistory()
})
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <header class="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-bold">Historial de Transacciones</h1>
        </div>
        <UButton label="Volver" color="neutral" variant="ghost" size="sm" icon="i-lucide-arrow-left" @click="navigateTo('/debug')" />
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8">
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div class="p-5 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div class="flex gap-3 items-center">
            <USelect v-model="estadoFilter" :items="estadoOptions" class="w-44" />
          </div>
          <UButton label="Buscar" color="primary" :loading="loading" @click="fetchHistory" />
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">ID</th>
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Operación</th>
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Moneda</th>
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Monto</th>
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">T. Cambio</th>
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Estado</th>
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Mi Rol</th>
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Contraparte</th>
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Inicio</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading" class="animate-pulse">
                <td v-for="i in 9" :key="i" class="px-5 py-4">
                  <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
                </td>
              </tr>
              <tr
                v-else
                v-for="tx in data?.datos || []"
                :key="tx.transaccionId"
                class="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
                @click="irATransaccion(tx.transaccionId)"
              >
                <td class="px-5 py-4 font-mono text-xs text-neutral-500">{{ tx.transaccionId }}</td>
                <td class="px-5 py-4">
                  <div class="flex items-center gap-1.5">
                    <UIcon :name="getOperacionIcon(tx.tipoOperacion)" :class="getOperacionColor(tx.tipoOperacion)" class="size-4" />
                    <span :class="getOperacionColor(tx.tipoOperacion)" class="font-medium">{{ tx.tipoOperacion }}</span>
                  </div>
                </td>
                <td class="px-5 py-4 font-medium">{{ tx.moneda }}</td>
                <td class="px-5 py-4 font-mono">{{ tx.montoOperacion.toFixed(2) }}</td>
                <td class="px-5 py-4 font-mono text-neutral-500">{{ tx.tipoCambioAplicado.toFixed(4) }}</td>
                <td class="px-5 py-4">
                  <UBadge :color="getEstadoColor(tx.estado)" variant="soft" size="sm">{{ tx.estado }}</UBadge>
                </td>
                <td class="px-5 py-4">
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">{{ tx.miRol }}</span>
                </td>
                <td class="px-5 py-4 font-medium">{{ tx.contraparte.nombres }} {{ tx.contraparte.apellidos }}</td>
                <td class="px-5 py-4 text-xs text-neutral-500">{{ new Date(tx.fechaInicio).toLocaleDateString() }}</td>
              </tr>
              <tr v-if="!loading && (!data?.datos || data.datos.length === 0)">
                <td colspan="9" class="text-center py-12 text-neutral-400">
                  <UIcon name="i-lucide-receipt" class="size-10 mx-auto mb-2" />
                  <p>No se encontraron transacciones</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <span class="text-xs text-neutral-500">Total: {{ data?.total || 0 }} transacciones</span>
          <div class="flex items-center gap-2">
            <UButton label="Anterior" color="neutral" variant="outline" size="sm" :disabled="page <= 1" @click="page--; fetchHistory()" />
            <span class="text-xs text-neutral-500">Pág. {{ page }} de {{ totalPages() }}</span>
            <UButton label="Siguiente" color="neutral" variant="outline" size="sm" :disabled="page >= totalPages()" @click="page++; fetchHistory()" />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
