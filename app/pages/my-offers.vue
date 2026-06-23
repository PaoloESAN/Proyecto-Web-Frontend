<script setup lang="ts">
import type { UsuarioOfertasResponse, OfertaUpdateRequest } from '~/types'

definePageMeta({
  middleware: ['auth'],
  title: 'Mis Ofertas'
})

const api = useApi()
const toast = useToast()

const offers = ref<UsuarioOfertasResponse>([])
const loading = ref(false)

const editModalOpen = ref(false)
const editingOffer = ref<UsuarioOfertasResponse[number] | null>(null)
const editCantidad = ref<number>(0)
const saving = ref(false)

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
    toast.add({ title: 'Acción no permitida', description: 'Solo puedes editar ofertas activas.', color: 'warning' })
    return
  }
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
    await fetchMyOffers()
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
    await fetchMyOffers()
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo cancelar la oferta.', color: 'error' })
  } finally {
    deleting.value = false
  }
}

onMounted(fetchMyOffers)
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <main class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div class="flex items-center justify-end mb-4">
        <UButton label="Nueva Oferta" color="primary" icon="i-lucide-plus" @click="navigateTo('/offers/new')" class="font-semibold cursor-pointer" />
      </div>

      <div v-if="loading" class="grid gap-4">
        <USkeleton v-for="i in 3" :key="i" class="h-28 rounded-xl" />
      </div>

      <div v-else-if="offers.length === 0" class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-16 text-center">
        <p class="text-neutral-500 font-medium">Aún no tienes ofertas</p>
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

          <div class="flex justify-end gap-2">
            <UButton label="Editar" color="neutral" variant="outline" :disabled="item.estado !== 'Activa'" @click="abrirEditar(item)" />
            <UButton label="Cancelar" color="error" variant="outline" :disabled="item.estado !== 'Activa'" @click="confirmarCancelar(item)" />
          </div>
        </div>
      </div>
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
