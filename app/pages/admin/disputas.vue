<script setup lang="ts">
import type { 
  GetDisputesAdminResponse, 
  ResolveDisputeResponse, 
  MensajeChatResponse, 
  ErrorResponse, 
  TransaccionDetailResponse, 
  OfertaDetalleResponse 
} from '~/types'

definePageMeta({
  middleware: ['auth'],
  title: "Administración - Disputas"
})

const toast = useToast()
const api = useApi()
const authStore = useAuthStore()

const searchQuery = ref('')
const disputes = ref<GetDisputesAdminResponse['datos']>([])
const selectedDispute = ref<GetDisputesAdminResponse['datos'][0] | null>(null)
const transactionDetails = ref<TransaccionDetailResponse | null>(null)
const offerDetails = ref<OfertaDetalleResponse | null>(null)
const chatMessages = ref<MensajeChatResponse[]>([])

const loading = ref(true)
const loadingTxDetails = ref(false)
const loadingMessages = ref(false)
const resolving = ref(false)

// Estados para previsualizar imágenes de comprobantes
const isImageModalOpen = ref(false)
const selectedImage = ref('')

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatCurrencyWithCode(amount: number, currency: string) {
  const symbol = currency === 'PEN' ? 'S/.' : '$'
  return `${symbol} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-PE', { month: 'short', day: 'numeric', year: 'numeric' }) + ' - ' +
    d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

function formatDateShort(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-PE', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
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
  loadingTxDetails.value = true
  chatMessages.value = []
  transactionDetails.value = null
  offerDetails.value = null
  
  try {
    const tx = await api<TransaccionDetailResponse>(`/api/transacciones/${d.transaccion.transaccionId}`)
    transactionDetails.value = tx
    
    try {
      const off = await api<OfertaDetalleResponse>(`/api/ofertas/${tx.ofertaId}`)
      offerDetails.value = off
    } catch (err) {
      console.error('Error al obtener los detalles de la oferta:', err)
    }
  } catch (err) {
    console.error('Error al obtener los detalles de la transacción:', err)
    toast.add({ 
      title: 'Error', 
      description: 'No se pudieron cargar los detalles completos de la transacción', 
      color: 'error', 
      icon: 'i-lucide-alert-circle' 
    })
  } finally {
    loadingTxDetails.value = false
  }

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

function openPreview(url: string) {
  selectedImage.value = url
  isImageModalOpen.value = true
}

const buyerSendsAmount = computed(() => {
  if (!transactionDetails.value) return { amount: 0, currency: '' }
  const accountCurrency = transactionDetails.value.instruccionesPago.tipoMoneda
  const offerCurrency = offerDetails.value?.moneda || 'USD'
  
  if (accountCurrency === offerCurrency) {
    return {
      amount: transactionDetails.value.montoOperacion,
      currency: accountCurrency
    }
  } else {
    return {
      amount: Number((transactionDetails.value.montoOperacion * transactionDetails.value.tipoCambioAplicado).toFixed(2)),
      currency: accountCurrency
    }
  }
})

const sellerSendsAmount = computed(() => {
  if (!transactionDetails.value || !transactionDetails.value.metodoPagoComprador) return null
  const accountCurrency = transactionDetails.value.metodoPagoComprador.tipoMoneda
  const offerCurrency = offerDetails.value?.moneda || 'USD'
  
  if (accountCurrency === offerCurrency) {
    return {
      amount: transactionDetails.value.montoOperacion,
      currency: accountCurrency
    }
  } else {
    return {
      amount: Number((transactionDetails.value.montoOperacion * transactionDetails.value.tipoCambioAplicado).toFixed(2)),
      currency: accountCurrency
    }
  }
})

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
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <div class="w-[380px] shrink-0 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">
        <div class="p-5 border-b border-neutral-100 dark:border-neutral-800">
          <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Disputas Activas</h1>
          <div class="mt-3">
            <UInput v-model="searchQuery" placeholder="Buscar por ID o nombre..." icon="i-lucide-search" class="w-full" />
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
                >{{ d.estado === 'Abierta' ? 'Activa' : 'Resuelta' }}</span>
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
            <p class="text-sm">No se encontraron disputas</p>
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
                <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Caso de Disputa: TX-{{ selectedDispute.transaccion.transaccionId }}</h1>
                <div class="flex items-center gap-3 mt-2">
                  <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">Investigación Activa</span>
                  <span class="text-xs text-neutral-400 flex items-center gap-1">
                    <UIcon name="i-lucide-calendar" class="size-3.5" />
                    Iniciada el {{ formatDateShort(selectedDispute.fechaApertura) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Info strip -->
            <div class="grid grid-cols-2 gap-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
              <div>
                <p class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">COMPRADOR</p>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-user" class="size-4 text-neutral-500 shrink-0" />
                  <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{{ selectedDispute.transaccion.comprador.nombres }} {{ selectedDispute.transaccion.comprador.apellidos }}</span>
                </div>
              </div>
              <div>
                <p class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">VENDEDOR</p>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-user" class="size-4 text-neutral-500 shrink-0" />
                  <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{{ selectedDispute.transaccion.vendedor.nombres }} {{ selectedDispute.transaccion.vendedor.apellidos }}</span>
                </div>
              </div>
            </div>

            <!-- Detalle de Cuentas y Liquidación Cruzada -->
            <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4">
              <h3 class="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <UIcon name="i-lucide-arrow-left-right" class="size-4 text-primary" />
                Detalle de Cuentas e Intercambio Cruzado (P2P)
              </h3>
              
              <USkeleton v-if="loadingTxDetails" class="h-28 w-full rounded-lg" />
              
              <div v-else-if="transactionDetails" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Comprador debe pagar a Vendedor -->
                <div class="p-4 rounded-lg bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">PAGO DEL COMPRADOR</span>
                      <span class="text-[10px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">De Comprador a Vendedor</span>
                    </div>
                    <div class="text-xs text-neutral-500 mb-2">
                      El comprador <strong class="text-neutral-800 dark:text-neutral-200">{{ transactionDetails.comprador.nombres }} {{ transactionDetails.comprador.apellidos }}</strong> debe transferir:
                    </div>
                    <div class="text-2xl font-black text-red-600 dark:text-red-400 mb-4">
                      {{ formatCurrencyWithCode(buyerSendsAmount.amount, buyerSendsAmount.currency) }}
                    </div>
                  </div>
                  <div class="border-t border-red-100 dark:border-red-900/20 pt-3 space-y-2">
                    <div class="text-xs text-neutral-400 font-semibold uppercase">A la cuenta bancaria del Vendedor:</div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span class="text-neutral-400 block text-[10px]">Banco</span>
                        <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ transactionDetails.instruccionesPago.banco }}</span>
                      </div>
                      <div>
                        <span class="text-neutral-400 block text-[10px]">Titular</span>
                        <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ transactionDetails.instruccionesPago.nombreTitular }}</span>
                      </div>
                      <div class="col-span-2">
                        <span class="text-neutral-400 block text-[10px]">Número de Cuenta</span>
                        <span class="font-mono font-bold text-neutral-800 dark:text-neutral-200 bg-white/60 dark:bg-neutral-800/40 px-1.5 py-0.5 rounded border border-neutral-200/50 dark:border-neutral-700/50 select-all block">{{ transactionDetails.instruccionesPago.numeroCuenta }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Vendedor debe pagar a Comprador -->
                <div class="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">PAGO DEL VENDEDOR</span>
                      <span class="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">De Vendedor a Comprador</span>
                    </div>
                    <div class="text-xs text-neutral-500 mb-2">
                      El vendedor <strong class="text-neutral-800 dark:text-neutral-200">{{ transactionDetails.vendedor.nombres }} {{ transactionDetails.vendedor.apellidos }}</strong> debe transferir:
                    </div>
                    <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-4">
                      <span v-if="sellerSendsAmount">
                        {{ formatCurrencyWithCode(sellerSendsAmount.amount, sellerSendsAmount.currency) }}
                      </span>
                      <span v-else class="text-sm font-semibold text-neutral-400">Sin datos de envío</span>
                    </div>
                  </div>
                  <div class="border-t border-emerald-100 dark:border-emerald-900/20 pt-3 space-y-2">
                    <div class="text-xs text-neutral-400 font-semibold uppercase">A la cuenta bancaria del Comprador:</div>
                    <div v-if="transactionDetails.metodoPagoComprador" class="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span class="text-neutral-400 block text-[10px]">Banco</span>
                        <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ transactionDetails.metodoPagoComprador.banco }}</span>
                      </div>
                      <div>
                        <span class="text-neutral-400 block text-[10px]">Titular</span>
                        <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ transactionDetails.metodoPagoComprador.nombreTitular }}</span>
                      </div>
                      <div class="col-span-2">
                        <span class="text-neutral-400 block text-[10px]">Número de Cuenta</span>
                        <span class="font-mono font-bold text-neutral-800 dark:text-neutral-200 bg-white/60 dark:bg-neutral-800/40 px-1.5 py-0.5 rounded border border-neutral-200/50 dark:border-neutral-700/50 select-all block">{{ transactionDetails.metodoPagoComprador.numeroCuenta }}</span>
                      </div>
                    </div>
                    <div v-else class="text-xs text-neutral-400 italic py-2">
                      El comprador no seleccionó cuenta de recepción para esta transacción.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Evidence + Audit Trail -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <!-- Evidence (Comprobantes) -->
              <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
                <div class="p-4 border-b border-neutral-100 dark:border-neutral-800">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-file-text" class="size-4 text-neutral-600 dark:text-neutral-400" />
                    <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">COMPROBANTES DE PAGO SUBIDOS</span>
                  </div>
                </div>
                <div class="p-4 flex-1">
                  <USkeleton v-if="loadingTxDetails" v-for="i in 2" :key="i" class="h-40 rounded-lg mb-3" />
                  
                  <div v-else-if="transactionDetails && transactionDetails.comprobantes && transactionDetails.comprobantes.length > 0" class="space-y-4">
                    <div
                      v-for="c in transactionDetails.comprobantes"
                      :key="c.comprobanteId"
                      class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 overflow-hidden p-3"
                    >
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-bold px-2.5 py-0.5 rounded-full"
                          :class="c.usuarioId === transactionDetails.comprador.usuarioId
                            ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                            : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'"
                        >
                          {{ c.usuarioId === transactionDetails.comprador.usuarioId ? 'Subido por Comprador' : 'Subido por Vendedor' }}
                        </span>
                        <span class="text-[10px] text-neutral-400">{{ formatDate(c.fechaSubida) }}</span>
                      </div>
                      
                      <p class="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        {{ c.usuarioId === transactionDetails.comprador.usuarioId 
                          ? `${transactionDetails.comprador.nombres} ${transactionDetails.comprador.apellidos}` 
                          : `${transactionDetails.vendedor.nombres} ${transactionDetails.vendedor.apellidos}` }}
                      </p>
                      
                      <!-- Contenedor de miniatura con tamaño controlado -->
                      <div 
                        class="relative h-44 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 group cursor-pointer"
                        @click="openPreview(c.imagenUrl)"
                      >
                        <img
                          :src="c.imagenUrl"
                          alt="Comprobante de Pago"
                          class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        />
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                          <span class="text-white text-xs font-semibold flex items-center gap-1">
                            <UIcon name="i-lucide-zoom-in" class="size-4" />
                            Ampliar comprobante
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-else-if="selectedDispute.transaccion.comprobantes && selectedDispute.transaccion.comprobantes.length > 0" class="space-y-4">
                    <div
                      v-for="c in selectedDispute.transaccion.comprobantes"
                      :key="c.comprobanteId"
                      class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 overflow-hidden p-3"
                    >
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          Comprobante
                        </span>
                        <span class="text-[10px] text-neutral-400">{{ formatDate(c.fechaSubida) }}</span>
                      </div>
                      
                      <div 
                        class="relative h-44 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 group cursor-pointer"
                        @click="openPreview(c.imagenUrl)"
                      >
                        <img
                          :src="c.imagenUrl"
                          alt="Comprobante"
                          class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        />
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                          <span class="text-white text-xs font-semibold flex items-center gap-1">
                            <UIcon name="i-lucide-zoom-in" class="size-4" />
                            Ampliar comprobante
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-else class="flex flex-col items-center justify-center py-12 text-neutral-400">
                    <UIcon name="i-lucide-image-off" class="size-8 mb-2" />
                    <p class="text-sm">No se han subido comprobantes</p>
                  </div>
                </div>
              </div>

              <!-- Audit Trail -->
              <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
                <div class="p-4 border-b border-neutral-100 dark:border-neutral-800">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-message-square-text" class="size-4 text-neutral-600 dark:text-neutral-400" />
                    <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">HISTORIAL Y CHAT DE LA TRANSACCIÓN</span>
                  </div>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
                  <div class="text-center mb-3">
                    <span class="text-[11px] font-medium text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                      Disputa abierta el {{ formatDate(selectedDispute.fechaApertura) }}
                    </span>
                  </div>

                  <USkeleton v-if="loadingMessages" v-for="i in 3" :key="i" class="h-20 rounded-lg" />

                  <template v-else-if="chatMessages.length > 0">
                    <div v-for="msg in chatMessages" :key="msg.mensajeId">
                      <div v-if="msg.remitenteId === selectedDispute.transaccion.comprador.usuarioId">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{{ selectedDispute.transaccion.comprador.nombres }} {{ selectedDispute.transaccion.comprador.apellidos }} <span class="text-[11px] text-neutral-400 font-normal">(Comprador)</span></span>
                          <span class="text-[11px] text-neutral-400">{{ formatTime(msg.fechaEnvio) }}</span>
                        </div>
                        <div class="bg-neutral-100 dark:bg-neutral-800 rounded-lg rounded-tl-none p-3 max-w-[85%]">
                          <p class="text-sm text-neutral-800 dark:text-neutral-200">{{ msg.contenido }}</p>
                        </div>
                      </div>
                      <div v-else class="flex flex-col items-end">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-[11px] text-neutral-400">{{ formatTime(msg.fechaEnvio) }}</span>
                          <span class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{{ selectedDispute.transaccion.vendedor.nombres }} {{ selectedDispute.transaccion.vendedor.apellidos }} <span class="text-[11px] text-neutral-400 font-normal">(Vendedor)</span></span>
                        </div>
                        <div class="bg-neutral-800 dark:bg-neutral-700 rounded-lg rounded-tr-none p-3 max-w-[85%]">
                          <p class="text-sm text-white">{{ msg.contenido }}</p>
                        </div>
                      </div>
                    </div>
                  </template>

                  <div v-else class="flex flex-col items-center justify-center py-8 text-neutral-400">
                    <UIcon name="i-lucide-message-circle-off" class="size-8 mb-2" />
                    <p class="text-sm">No hay mensajes en esta disputa</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Guía de Resolución de Disputas -->
            <div class="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 text-xs text-neutral-600 dark:text-neutral-400 space-y-2 mt-5">
              <div class="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wide">
                <UIcon name="i-lucide-shield-alert" class="size-4" />
                Guía de Resolución de Disputas
              </div>
              <p>Como administrador, tu resolución afectará el sistema de la siguiente manera:</p>
              <ul class="list-disc list-inside space-y-1 pl-1">
                <li>
                  <strong class="text-neutral-800 dark:text-neutral-200">A favor del Vendedor:</strong> 
                  Se finaliza la transacción. La operación se marca como completada de forma definitiva en el sistema.
                </li>
                <li>
                  <strong class="text-neutral-800 dark:text-neutral-200">A favor del Comprador:</strong> 
                  Se cancela la transacción. La oferta vuelve a estar activa y visible en el mercado P2P para recibir nuevas solicitudes.
                </li>
              </ul>
            </div>
          </div>

          <!-- Footer actions -->
          <div v-if="selectedDispute.estado === 'Abierta'" class="shrink-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-2 text-sm text-neutral-500">
              <UIcon name="i-lucide-info" class="size-4 text-neutral-400" />
              <span>Se requiere acción de administrador para resolver la disputa</span>
            </div>
            <div class="flex items-center gap-3">
              <UButton
                label="A FAVOR DEL VENDEDOR"
                color="neutral"
                variant="outline"
                icon="i-lucide-x"
                :loading="resolving"
                :disabled="resolving"
                @click="resolveDispute('A favor del vendedor')"
              />
              <UButton
                label="A FAVOR DEL COMPRADOR"
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
              <span>Disputa Resuelta — {{ selectedDispute.resolucion }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else class="flex-1 flex items-center justify-center">
        <div class="text-center text-neutral-400">
          <UIcon name="i-lucide-arrow-left-from-line" class="size-10 mx-auto mb-3" />
          <p class="text-sm font-medium">Selecciona una disputa para revisar</p>
          <p class="text-xs mt-1">Elige un caso de la barra lateral para ver los detalles e iniciar la revisión</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal para ver el comprobante en tamaño completo -->
  <UModal v-model:open="isImageModalOpen" title="Vista Previa de Comprobante" :ui="{ width: 'max-w-4xl' }">
    <template #body>
      <div class="flex flex-col items-center">
        <div class="w-full overflow-auto max-h-[70vh] flex justify-center bg-neutral-100 dark:bg-neutral-900 rounded-lg p-2 border border-neutral-200 dark:border-neutral-800">
          <img :src="selectedImage" alt="Comprobante de Pago Completo" class="max-w-full h-auto object-contain rounded" />
        </div>
      </div>
    </template>
    <template #footer="{ close }">
      <div class="w-full flex justify-end">
        <UButton label="Cerrar" color="neutral" variant="outline" @click="close" />
      </div>
    </template>
  </UModal>
</template>
