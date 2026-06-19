<script setup lang="ts">
import type { GetDisputesAdminResponse, ResolveDisputeResponse, MensajeChatResponse, ErrorResponse } from '~/types'

definePageMeta({
  middleware: ['auth']
})

const toast = useToast()
const api = useApi()
const authStore = useAuthStore()

const searchQuery = ref('')
const disputes = ref<GetDisputesAdminResponse['datos']>([])
const selectedDispute = ref<GetDisputesAdminResponse['datos'][0] | null>(null)
const chatMessages = ref<MensajeChatResponse[]>([])
const loading = ref(true)
const loadingMessages = ref(false)
const resolving = ref(false)

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' - ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDateShort(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

async function fetchDisputes() {
  loading.value = true
  try {
    const res = await api<GetDisputesAdminResponse>('/api/admin/disputes', {
      params: { page: 1, pageSize: 50 }
    })
    disputes.value = res.datos
  } catch {
    toast.add({ title: 'Error', description: 'No se pudieron cargar las disputas', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    loading.value = false
  }
}

async function selectDispute(d: GetDisputesAdminResponse['datos'][0]) {
  selectedDispute.value = d
  loadingMessages.value = true
  chatMessages.value = []
  try {
    const msgs = await api<MensajeChatResponse[]>(`/api/transacciones/${d.transaccion.transaccionId}/messages`, {
      ignoreGlobalErrors: true
    } as any)
    chatMessages.value = msgs
  } catch {
    chatMessages.value = []
  } finally {
    loadingMessages.value = false
  }
}

async function resolveDispute(resolucion: 'A favor del comprador' | 'A favor del vendedor') {
  if (!selectedDispute.value) return
  resolving.value = true
  try {
    await api<ResolveDisputeResponse>(`/api/admin/disputes/${selectedDispute.value.disputaId}/resolve`, {
      method: 'POST',
      body: { resolucion }
    })
    toast.add({
      title: 'Disputa resuelta',
      description: resolucion === 'A favor del comprador' ? 'A favor del comprador' : 'A favor del vendedor',
      color: 'success',
      icon: 'i-lucide-circle-check'
    })
    selectedDispute.value = null
    await fetchDisputes()
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo resolver la disputa', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    resolving.value = false
  }
}

const filteredDisputes = computed(() => {
  if (!searchQuery.value) return disputes.value
  const q = searchQuery.value.toLowerCase()
  return disputes.value.filter(d => {
    const txId = `tx-${d.transaccion.transaccionId}`
    const buyer = `${d.transaccion.comprador.nombres} ${d.transaccion.comprador.apellidos}`.toLowerCase()
    const seller = `${d.transaccion.vendedor.nombres} ${d.transaccion.vendedor.apellidos}`.toLowerCase()
    return txId.includes(q) || buyer.includes(q) || seller.includes(q)
  })
})

onMounted(() => {
  if (!authStore.isAdmin) {
    toast.add({ title: 'Acceso Denegado', description: 'No tienes permisos de administrador', color: 'error' })
    navigateTo('/debug')
    return
  }
  fetchDisputes()
})
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950 flex flex-col">
    <header class="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-bold">Admin - Disputas</h1>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Administrador</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-neutral-500">{{ authStore.usuario?.nombres }}</span>
          <UButton label="Panel" color="neutral" variant="ghost" size="sm" icon="i-lucide-arrow-left" @click="navigateTo('/debug')" />
        </div>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
    <!-- Sidebar -->
    <div class="w-[380px] shrink-0 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">
      <div class="p-5 border-b border-neutral-100 dark:border-neutral-800">
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Active Disputes</h1>
        <div class="relative mt-3">
          <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <UInput v-model="searchQuery" placeholder="Search tickets..." class="w-full pl-9" :ui="{ base: 'pl-9' }" />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <USkeleton v-if="loading" v-for="i in 4" :key="i" class="h-28 rounded-lg" />

        <template v-else-if="filteredDisputes.length > 0">
          <div
            v-for="d in filteredDisputes"
            :key="d.disputaId"
            class="rounded-lg border p-4 cursor-pointer transition-all duration-150"
            :class="selectedDispute?.disputaId === d.disputaId
              ? 'border-neutral-400 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 shadow-sm'
              : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-500 hover:shadow-sm'"
            @click="selectDispute(d)"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-bold text-neutral-900 dark:text-white text-sm">TX-{{ d.transaccion.transaccionId }}</span>
              <span
                class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                :class="d.estado === 'Abierta'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'"
              >{{ d.estado === 'Abierta' ? 'Active' : 'Resolved' }}</span>
            </div>

            <p class="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
              {{ d.transaccion.comprador.nombres }} {{ d.transaccion.comprador.apellidos }}
              <span class="text-neutral-300 dark:text-neutral-600 mx-1">vs</span>
              {{ d.transaccion.vendedor.nombres }} {{ d.transaccion.vendedor.apellidos }}
            </p>

            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-neutral-900 dark:text-white">{{ formatCurrency(d.transaccion.montoOperacion) }}</span>
              <span class="text-[11px] text-neutral-400">{{ formatDate(d.fechaApertura) }}</span>
            </div>
          </div>
        </template>

        <div v-else class="flex flex-col items-center justify-center py-12 text-neutral-400">
          <UIcon name="i-lucide-inbox" class="size-8 mb-2" />
          <p class="text-sm">No disputes found</p>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <template v-if="selectedDispute">
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-y-auto p-6 space-y-5">
          <!-- Header -->
          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Dispute Case: TX-{{ selectedDispute.transaccion.transaccionId }}</h1>
              <div class="flex items-center gap-3 mt-2">
                <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">Active Investigation</span>
                <span class="text-xs text-neutral-400 flex items-center gap-1">
                  <UIcon name="i-lucide-calendar" class="size-3.5" />
                  Initiated {{ formatDateShort(selectedDispute.fechaApertura) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Info strip -->
          <div class="grid grid-cols-3 gap-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
            <div>
              <p class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">BUYER (SENDER)</p>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-building" class="size-4 text-neutral-500 shrink-0" />
                <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{{ selectedDispute.transaccion.comprador.nombres }} {{ selectedDispute.transaccion.comprador.apellidos }}</span>
              </div>
            </div>
            <div>
              <p class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">SELLER (RECIPIENT)</p>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-building" class="size-4 text-neutral-500 shrink-0" />
                <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{{ selectedDispute.transaccion.vendedor.nombres }} {{ selectedDispute.transaccion.vendedor.apellidos }}</span>
              </div>
            </div>
            <div>
              <p class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">DISPUTED AMOUNT</p>
              <span class="text-lg font-bold text-red-600 dark:text-red-400">{{ formatCurrency(selectedDispute.transaccion.montoOperacion) }}</span>
            </div>
          </div>

          <!-- Evidence + Audit Trail -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <!-- Evidence -->
            <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <div class="p-4 border-b border-neutral-100 dark:border-neutral-800">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-file-text" class="size-4 text-neutral-600 dark:text-neutral-400" />
                  <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">PROVIDED EVIDENCE</span>
                </div>
              </div>
              <div class="p-4">
                <div v-if="selectedDispute.transaccion.comprobantes && selectedDispute.transaccion.comprobantes.length > 0">
                  <img
                    v-for="c in selectedDispute.transaccion.comprobantes"
                    :key="c.comprobanteId"
                    :src="c.imagenUrl"
                    alt="Voucher"
                    class="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 mb-3 last:mb-0"
                  />
                </div>
                <div v-else class="flex flex-col items-center justify-center py-12 text-neutral-400">
                  <UIcon name="i-lucide-image-off" class="size-8 mb-2" />
                  <p class="text-sm">No evidence uploaded</p>
                </div>
              </div>
            </div>

            <!-- Audit Trail -->
            <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
              <div class="p-4 border-b border-neutral-100 dark:border-neutral-800">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-message-square-text" class="size-4 text-neutral-600 dark:text-neutral-400" />
                  <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">TRANSACTION AUDIT TRAIL</span>
                </div>
              </div>
              <div class="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
                <div class="text-center mb-3">
                  <span class="text-[11px] font-medium text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                    Dispute opened on {{ formatDate(selectedDispute.fechaApertura) }}
                  </span>
                </div>

                <USkeleton v-if="loadingMessages" v-for="i in 3" :key="i" class="h-20 rounded-lg" />

                <template v-else-if="chatMessages.length > 0">
                  <div v-for="msg in chatMessages" :key="msg.mensajeId">
                    <div v-if="msg.remitenteId === selectedDispute.transaccion.comprador.usuarioId">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{{ selectedDispute.transaccion.comprador.nombres }} {{ selectedDispute.transaccion.comprador.apellidos }} <span class="text-[11px] text-neutral-400 font-normal">(Buyer)</span></span>
                        <span class="text-[11px] text-neutral-400">{{ formatTime(msg.fechaEnvio) }}</span>
                      </div>
                      <div class="bg-neutral-100 dark:bg-neutral-800 rounded-lg rounded-tl-none p-3 max-w-[85%]">
                        <p class="text-sm text-neutral-800 dark:text-neutral-200">{{ msg.contenido }}</p>
                      </div>
                    </div>
                    <div v-else class="flex flex-col items-end">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-[11px] text-neutral-400">{{ formatTime(msg.fechaEnvio) }}</span>
                        <span class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{{ selectedDispute.transaccion.vendedor.nombres }} {{ selectedDispute.transaccion.vendedor.apellidos }} <span class="text-[11px] text-neutral-400 font-normal">(Seller)</span></span>
                      </div>
                      <div class="bg-neutral-800 dark:bg-neutral-700 rounded-lg rounded-tr-none p-3 max-w-[85%]">
                        <p class="text-sm text-white">{{ msg.contenido }}</p>
                      </div>
                    </div>
                  </div>
                </template>

                <div v-else class="flex flex-col items-center justify-center py-8 text-neutral-400">
                  <UIcon name="i-lucide-message-circle-off" class="size-8 mb-2" />
                  <p class="text-sm">No messages in this dispute</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer actions -->
        <div v-if="selectedDispute.estado === 'Abierta'" class="shrink-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-2 text-sm text-neutral-500">
            <UIcon name="i-lucide-info" class="size-4 text-neutral-400" />
            <span>Admin Action Required to Resolve Dispute</span>
          </div>
          <div class="flex items-center gap-3">
            <UButton
              label="APROBAR AL VENDEDOR"
              color="neutral"
              variant="outline"
              icon="i-lucide-x"
              :loading="resolving"
              :disabled="resolving"
              @click="resolveDispute('A favor del vendedor')"
            />
            <UButton
              label="APROBAR AL COMPRADOR"
              color="error"
              icon="i-lucide-check"
              class="text-white font-semibold"
              :loading="resolving"
              :disabled="resolving"
              @click="resolveDispute('A favor del comprador')"
            />
          </div>
        </div>
        <div v-else class="shrink-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-center">
          <div class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <UIcon name="i-lucide-circle-check" class="size-4" />
            <span>Dispute Resolved — {{ selectedDispute.resolucion }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center text-neutral-400">
        <UIcon name="i-lucide-arrow-left-from-line" class="size-10 mx-auto mb-3" />
        <p class="text-sm font-medium">Select a dispute to review</p>
        <p class="text-xs mt-1">Choose a case from the sidebar to begin investigation</p>
      </div>
      </div>
    </div>
  </div>
</template>
