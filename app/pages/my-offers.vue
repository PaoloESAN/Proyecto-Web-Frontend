<script setup lang="ts">
import type { UsuarioOfertasResponse, OfertaUpdateRequest } from '~/types'

definePageMeta({
  middleware: ['auth'],
  title: "Mis Ofertas"
})

const api = useApi()
const toast = useToast()

const offers = ref<UsuarioOfertasResponse>([])
const loading = ref(false)

// Edit modal state
const editModalOpen = ref(false)
const editingOffer = ref<UsuarioOfertasResponse[number] | null>(null)
const editForm = reactive({
  montoTotal: 0,
  montoMinimo: 0,
  montoMaximo: 0,
  tipoCambio: 0,
})
const saving = ref(false)

// Cancel confirmation modal state
const confirmCancelOpen = ref(false)
const cancellingOffer = ref<UsuarioOfertasResponse[number] | null>(null)
const deleting = ref(false)

async function fetchMyOffers() {
  loading.value = true
  try {
    const res = await api<UsuarioOfertasResponse>('/api/ofertas/usuario')
    offers.value = res ?? []
  } catch {
    toast.add({ title: 'Error', description: 'No se pudieron cargar tus ofertas', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    loading.value = false
  }
}

function abrirEditar(item: UsuarioOfertasResponse[number]) {
  if (item.estado !== 'Activa') {
    toast.add({ title: 'Acción no permitida', description: 'Solo puedes editar ofertas en estado Activa.', color: 'warning', icon: 'i-lucide-alert-triangle' })
    return
  }
  editingOffer.value = item
  editForm.montoTotal = item.montoTotal
  editForm.montoMinimo = item.montoMinimo
  editForm.montoMaximo = item.montoMaximo
  editForm.tipoCambio = item.tipoCambio
  editModalOpen.value = true
}

async function guardarEdicion() {
  if (!editingOffer.value) return
  saving.value = true
  try {
    const body: OfertaUpdateRequest = {
      monto_total: editForm.montoTotal,
      monto_minimo: editForm.montoMinimo,
      monto_maximo: editForm.montoMaximo,
      tipo_cambio: editForm.tipoCambio,
    }
    await api(`/api/ofertas/${editingOffer.value.ofertaId}`, {
      method: 'PUT',
      body,
    })
    toast.add({ title: 'Oferta actualizada', description: 'Los cambios se guardaron correctamente.', color: 'success', icon: 'i-lucide-circle-check' })
    editModalOpen.value = false
    editingOffer.value = null
    await fetchMyOffers()
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo actualizar la oferta.', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    saving.value = false
  }
}

function confirmarCancelar(item: UsuarioOfertasResponse[number]) {
  if (item.estado !== 'Activa') {
    toast.add({ title: 'Acción no permitida', description: 'Solo puedes cancelar ofertas en estado Activa.', color: 'warning', icon: 'i-lucide-alert-triangle' })
    return
  }
  cancellingOffer.value = item
  confirmCancelOpen.value = true
}

async function ejecutarCancelacion() {
  if (!cancellingOffer.value) return
  deleting.value = true
  try {
    await api(`/api/ofertas/${cancellingOffer.value.ofertaId}`, {
      method: 'DELETE',
    })
    toast.add({ title: 'Oferta cancelada', description: 'La oferta se canceló correctamente.', color: 'success', icon: 'i-lucide-circle-check' })
    confirmCancelOpen.value = false
    cancellingOffer.value = null
    await fetchMyOffers()
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo cancelar la oferta.', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    deleting.value = false
  }
}

onMounted(fetchMyOffers)
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <main class="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div class="flex items-center justify-end mb-4">
        <UButton label="Nueva Oferta" color="primary" icon="i-lucide-plus" @click="navigateTo('/offers/new')" class="font-semibold cursor-pointer" />
      </div>
      <div v-if="loading" class="grid gap-4">
        <div v-for="i in 3" :key="i" class="animate-pulse bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-3">
          <div class="flex justify-between">
            <div class="h-5 w-24 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div class="h-5 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
          <div class="h-4 w-full bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div class="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div class="flex justify-end gap-2">
            <div class="h-8 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div class="h-8 w-24 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
        </div>
      </div>

      <div v-else-if="offers.length === 0" class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-16 text-center">
        <UIcon name="i-lucide-inbox" class="size-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
        <p class="text-neutral-500 font-medium">Aún no tienes ofertas</p>
        <p class="text-sm text-neutral-400 mt-1">Crea una oferta desde el marketplace.</p>
      </div>

      <div v-else class="grid gap-4">
        <div
          v-for="item in offers"
          :key="item.ofertaId"
          :class="[
            'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 transition-all',
            item.estado === 'Activa' ? 'cursor-pointer hover:border-primary-500/50 hover:shadow-sm' : 'opacity-85'
          ]"
          @click="item.estado === 'Activa' ? abrirEditar(item) : null"
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
              <UIcon name="i-lucide-building" class="size-4 text-neutral-400" />
              <span>{{ item.metodoPago?.banco ?? 'Sin banco asignado' }}</span>
            </div>
            <UBadge :color="item.estado === 'Activa' ? 'primary' : 'warning'" variant="subtle" size="sm">
              {{ item.estado }}
            </UBadge>
          </div>
        </div>
      </div>
    </main>

    <!-- Edit Modal -->
    <UModal v-model:open="editModalOpen" title="Editar Oferta" description="Modifica los campos que deseas actualizar o elimina la oferta.">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Monto Total" required>
            <UInput v-model.number="editForm.montoTotal" type="number" step="0.01" placeholder="Monto total" class="w-full" :min="0" />
          </UFormField>
          <UFormField label="Monto Mínimo" required>
            <UInput v-model.number="editForm.montoMinimo" type="number" step="0.01" placeholder="Monto mínimo" class="w-full" :min="0" />
          </UFormField>
          <UFormField label="Monto Máximo" required>
            <UInput v-model.number="editForm.montoMaximo" type="number" step="0.01" placeholder="Monto máximo" class="w-full" :min="0" />
          </UFormField>
          <UFormField label="Tipo de Cambio" required>
            <UInput v-model.number="editForm.tipoCambio" type="number" step="0.0001" placeholder="Tipo de cambio" class="w-full" :min="0" />
          </UFormField>
        </div>
      </template>
      <template #footer="{ close }">
        <div class="flex items-center justify-between w-full">
          <UButton label="Eliminar Oferta" color="error" variant="outline" icon="i-lucide-trash-2" @click="() => { close(); if (editingOffer) confirmarCancelar(editingOffer); }" />
          <div class="flex gap-2">
            <UButton label="Cancelar" color="neutral" variant="outline" @click="close" />
            <UButton label="Guardar cambios" color="primary" :loading="saving" @click="guardarEdicion" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Cancel Confirmation Modal -->
    <UModal v-model:open="confirmCancelOpen" title="Cancelar Oferta" description="¿Estás seguro de cancelar esta oferta? Esta acción no se puede deshacer.">
      <template #body>
        <div v-if="cancellingOffer" class="space-y-3 p-2">
          <div class="flex items-center gap-3 p-4 bg-error/5 border border-error/20 rounded-xl">
            <UIcon name="i-lucide-alert-triangle" class="size-8 text-error shrink-0" />
            <div class="text-sm">
              <p class="font-medium">Estás por cancelar:</p>
              <p class="text-neutral-500 mt-1">
                {{ cancellingOffer.tipoOperacion }} — {{ cancellingOffer.moneda }} — TC {{ Number(cancellingOffer.tipoCambio).toFixed(2) }}
              </p>
            </div>
          </div>
        </div>
      </template>
      <template #footer="{ close }">
        <UButton label="No, mantener" color="neutral" variant="outline" @click="close" />
        <UButton label="Sí, cancelar oferta" color="error" icon="i-lucide-x-circle" :loading="deleting" @click="ejecutarCancelacion" />
      </template>
    </UModal>
  </div>
</template>
