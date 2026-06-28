<script setup lang="ts">
import type { UsuarioOfertasResponse, OfertaUpdateRequest, TransaccionHistoryResponse } from '~/types'

definePageMeta({
  middleware: ['auth'],
  title: 'Mis ofertas'
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

const inProgressTxByOfferId = computed(() => {
  const map = new Map<number, number>()

  for (const tx of receivedTransactions.value) {
    if (!map.has(tx.ofertaId)) {
      map.set(tx.ofertaId, tx.transaccionId)
    }
  }

  return map
})



function formatAmount(value: number) {
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}



function offerStatusColor(estado: string) {
  if (estado === 'Activa') return 'success'
  if (estado === 'En Proceso') return 'warning'
  return 'neutral'
}



function getInProgressTransactionId(ofertaId: number) {
  return inProgressTxByOfferId.value.get(ofertaId) ?? null
}

function openInProgressOffer(item: UsuarioOfertasResponse[number]) {
  if (item.estado !== 'En Proceso') return

  const txId = getInProgressTransactionId(item.ofertaId)
  if (!txId) {
    toast.add({
      title: 'Transacción no encontrada',
      description: 'No se pudo resolver la transacción asociada a esta oferta.',
      color: 'warning'
    })
    return
  }

  navigateTo(`/transaction/${txId}`)
}

async function fetchAllData() {
  loading.value = true
  try {
    const [offersRes, txRes] = await Promise.all([
      api<UsuarioOfertasResponse>('/api/ofertas/usuario'),
      api<TransaccionHistoryResponse>('/api/transacciones/history', { params: { page: 1, pageSize: 200 } })
    ])

    offers.value = offersRes ?? []
    receivedTransactions.value = (txRes?.datos ?? []).filter(t => t.miRol === 'Vendedor' && t.estado !== 'Finalizado')
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

onMounted(async () => {
  if (route.query.view) {
    await navigateTo('/my-offers', { replace: true })
    return
  }

  await fetchAllData()
})
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <main class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Mis ofertas</h1>
          <p class="text-sm text-neutral-500 mt-1">Gestiona tus ofertas publicadas.</p>
        </div>

        <UButton
          label="Nueva Oferta"
          color="primary"
          icon="i-lucide-plus"
          class="font-semibold cursor-pointer"
          @click="navigateTo('/offers/new')"
        />
      </div>

      <div v-if="loading" class="grid gap-4">
        <USkeleton v-for="i in 3" :key="i" class="h-28 rounded-xl" />
      </div>

      <template v-else>
        <div v-if="offers.length === 0" class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-16 text-center">
          <p class="text-neutral-500 font-medium">Aún no tienes ofertas creadas</p>
        </div>

        <div v-else class="grid gap-4">
          <div
            v-for="item in offers"
            :key="item.ofertaId"
            :class="[
              'group rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-5 space-y-4 transition-all duration-200',
              item.estado === 'En Proceso'
                ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30'
                : ''
            ]"
            @click="openInProgressOffer(item)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-lg font-extrabold text-neutral-900 dark:text-white">Oferta #{{ item.ofertaId }}</p>
                <p class="text-xs sm:text-sm text-neutral-500 mt-0.5 truncate">
                  {{ item.tipoOperacion }} · {{ item.monedaTengo }} → {{ item.monedaRecibo }}
                </p>
              </div>
              <UBadge :color="offerStatusColor(item.estado)" variant="soft" class="shrink-0">{{ item.estado }}</UBadge>
            </div>

            <div class="grid sm:grid-cols-3 gap-3 text-sm">
              <div class="rounded-xl border border-default bg-muted/20 p-3.5">
                <p class="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold">Tú entregas</p>
                <p class="font-extrabold text-rose-500 mt-1">{{ formatAmount(item.montoTengo) }} {{ item.monedaTengo }}</p>
              </div>
              <div class="rounded-xl border border-default bg-muted/20 p-3.5">
                <p class="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold">Tú recibes</p>
                <p class="font-extrabold text-emerald-500 mt-1">{{ formatAmount(item.montoRecibo) }} {{ item.monedaRecibo }}</p>
              </div>
              <div class="rounded-xl border border-default bg-muted/20 p-3.5">
                <p class="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold">Tipo de cambio</p>
                <p class="font-extrabold mt-1 text-neutral-900 dark:text-neutral-100">{{ Number(item.tipoCambio).toFixed(6) }}</p>
              </div>
            </div>

            <div class="flex items-center justify-between gap-3 flex-wrap">
              <p v-if="item.estado !== 'Activa'" class="text-xs text-neutral-500 font-medium">
                Esta oferta está en proceso y no puede editarse ni cancelarse.
              </p>

              <div
                v-if="item.estado === 'En Proceso'"
                class="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Abrir transacción
                <UIcon name="i-lucide-arrow-right" class="size-3.5 ml-1 inline-block" />
              </div>

              <div v-if="item.estado === 'Activa'" class="ml-auto flex justify-end gap-2">
                <UButton label="Editar" color="neutral" variant="outline" icon="i-lucide-pencil" @click.stop="abrirEditar(item)" />
                <UButton label="Cancelar" color="error" variant="outline" icon="i-lucide-x" @click.stop="confirmarCancelar(item)" />
              </div>
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
