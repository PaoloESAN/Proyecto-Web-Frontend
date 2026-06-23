<script setup lang="ts">
import type { UsuarioOfertasResponse, OfertaUpdateRequest, TransaccionHistoryResponse } from '~/types'

definePageMeta({
  middleware: ['auth'],
  title: 'Ofertas'
})

const api = useApi()
const toast = useToast()
const route = useRoute()

const offers = ref<UsuarioOfertasResponse>([])
const receivedTransactions = ref<TransaccionHistoryResponse['datos']>([])
const loading = ref(false)

const editModalOpen = ref(false)
const editingOffer = ref<UsuarioOfertasResponse[number] | null>(null)
const editCantidad = ref<number>(0)
const saving = ref(false)

const confirmCancelOpen = ref(false)
const cancellingOffer = ref<UsuarioOfertasResponse[number] | null>(null)
const deleting = ref(false)

type ViewType = 'received' | 'made'
const currentView = computed<ViewType>(() => {
  return route.query.view === 'received' ? 'received' : 'made'
})

async function fetchAllData() {
  loading.value = true
  try {
    const [offersRes, txRes] = await Promise.all([
      api<UsuarioOfertasResponse>('/api/ofertas/usuario'),
      api<TransaccionHistoryResponse>('/api/transacciones/history', { params: { page: 1, pageSize: 200 } })
    ])

    offers.value = offersRes ?? []
    receivedTransactions.value = (txRes?.datos ?? []).filter(t => t.miRol === 'Vendedor')
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo cargar la información de ofertas.', color: 'error' })
  } finally {
    loading.value = false
  }
}



function abrirEditar(item: UsuarioOfertasResponse[number]) {
  if (item.estado !== 'Activa') return
  editingOffer.value = item
  editCantidad.value = item.tipoOperacion === 'Compra' ? item.montoRecibo : item.montoTengo
  editModalOpen.value = true
}

async function guardarEdicion() {
  if (!editingOffer.value) return
  saving.value = true
  try {
    const body: OfertaUpdateRequest = { cantidad: Number(editCantidad.value) }
    await api(`/api/ofertas/${editingOffer.value.ofertaId}`, { method: 'PUT', body })
    toast.add({ title: 'Oferta actualizada', description: 'La cantidad se actualizó correctamente.', color: 'success' })
    editModalOpen.value = false
    await fetchAllData()
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo actualizar la oferta.', color: 'error' })
  } finally {
    saving.value = false
  }
}

function confirmarCancelar(item: UsuarioOfertasResponse[number]) {
  if (item.estado !== 'Activa') return
  cancellingOffer.value = item
  confirmCancelOpen.value = true
}

async function ejecutarCancelacion() {
  if (!cancellingOffer.value) return
  deleting.value = true
  try {
    await api(`/api/ofertas/${cancellingOffer.value.ofertaId}`, { method: 'DELETE' })
    toast.add({ title: 'Oferta cancelada', color: 'success' })
    confirmCancelOpen.value = false
    await fetchAllData()
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo cancelar la oferta.', color: 'error' })
  } finally {
    deleting.value = false
  }
}

