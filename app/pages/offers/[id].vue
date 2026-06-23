<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type {
  OfertaDetalleResponse,
  TransaccionCreateResponse,
  ErrorResponse,
  MetodoPagoResponse,
  TransaccionCreateRequest
} from '~/types'

const route = useRoute()
const toast = useToast()
const api = useApi()
const authStore = useAuthStore()

const offerId = Number(route.params.id)
const loading = ref(true)
const offer = ref<OfertaDetalleResponse | null>(null)
const errorMsg = ref<string | null>(null)
const transactionLoading = ref(false)
const confirmModalOpen = ref(false)

const metodosPago = ref<MetodoPagoResponse[]>([])

const state = reactive({
  metodoPagoId: undefined as number | undefined
})

async function fetchOffer() {
  loading.value = true
  errorMsg.value = null
  try {
    offer.value = await api<OfertaDetalleResponse>(`/api/ofertas/${offerId}`)
  } catch (err: any) {
    if (err.status === 404) {
      errorMsg.value = 'La oferta especificada no existe, está inactiva o ya fue completada.'
    } else {
      errorMsg.value = 'No se pudo cargar la información de la oferta.'
    }
  } finally {
    loading.value = false
  }
}

async function fetchAccounts() {
  if (!authStore.isAuthenticated) return
  try {
    const response = await api<MetodoPagoResponse[]>('/api/users/metodos-pago')
    metodosPago.value = response
    const targetCurrency = offer.value?.monedaRecibo
    const matching = response.find(m => m.tipoMoneda === targetCurrency)
    state.metodoPagoId = matching?.metodoPagoId
  } catch {
    // ignore
  }
}

onMounted(async () => {
  await fetchOffer()
  await fetchAccounts()
})

const targetCurrency = computed(() => offer.value?.monedaRecibo ?? '')

const metodosPagoOptions = computed(() => {
  return metodosPago.value
    .filter(m => m.tipoMoneda === targetCurrency.value)
    .map(m => ({ label: `${m.banco} - ${m.numeroCuenta} (${m.tipoMoneda})`, value: m.metodoPagoId }))
})

const hasMatchingAccounts = computed(() => metodosPagoOptions.value.length > 0)

const schema = z.object({
  metodoPagoId: z.number({ message: 'Selecciona una cuenta bancaria' })
})

const isOwnOffer = computed(() => authStore.isAuthenticated && offer.value?.usuarioCreador?.usuarioId === authStore.usuario?.usuarioId)

async function onSubmit(_event: FormSubmitEvent<any>) {
  if (!authStore.isAuthenticated) {
    toast.add({ title: 'Inicia sesión', description: 'Debes iniciar sesión para operar.', color: 'warning' })
    return navigateTo('/login')
  }

  if (isOwnOffer.value) {
    toast.add({ title: 'Operación inválida', description: 'No puedes tomar tu propia oferta.', color: 'error' })
    return
  }

  if (!hasMatchingAccounts.value) {
    toast.add({
      title: 'Cuenta no disponible',
      description: `No tienes cuentas registradas en ${targetCurrency.value}. Agrega una en tu perfil.`,
      color: 'warning'
    })
    return
  }

  if (!state.metodoPagoId) {
    toast.add({ title: 'Cuenta requerida', description: 'Selecciona tu cuenta para recibir fondos.', color: 'warning' })
    return
  }

  confirmModalOpen.value = true
}

