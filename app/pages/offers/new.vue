<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { MetodoPagoResponse, OfertaResponse } from '~/types'

definePageMeta({
  middleware: ['auth']
})

const toast = useToast()
const api = useApi()

const metodosPago = ref<MetodoPagoResponse[]>([])
const loadingAccounts = ref(true)
const submitting = ref(false)

const monedas = [
  { label: 'USD - Dólar Estadounidense', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - Libra Esterlina', value: 'GBP' },
  { label: 'MXN - Peso Mexicano', value: 'MXN' },
  { label: 'PEN - Sol Peruano', value: 'PEN' },
]

const tiposOperacion = ['Compra', 'Venta']

const schema = z.object({
  metodoPagoId: z.number({ message: 'Selecciona un método de pago' }).positive(),
  tipoOperacion: z.enum(['Compra', 'Venta'], { message: 'Selecciona una operación' }),
  moneda: z.string().min(1, 'Selecciona una moneda'),
  montoTotal: z.number({ message: 'Debe ser un número' }).positive('Debe ser mayor a 0'),
  montoMinimo: z.number({ message: 'Debe ser un número' }).positive('Debe ser mayor a 0'),
  montoMaximo: z.number({ message: 'Debe ser un número' }).positive('Debe ser mayor a 0'),
  tipoCambio: z.number({ message: 'Debe ser un número' }).positive('Debe ser mayor a 0'),
})

type Schema = z.output<typeof schema>
const state = reactive<Partial<Schema>>({
  metodoPagoId: undefined,
  tipoOperacion: undefined,
  moneda: '',
  montoTotal: undefined,
  montoMinimo: undefined,
  montoMaximo: undefined,
  tipoCambio: undefined,
})

async function fetchMetodosPago() {
  loadingAccounts.value = true
  try {
    metodosPago.value = await api<MetodoPagoResponse[]>('/api/users/metodos-pago')
  } catch {
    toast.add({ title: 'Error', description: 'No se pudieron cargar tus cuentas', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    loadingAccounts.value = false
  }
}

const metodosPagoItems = computed(() =>
  metodosPago.value.map(m => ({
    label: `${m.banco} (**** ${m.numeroCuenta.slice(-4)}) - ${m.tipoMoneda}`,
    value: m.metodoPagoId
  }))
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  submitting.value = true
  try {
    await api<OfertaResponse>('/api/ofertas', {
      method: 'POST',
      body: event.data
    })
    toast.add({ title: 'Oferta creada', description: 'Tu oferta fue publicada exitosamente', color: 'success', icon: 'i-lucide-circle-check' })
    await navigateTo('/offers')
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo crear la oferta', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    submitting.value = false
  }
}

onMounted(fetchMetodosPago)
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <header class="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      <div class="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
        <h1 class="text-xl font-bold">Nueva Oferta</h1>
        <UButton label="Volver" color="neutral" variant="ghost" icon="i-lucide-arrow-left" @click="navigateTo('/offers')" />
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-6 py-8">
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
        <UForm :schema="schema" :state="state" class="space-y-5" @submit="onSubmit">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <UFormField name="tipoOperacion" label="Tipo de Operación" required>
              <USelect v-model="state.tipoOperacion" :items="tiposOperacion" placeholder="Selecciona" class="w-full" />
            </UFormField>

            <UFormField name="moneda" label="Moneda" required>
              <USelect v-model="state.moneda" :items="monedas" placeholder="Selecciona" class="w-full" />
            </UFormField>

            <UFormField name="metodoPagoId" label="Método de Pago" required>
              <USelect v-if="!loadingAccounts" v-model="state.metodoPagoId" :items="metodosPagoItems" placeholder="Selecciona una cuenta" class="w-full" />
              <USelect v-else disabled placeholder="Cargando cuentas..." class="w-full" />
            </UFormField>
          </div>

          <UDivider label="Montos y Tipo de Cambio" class="py-2" />

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <UFormField name="montoTotal" label="Monto Total" required>
              <UInput v-model="state.montoTotal" type="number" step="0.01" placeholder="Ej: 1000" class="w-full" />
            </UFormField>

            <UFormField name="montoMinimo" label="Monto Mínimo" required>
              <UInput v-model="state.montoMinimo" type="number" step="0.01" placeholder="Ej: 50" class="w-full" />
            </UFormField>

            <UFormField name="montoMaximo" label="Monto Máximo" required>
              <UInput v-model="state.montoMaximo" type="number" step="0.01" placeholder="Ej: 500" class="w-full" />
            </UFormField>
          </div>

          <UFormField name="tipoCambio" label="Tipo de Cambio" required>
            <UInput v-model="state.tipoCambio" type="number" step="0.01" placeholder="Ej: 3.75" class="w-full max-w-xs" />
          </UFormField>

          <div class="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <UButton label="Cancelar" color="neutral" variant="outline" @click="navigateTo('/offers')" />
            <UButton type="submit" label="Publicar oferta" color="primary" :loading="submitting" />
          </div>
        </UForm>
      </div>
    </main>
  </div>
</template>