onMounted(fetchAllData)
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <main class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-xl font-bold text-neutral-900 dark:text-white">
            {{ currentView === 'received' ? 'Mis transacciones' : 'Mis ofertas' }}
          </h1>
          <p class="text-sm text-neutral-500 mt-1">
            {{ currentView === 'received' ? 'Transacciones iniciadas sobre tus publicaciones.' : 'Gestiona tus ofertas publicadas.' }}
          </p>
        </div>

        <UButton
          v-if="currentView === 'made'"
          label="Nueva Oferta"
          color="primary"
          icon="i-lucide-plus"
          @click="navigateTo('/offers/new')"
          class="font-semibold cursor-pointer"
        />
      </div>

      <div v-if="loading" class="grid gap-4">
        <USkeleton v-for="i in 3" :key="i" class="h-28 rounded-xl" />
      </div>

      <template v-else-if="currentView === 'received'">
        <div v-if="receivedTransactions.length === 0" class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-16 text-center">
          <p class="text-neutral-500 font-medium">Aún no te han hecho ofertas</p>
          <p class="text-sm text-neutral-400 mt-1">Cuando acepten tus publicaciones aparecerán aquí.</p>
        </div>

        <div v-else class="grid gap-4">
          <NuxtLink
            v-for="tx in receivedTransactions"
            :key="tx.transaccionId"
            :to="`/transaction/${tx.transaccionId}`"
            class="block rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-4 space-y-3 hover:shadow-md transition"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-bold">Transacción #{{ tx.transaccionId }}</p>
                <p class="text-xs text-neutral-500">Oferta #{{ tx.ofertaId }} · {{ tx.tipoOperacion }} · {{ tx.monedaTengo }} → {{ tx.monedaRecibo }}</p>
              </div>
              <UBadge :color="tx.estado === 'Disputa' ? 'error' : (tx.estado === 'Pendiente' ? 'warning' : (tx.estado === 'Pagado' ? 'info' : 'primary'))" variant="soft">
                {{ tx.estado }}
              </UBadge>
            </div>

            <div class="grid sm:grid-cols-3 gap-3 text-sm">
              <div class="border border-default rounded-lg p-3">
                <p class="text-xs text-neutral-500">Entrega contraparte</p>
                <p class="font-bold">{{ Number(tx.montoTengo).toLocaleString() }} {{ tx.monedaTengo }}</p>
              </div>
              <div class="border border-default rounded-lg p-3">
                <p class="text-xs text-neutral-500">Recibe contraparte</p>
                <p class="font-bold">{{ Number(tx.montoRecibo).toLocaleString() }} {{ tx.monedaRecibo }}</p>
              </div>
              <div class="border border-default rounded-lg p-3">
                <p class="text-xs text-neutral-500">Usuario</p>
                <p class="font-bold">{{ tx.contraparte.nombres }} {{ tx.contraparte.apellidos }}</p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </template>

      <template v-else>
        <div v-if="offers.length === 0" class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-16 text-center">
          <p class="text-neutral-500 font-medium">Aún no tienes ofertas creadas</p>
        </div>

        <div v-else class="grid gap-4">
          <div v-for="item in offers" :key="item.ofertaId" class="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-bold">{{ item.tipoOperacion }} · {{ item.monedaTengo }} → {{ item.monedaRecibo }}</p>
                <p class="text-xs text-neutral-500">Oferta #{{ item.ofertaId }}</p>
              </div>
              <UBadge :color="item.estado === 'Activa' ? 'primary' : 'warning'" variant="subtle">{{ item.estado }}</UBadge>
            </div>

            <div class="grid sm:grid-cols-3 gap-3 text-sm">
              <div class="border border-default rounded-lg p-3">
                <p class="text-xs text-neutral-500">Monto que entregas</p>
                <p class="font-bold">{{ Number(item.montoTengo).toLocaleString() }} {{ item.monedaTengo }}</p>
              </div>
              <div class="border border-default rounded-lg p-3">
                <p class="text-xs text-neutral-500">Monto que recibes</p>
                <p class="font-bold">{{ Number(item.montoRecibo).toLocaleString() }} {{ item.monedaRecibo }}</p>
              </div>
              <div class="border border-default rounded-lg p-3">
                <p class="text-xs text-neutral-500">Tipo de cambio</p>
                <p class="font-bold">{{ Number(item.tipoCambio).toFixed(6) }}</p>
              </div>
            </div>

            <div v-if="item.estado === 'Activa'" class="flex justify-end gap-2">
              <UButton label="Editar" color="neutral" variant="outline" @click="abrirEditar(item)" />
              <UButton label="Cancelar" color="error" variant="outline" @click="confirmarCancelar(item)" />
            </div>
          </div>
        </div>
      </template>
    </main>

    <UModal v-model:open="editModalOpen" title="Editar cantidad">
      <template #body>
        <UFormField label="Nueva cantidad" required>
          <UInput v-model.number="editCantidad" type="number" step="0.01" :min="0" class="w-full" />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex gap-2 justify-end w-full">
          <UButton label="Cerrar" color="neutral" variant="outline" @click="editModalOpen = false" />
          <UButton label="Guardar" color="primary" :loading="saving" @click="guardarEdicion" />
        </div>
      </template>
    </UModal>

    <UModal v-model:open="confirmCancelOpen" title="Cancelar oferta">
      <template #body>
        <p class="text-sm">¿Seguro que deseas cancelar esta oferta?</p>
      </template>
      <template #footer>
        <div class="flex gap-2 justify-end w-full">
          <UButton label="No" color="neutral" variant="outline" @click="confirmCancelOpen = false" />
          <UButton label="Sí, cancelar" color="error" :loading="deleting" @click="ejecutarCancelacion" />
        </div>
      </template>
    </UModal>
  </div>
</template>