async function executeTransaction() {
  if (!state.metodoPagoId) return
  transactionLoading.value = true
  try {
    const payload: TransaccionCreateRequest = {
      ofertaId: offerId,
      metodoPagoParticipanteId: state.metodoPagoId
    }

    const res = await api<TransaccionCreateResponse>('/api/transacciones', {
      method: 'POST',
      body: payload
    })

    toast.add({
      title: 'Transacción iniciada',
      description: res.mensaje || 'Se inició correctamente.',
      color: 'success',
      icon: 'i-lucide-circle-check'
    })

    confirmModalOpen.value = false
    navigateTo(`/transaction/${res.transaccion.transaccionId}?accountId=${state.metodoPagoId}`)
  } catch (error: any) {
    const errorData = error.data as ErrorResponse | undefined
    toast.add({
      title: 'Error al procesar',
      description: errorData?.mensaje || 'No se pudo crear la transacción.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    transactionLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950 p-6">
    <div v-if="loading" class="max-w-3xl mx-auto">
      <USkeleton class="h-56 rounded-xl" />
    </div>

    <div v-else-if="errorMsg" class="max-w-3xl mx-auto bg-white dark:bg-neutral-900 border border-default rounded-xl p-6 text-center">
      <p class="text-red-500 font-semibold mb-2">Oferta no disponible</p>
      <p class="text-sm text-neutral-500">{{ errorMsg }}</p>
    </div>

    <div v-else-if="offer" class="max-w-3xl mx-auto space-y-4">
      <div class="flex items-center justify-between text-sm text-neutral-500">
        <div class="inline-flex items-center gap-2">
          <NuxtLink to="/marketplace" class="hover:text-primary transition-colors">Marketplace</NuxtLink>
          <UIcon name="i-lucide-chevron-right" class="size-4" />
          <span class="text-neutral-700 dark:text-neutral-200 font-medium">Oferta #{{ offer.ofertaId }}</span>
        </div>
        <UButton
          label="Volver"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="navigateTo('/marketplace')"
        />
      </div>

      <div class="bg-white dark:bg-neutral-900 border border-default rounded-xl p-6 space-y-3">
        <h1 class="text-xl font-bold">Oferta #{{ offer.ofertaId }}</h1>
        <p class="text-sm text-neutral-500">{{ offer.tipoOperacion }} · {{ offer.monedaTengo }} → {{ offer.monedaRecibo }}</p>

        <div class="grid sm:grid-cols-3 gap-3">
          <div class="border border-default rounded-lg p-3">
            <p class="text-xs text-neutral-500">Tú entregarás</p>
            <p class="font-bold">{{ Number(offer.montoTengo).toLocaleString() }} {{ offer.monedaTengo }}</p>
          </div>
          <div class="border border-default rounded-lg p-3">
            <p class="text-xs text-neutral-500">Tú recibirás</p>
            <p class="font-bold">{{ Number(offer.montoRecibo).toLocaleString() }} {{ offer.monedaRecibo }}</p>
          </div>
          <div class="border border-default rounded-lg p-3">
            <p class="text-xs text-neutral-500">Tipo de cambio</p>
            <p class="font-bold">{{ Number(offer.tipoCambio).toFixed(6) }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-neutral-900 border border-default rounded-xl p-6">
        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField v-if="hasMatchingAccounts" name="metodoPagoId" :label="`Tu cuenta para recibir (${offer.monedaRecibo})`" required>
            <USelect v-model.number="state.metodoPagoId" :items="metodosPagoOptions" placeholder="Selecciona una cuenta" class="w-full" />
          </UFormField>

          <UAlert
            v-else
            color="warning"
            variant="soft"
            icon="i-lucide-alert-triangle"
            :title="`No tienes cuentas en ${offer.monedaRecibo}`"
            :description="`Para tomar esta oferta necesitas registrar una cuenta bancaria en ${offer.monedaRecibo}.`"
          />

          <div class="flex items-center gap-2">
            <UButton
              v-if="hasMatchingAccounts"
              type="submit"
              label="Iniciar transacción"
              color="primary"
              :loading="transactionLoading"
              :disabled="isOwnOffer"
            />
            <UButton
              v-if="!hasMatchingAccounts"
              label="Agregar cuenta"
              color="warning"
              variant="outline"
              icon="i-lucide-wallet"
              @click="navigateTo('/profile')"
            />
          </div>
        </UForm>
      </div>
    </div>

    <UModal v-model:open="confirmModalOpen" title="Confirmar transacción">
      <template #body>
        <div v-if="offer" class="space-y-2 text-sm">
          <p>Vas a operar esta oferta con montos fijos:</p>
          <p><strong>Entregas:</strong> {{ Number(offer.montoTengo).toLocaleString() }} {{ offer.monedaTengo }}</p>
          <p><strong>Recibes:</strong> {{ Number(offer.montoRecibo).toLocaleString() }} {{ offer.monedaRecibo }}</p>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-2 justify-end w-full">
          <UButton label="Cancelar" color="neutral" variant="outline" @click="confirmModalOpen = false" />
          <UButton label="Confirmar" color="primary" :loading="transactionLoading" @click="executeTransaction" />
        </div>
      </template>
    </UModal>
  </div>
</template>
