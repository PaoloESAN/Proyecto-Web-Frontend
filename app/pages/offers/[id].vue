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
  } catch (err) {
    const error = err as { status?: number }
    if (error.status === 404) {
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

type Schema = z.output<typeof schema>

const isOwnOffer = computed(() => authStore.isAuthenticated && offer.value?.usuarioCreador?.usuarioId === authStore.usuario?.usuarioId)

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  if (!authStore.isAuthenticated) {
    toast.add({ title: 'Inicia sesión', description: 'Debes iniciar sesión para operar.', color: 'warning' })
    await navigateTo('/login')
    return
  }

  if (!authStore.usuario?.esVerificado) {
    toast.add({
      title: 'Verificación requerida',
      description: 'Debes verificar tu identidad en tu perfil antes de iniciar una transacción.',
      color: 'warning',
      icon: 'i-lucide-shield-alert'
    })
    return
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
  } catch (error) {
    const err = error as { data?: ErrorResponse }
    const errorData = err.data
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
  <div class="min-h-dvh bg-linear-to-b from-neutral-50 to-neutral-100/70 dark:from-neutral-950 dark:to-neutral-950">
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div v-if="loading" class="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <USkeleton class="h-72 rounded-2xl" />
        <USkeleton class="h-72 rounded-2xl" />
      </div>

      <div
        v-else-if="errorMsg"
        class="max-w-3xl mx-auto bg-white dark:bg-neutral-900 border border-default rounded-2xl p-8 text-center"
      >
        <p class="text-red-500 font-semibold mb-2">Oferta no disponible</p>
        <p class="text-sm text-neutral-500">{{ errorMsg }}</p>
      </div>

      <template v-else-if="offer">
        <div class="flex items-center justify-between text-sm text-neutral-500">
          <div class="inline-flex items-center gap-2">
            <NuxtLink to="/marketplace" class="hover:text-primary transition-colors">Marketplace</NuxtLink>
            <UIcon name="i-lucide-chevron-right" class="size-4" />
            <span class="text-neutral-700 dark:text-neutral-200 font-semibold">Oferta #{{ offer.ofertaId }}</span>
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

        <div class="grid lg:grid-cols-[1.35fr_1fr] gap-6 items-start">
          <section class="bg-white dark:bg-neutral-900 border border-default rounded-2xl p-6 sm:p-7 space-y-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h1 class="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Oferta #{{ offer.ofertaId }}</h1>
                <p class="text-sm mt-1 text-neutral-500">
                  {{ offer.tipoOperacion }} · {{ offer.monedaTengo }} → {{ offer.monedaRecibo }}
                </p>
              </div>

              <UBadge
                :color="offer.estado === 'Activa' ? 'success' : 'warning'"
                variant="soft"
                class="font-semibold"
              >
                {{ offer.estado }}
              </UBadge>
            </div>

            <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <div class="rounded-xl border border-default bg-muted/20 p-4">
                <p class="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Tú entregarás</p>
                <p class="mt-1.5 text-2xl font-black text-rose-500 leading-none">
                  {{ Number(offer.montoTengo).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                </p>
                <p class="mt-1 text-sm font-bold text-neutral-700 dark:text-neutral-200">{{ offer.monedaTengo }}</p>
              </div>

              <div class="rounded-xl border border-default bg-muted/20 p-4">
                <p class="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Tú recibirás</p>
                <p class="mt-1.5 text-2xl font-black text-emerald-500 leading-none">
                  {{ Number(offer.montoRecibo).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                </p>
                <p class="mt-1 text-sm font-bold text-neutral-700 dark:text-neutral-200">{{ offer.monedaRecibo }}</p>
              </div>

              <div class="rounded-xl border border-default bg-muted/20 p-4 sm:col-span-2 xl:col-span-1">
                <p class="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Tipo de cambio</p>
                <p class="mt-1.5 text-2xl font-black text-neutral-900 dark:text-white leading-none">
                  {{ Number(offer.tipoCambio).toFixed(6) }}
                </p>
                <p class="mt-1 text-xs text-neutral-500">Actualizado al momento de publicar</p>
              </div>
            </div>

            <div class="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p class="text-sm font-semibold text-primary">Resumen rápido</p>
              <p class="text-sm text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
                Intercambiarás
                <strong>{{ Number(offer.montoTengo).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} {{ offer.monedaTengo }}</strong>
                por
                <strong>{{ Number(offer.montoRecibo).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} {{ offer.monedaRecibo }}</strong>.
              </p>
            </div>
          </section>

          <section class="bg-white dark:bg-neutral-900 border border-default rounded-2xl p-6 sm:p-7 space-y-4">
            <div>
              <h2 class="text-lg font-bold text-neutral-900 dark:text-white">Tomar oferta</h2>
              <p class="text-sm text-neutral-500 mt-1">Selecciona la cuenta donde deseas recibir {{ offer.monedaRecibo }}.</p>
            </div>

            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
              <UFormField
                v-if="hasMatchingAccounts"
                name="metodoPagoId"
                :label="`Tu cuenta para recibir (${offer.monedaRecibo})`"
                required
              >
                <USelect
                  v-model.number="state.metodoPagoId"
                  :items="metodosPagoOptions"
                  placeholder="Selecciona una cuenta"
                  class="w-full"
                />
              </UFormField>

              <UAlert
                v-else
                color="warning"
                variant="soft"
                icon="i-lucide-alert-triangle"
                :title="`No tienes cuentas en ${offer.monedaRecibo}`"
                :description="`Para tomar esta oferta necesitas registrar una cuenta bancaria en ${offer.monedaRecibo}.`"
              />

              <div class="flex items-center gap-2 pt-1">
                <UButton
                  v-if="hasMatchingAccounts"
                  type="submit"
                  label="Iniciar transacción"
                  color="primary"
                  size="lg"
                  block
                  :loading="transactionLoading"
                  :disabled="isOwnOffer"
                />
                <UButton
                  v-if="!hasMatchingAccounts"
                  label="Agregar cuenta"
                  color="warning"
                  variant="outline"
                  icon="i-lucide-wallet"
                  block
                  @click="navigateTo('/profile')"
                />
              </div>
            </UForm>
          </section>
        </div>
      </template>

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
    </main>
  </div>
</template>
