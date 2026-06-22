<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { MetodoPagoResponse, OfertaResponse } from '~/types'

definePageMeta({
  middleware: ['auth'],
  title: "Nueva Oferta",
  back: "/my-offers"
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

const tiposOperacion = ['Compra', 'Venta'] as const
const tipoOperacion = ref<'Compra' | 'Venta'>('Compra')

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
  tipoOperacion: 'Compra',
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
  metodosPago.value.length > 0
    ? metodosPago.value.map(m => ({
        label: `${m.banco} (**** ${m.numeroCuenta.slice(-4)})`,
        suffix: m.tipoMoneda,
        value: m.metodoPagoId
      }))
    : [{ label: 'No tienes cuentas vinculadas', value: null, disabled: true }]
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  submitting.value = true
  try {
    const { tipoOperacion: op, ...rest } = event.data
    await api<OfertaResponse>('/api/ofertas', {
      method: 'POST',
      body: { ...rest, tipoOperacion: op }
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
    <main class="max-w-3xl mx-auto px-6 py-10">
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
        <div class="p-8">
          <UForm :schema="schema" :state="state" class="space-y-8" @submit="onSubmit">
            <section class="space-y-5">
              <div class="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider">
                <UIcon name="i-lucide-shopping-cart" class="size-3.5" />
                Tipo de Operación
              </div>

              <div class="grid gap-4 p-4 bg-neutral-50/50 dark:bg-neutral-800/20 rounded-xl border border-neutral-100/50 dark:border-neutral-800/50">
                <UFormField name="tipoOperacion" label="¿Qué deseas hacer?" required>
                  <div class="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      :class="[
                        'relative flex items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200',
                        tipoOperacion === 'Compra'
                          ? 'border-primary bg-primary/5 text-primary shadow-sm'
                          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
                      ]"
                      @click="tipoOperacion = 'Compra'; state.tipoOperacion = 'Compra'"
                    >
                      <div :class="['size-10 rounded-lg flex items-center justify-center transition-colors', tipoOperacion === 'Compra' ? 'bg-primary/10' : 'bg-neutral-100 dark:bg-neutral-700']">
                        <UIcon name="i-lucide-arrow-down-to-line" class="size-5" />
                      </div>
                      <div class="text-left">
                        <p class="text-sm font-bold">Comprar</p>
                        <p class="text-xs text-muted">Vas a adquirir divisas</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      :class="[
                        'relative flex items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200',
                        tipoOperacion === 'Venta'
                          ? 'border-primary bg-primary/5 text-primary shadow-sm'
                          : 'border-neutral-200/60 dark:border-neutral-700/50 bg-neutral-50/80 dark:bg-neutral-800/20 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40'
                      ]"
                      @click="tipoOperacion = 'Venta'; state.tipoOperacion = 'Venta'"
                    >
                      <div :class="['size-10 rounded-lg flex items-center justify-center transition-colors', tipoOperacion === 'Venta' ? 'bg-primary/10' : 'bg-neutral-200/70 dark:bg-neutral-700/50']">
                        <UIcon name="i-lucide-arrow-up-from-line" class="size-5" />
                      </div>
                      <div class="text-left">
                        <p class="text-sm font-bold">Vender</p>
                        <p class="text-xs text-muted">Ofreces tus divisas</p>
                      </div>
                    </button>
                  </div>
                </UFormField>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <UFormField name="moneda" label="Moneda" required>
                    <USelect v-model="state.moneda" :items="monedas" placeholder="Selecciona" class="w-full" />
                  </UFormField>

                  <UFormField name="metodoPagoId" label="Método de Pago" required>
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
              </div>
            </section>

            <section class="space-y-5">
              <div class="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider">
                <UIcon name="i-lucide-coins" class="size-3.5" />
                Montos y Cotización
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-neutral-50/50 dark:bg-neutral-800/20 rounded-xl border border-neutral-100/50 dark:border-neutral-800/50">
                <UFormField name="montoTotal" label="Monto Total" required description="Inventario disponible">
                  <UInput v-model="state.montoTotal" type="number" step="0.01" placeholder="Ej: 1000" class="w-full">
                    <template #leading>
                      <span class="text-muted text-xs font-medium">S/</span>
                    </template>
                  </UInput>
                </UFormField>

                <UFormField name="montoMinimo" label="Monto Mínimo" required description="Por transacción">
                  <UInput v-model="state.montoMinimo" type="number" step="0.01" placeholder="Ej: 50" class="w-full">
                    <template #leading>
                      <span class="text-muted text-xs font-medium">S/</span>
                    </template>
                  </UInput>
                </UFormField>

                <UFormField name="montoMaximo" label="Monto Máximo" required description="Por transacción">
                  <UInput v-model="state.montoMaximo" type="number" step="0.01" placeholder="Ej: 500" class="w-full">
                    <template #leading>
                      <span class="text-muted text-xs font-medium">S/</span>
                    </template>
                  </UInput>
                </UFormField>
              </div>

              <div class="p-4 bg-neutral-50/50 dark:bg-neutral-800/20 rounded-xl border border-neutral-100/50 dark:border-neutral-800/50">
                <UFormField name="tipoCambio" label="Tipo de Cambio" required description="Precio por unidad de la moneda seleccionada">
                  <div class="relative max-w-xs">
                    <UInput v-model="state.tipoCambio" type="number" step="0.01" placeholder="Ej: 3.75" class="w-full">
                      <template #leading>
                        <span class="text-muted text-xs font-medium">S/</span>
                      </template>
                    </UInput>
                  </div>
                </UFormField>
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
