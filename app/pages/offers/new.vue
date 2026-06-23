<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { MetodoPagoResponse, OfertaCreateRequest, OfertaResponse, ExchangeConvertResponse } from '~/types'

definePageMeta({
  middleware: ['auth'],
  title: 'Nueva Oferta',
  back: '/my-offers'
})

const toast = useToast()
const api = useApi()

const metodosPago = ref<MetodoPagoResponse[]>([])
const loadingAccounts = ref(true)
const submitting = ref(false)
const loadingQuote = ref(false)

const monedas = [
  { label: 'USD - Dólar Estadounidense', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - Libra Esterlina', value: 'GBP' },
  { label: 'MXN - Peso Mexicano', value: 'MXN' },
  { label: 'PEN - Sol Peruano', value: 'PEN' }
]

const tipoOperacion = ref<'Compra' | 'Venta'>('Compra')

const schema = z.object({
  metodoPagoId: z.number({ message: 'Selecciona un método de pago' }).positive(),
  tipoOperacion: z.enum(['Compra', 'Venta'], { message: 'Selecciona una operación' }),
  monedaTengo: z.string().min(1, 'Selecciona la moneda que tienes'),
  monedaRecibo: z.string().min(1, 'Selecciona la moneda que quieres recibir'),
  cantidad: z.number({ message: 'Debe ser un número' }).positive('Debe ser mayor a 0')
}).refine(v => v.monedaTengo !== v.monedaRecibo, {
  message: 'Las monedas deben ser diferentes',
  path: ['monedaRecibo']
})

type Schema = z.output<typeof schema>
const state = reactive<Partial<Schema>>({
  metodoPagoId: undefined,
  tipoOperacion: 'Compra',
  monedaTengo: '',
  monedaRecibo: '',
  cantidad: undefined
})

const quote = ref<{ rate: number; entregas: number; recibes: number } | null>(null)

const metodosPagoItems = computed(() => {
  const monedaTengo = state.monedaTengo
  const cuentasFiltradas = metodosPago.value.filter(m => !monedaTengo || m.tipoMoneda === monedaTengo)

  if (cuentasFiltradas.length === 0) {
    return [{ label: 'No tienes cuentas en esta moneda', value: null, disabled: true }]
  }

  return cuentasFiltradas.map(m => ({
    label: `${m.banco} (**** ${m.numeroCuenta.slice(-4)})`,
    suffix: m.tipoMoneda,
    value: m.metodoPagoId
  }))
})

const cantidadLabel = computed(() =>
  state.tipoOperacion === 'Compra'
    ? `Cantidad que quieres recibir (${state.monedaRecibo || '---'})`
    : `Cantidad que tienes para vender (${state.monedaTengo || '---'})`
)

const previewEntrega = computed(() => quote.value?.entregas ?? 0)
const previewRecibe = computed(() => quote.value?.recibes ?? 0)

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

async function refreshQuote() {
  if (!state.monedaTengo || !state.monedaRecibo || !state.cantidad || state.cantidad <= 0 || state.monedaTengo === state.monedaRecibo) {
    quote.value = null
    return
  }

  loadingQuote.value = true
  try {
    if (state.tipoOperacion === 'Compra') {
      const res = await api<ExchangeConvertResponse>('/api/tipo-cambio/convert', {
        params: {
          from: state.monedaRecibo,
          to: state.monedaTengo,
          amount: state.cantidad
        }
      })
      quote.value = {
        rate: res.rate,
        entregas: Number(res.convertedAmount),
        recibes: Number(state.cantidad)
      }
    } else {
      const res = await api<ExchangeConvertResponse>('/api/tipo-cambio/convert', {
        params: {
          from: state.monedaTengo,
          to: state.monedaRecibo,
          amount: state.cantidad
        }
      })
      quote.value = {
        rate: res.rate,
        entregas: Number(state.cantidad),
        recibes: Number(res.convertedAmount)
      }
    }
  } catch {
    quote.value = null
  } finally {
    loadingQuote.value = false
  }
}

watch(() => state.monedaTengo, () => {
  if (state.metodoPagoId) {
    const exists = metodosPago.value.some(m => m.metodoPagoId === state.metodoPagoId && m.tipoMoneda === state.monedaTengo)
    if (!exists) state.metodoPagoId = undefined
  }
  refreshQuote()
})
watch(() => state.monedaRecibo, refreshQuote)
watch(() => state.cantidad, refreshQuote)
watch(() => state.tipoOperacion, refreshQuote)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  submitting.value = true
  try {
    const payload: OfertaCreateRequest = {
      metodoPagoId: event.data.metodoPagoId,
      tipoOperacion: event.data.tipoOperacion,
      monedaTengo: event.data.monedaTengo,
      monedaRecibo: event.data.monedaRecibo,
      cantidad: event.data.cantidad
    }

    await api<OfertaResponse>('/api/ofertas', {
      method: 'POST',
      body: payload
    })

    toast.add({ title: 'Oferta publicada', description: 'Tu oferta ya está disponible en el mercado', color: 'success', icon: 'i-lucide-circle-check' })
    await navigateTo('/my-offers')
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo crear la oferta. Verifica los datos e inténtalo de nuevo.', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    submitting.value = false
  }
}

onMounted(fetchMetodosPago)
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
        <div class="p-8">
          <UForm :schema="schema" :state="state" class="space-y-8" @submit="onSubmit">
            <section class="space-y-5">
              <div class="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider">
                <UIcon name="i-lucide-repeat" class="size-3.5" />
                Datos de la oferta
              </div>

              <div class="grid gap-4 p-4 bg-neutral-50/50 dark:bg-neutral-800/20 rounded-xl border border-neutral-100/50 dark:border-neutral-800/50">
                <UFormField name="tipoOperacion" label="¿Qué deseas hacer?" required>
                  <div class="grid grid-cols-2 gap-3">
                    <button type="button" :class="['relative flex items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200', tipoOperacion === 'Compra' ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600']" @click="tipoOperacion = 'Compra'; state.tipoOperacion = 'Compra'">
                      <div :class="['size-10 rounded-lg flex items-center justify-center transition-colors', tipoOperacion === 'Compra' ? 'bg-primary/10' : 'bg-neutral-100 dark:bg-neutral-700']">
                        <UIcon name="i-lucide-arrow-down-to-line" class="size-5" />
                      </div>
                      <div class="text-left">
                        <p class="text-sm font-bold">Comprar</p>
                        <p class="text-xs text-muted">Ingresas cuánto quieres recibir</p>
                      </div>
                    </button>
                    <button type="button" :class="['relative flex items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200', tipoOperacion === 'Venta' ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-neutral-200/60 dark:border-neutral-700/50 bg-neutral-50/80 dark:bg-neutral-800/20 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40']" @click="tipoOperacion = 'Venta'; state.tipoOperacion = 'Venta'">
                      <div :class="['size-10 rounded-lg flex items-center justify-center transition-colors', tipoOperacion === 'Venta' ? 'bg-primary/10' : 'bg-neutral-200/70 dark:bg-neutral-700/50']">
                        <UIcon name="i-lucide-arrow-up-from-line" class="size-5" />
                      </div>
                      <div class="text-left">
                        <p class="text-sm font-bold">Vender</p>
                        <p class="text-xs text-muted">Ingresas cuánto quieres entregar</p>
                      </div>
                    </button>
                  </div>
                </UFormField>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <UFormField name="monedaTengo" label="Moneda que tienes" required>
                    <USelect v-model="state.monedaTengo" :items="monedas" placeholder="Selecciona" class="w-full" />
                  </UFormField>

                  <UFormField name="monedaRecibo" label="Moneda que quieres recibir" required>
                    <USelect v-model="state.monedaRecibo" :items="monedas" placeholder="Selecciona" class="w-full" />
                  </UFormField>
                </div>

                <UFormField name="cantidad" :label="cantidadLabel" required>
                  <UInput v-model.number="state.cantidad" type="number" step="0.01" placeholder="Ej: 1000" class="w-full" :min="0" />
                </UFormField>

                <UFormField name="metodoPagoId" label="Tu cuenta bancaria (de la moneda que tienes)" required>
                  <USelect
                    v-if="!loadingAccounts"
                    v-model="state.metodoPagoId"
                    :items="metodosPagoItems"
                    placeholder="Elige una cuenta"
                    class="w-full"
                  />
                  <UInput v-else disabled placeholder="Cargando cuentas..." class="w-full" />
                </UFormField>
              </div>
            </section>

            <section class="space-y-5">
              <div class="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider">
                <UIcon name="i-lucide-calculator" class="size-3.5" />
                Vista previa de conversión
              </div>

              <div class="p-4 bg-neutral-50/50 dark:bg-neutral-800/20 rounded-xl border border-neutral-100/50 dark:border-neutral-800/50 space-y-2">
                <p v-if="loadingQuote" class="text-sm text-neutral-500">Calculando tipo de cambio...</p>
                <template v-else-if="quote">
                  <p class="text-sm text-neutral-500">Tipo de cambio actual: <strong>{{ quote.rate.toFixed(6) }}</strong></p>
                  <p class="text-sm">Tú entregas: <strong>{{ previewEntrega.toLocaleString() }} {{ state.monedaTengo }}</strong></p>
                  <p class="text-sm">Tú recibes: <strong>{{ previewRecibe.toLocaleString() }} {{ state.monedaRecibo }}</strong></p>
                </template>
                <p v-else class="text-sm text-neutral-500">Completa monedas y cantidad para ver el cálculo automático.</p>
              </div>
            </section>

            <div class="flex items-center justify-end gap-3 pt-6 border-t border-neutral-100 dark:border-neutral-800">
              <UButton label="Cancelar" color="neutral" variant="outline" size="lg" @click="navigateTo('/my-offers')" class="cursor-pointer" />
              <UButton type="submit" label="Publicar oferta" color="primary" size="lg" :loading="submitting" icon="i-lucide-rocket" trailing />
            </div>
          </UForm>
        </div>
      </div>
    </main>
  </div>
</template>
