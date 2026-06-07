<script setup lang="ts">
import { ref, computed } from 'vue'

// Color Mode logic using Nuxt UI's integration
const colorMode = useColorMode()
const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
})

// Currency Mockup Data
interface Currency {
  code: string
  name: string
  symbol: string
  icon: string
}

const currencies: Currency[] = [
  { code: 'USD', name: 'Dólar (USD)', symbol: '$', icon: 'i-lucide-dollar-sign' },
  { code: 'EUR', name: 'Euro (EUR)', symbol: '€', icon: 'i-lucide-euro' },
  { code: 'GBP', name: 'Libra (GBP)', symbol: '£', icon: 'i-lucide-pound-sterling' },
  { code: 'MXN', name: 'Peso Mex (MXN)', symbol: '$', icon: 'i-lucide-coins' },
]

const fromCurrency = ref<Currency>(currencies[0]!) // USD
const toCurrency = ref<Currency>(currencies[1]!)   // EUR
const fromAmount = ref<number>(1000)

// Exchange rates (mockup relative to USD)
const exchangeRates: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.78,
  MXN: 17.50,
}

// Compute receiving amount dynamically
const toAmount = computed(() => {
  const fromRate = exchangeRates[fromCurrency.value.code] ?? 1.0
  const toRate = exchangeRates[toCurrency.value.code] ?? 1.0
  const amountInUSD = fromAmount.value / fromRate
  const targetAmount = amountInUSD * toRate
  return isNaN(targetAmount) ? '0.00' : targetAmount.toFixed(2)
})

// Active exchange rate message
const rateMessage = computed(() => {
  const fromRate = exchangeRates[fromCurrency.value.code] ?? 1.0
  const toRate = exchangeRates[toCurrency.value.code] ?? 1.0
  const rate = toRate / fromRate
  return `1 ${fromCurrency.value.code} = ${rate.toFixed(4)} ${toCurrency.value.code}`
})

// Swap from and to currencies
function swapCurrencies() {
  const temp = fromCurrency.value
  fromCurrency.value = toCurrency.value
  toCurrency.value = temp
}
</script>

<template>
  <div class="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300 font-sans selection:bg-primary-500 selection:text-white">
    <!-- Glowing background elements -->
    <div class="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.12),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.18),rgba(0,0,0,0))]"></div>
    <div class="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

    <!-- Header / Navbar -->
    <header class="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-neutral-200/50 dark:border-neutral-800/30">
      <div class="flex items-center gap-2.5">
        <div class="flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
          <UIcon name="i-lucide-arrow-left-right" class="w-5 h-5" />
        </div>
        <span class="text-xl font-bold tracking-tight bg-linear-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">
          Nexus
        </span>
      </div>

      <div class="flex items-center gap-4">
        <!-- Theme Toggle -->
        <UButton
          :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
          color="neutral"
          variant="ghost"
          size="md"
          class="rounded-lg"
          @click="isDark = !isDark"
        />

        <UButton
          label="Crear Cuenta"
          color="primary"
          variant="solid"
          size="md"
          class="rounded-lg shadow-md shadow-blue-600/10 font-medium"
        />
      </div>
    </header>

    <!-- Centered Notice below Navbar -->
    <div class="w-full flex justify-center pt-6 -mb-4 px-6 z-10">
      <div class="px-5 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-extrabold text-xs md:text-sm tracking-widest uppercase shadow-xs">
        Página provisional
      </div>
    </div>

    <!-- Main Hero and Exchange Section -->
    <main class="flex-1 flex items-center justify-center px-6 py-12 md:py-20 max-w-7xl mx-auto w-full">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">
        
        <!-- Left Side: Hero text -->
        <div class="lg:col-span-7 flex flex-col items-start text-left space-y-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-200/60 dark:bg-neutral-800/50 border border-neutral-300/30 dark:border-neutral-700/30">
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span class="text-xs font-semibold tracking-wide uppercase text-neutral-600 dark:text-neutral-300">Tasas en tiempo real</span>
          </div>

          <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Intercambio de divisas
            <span class="block bg-linear-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              sin complicaciones.
            </span>
          </h1>

          <p class="text-lg text-neutral-600 dark:text-neutral-400 max-w-xl leading-relaxed">
            Nexus redefine las transferencias y el cambio de moneda. Simple, rápido y con las comisiones más bajas del mercado. Gestiona tu dinero global de manera inteligente.
          </p>

          <!-- Key Features grid -->
          <div class="grid grid-cols-2 gap-4 pt-4 w-full max-w-md">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <UIcon name="i-lucide-zap" class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-sm font-semibold">Al Instante</h3>
                <p class="text-xs text-neutral-500">Operaciones en segundos</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <UIcon name="i-lucide-lock" class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-sm font-semibold">Seguridad Total</h3>
                <p class="text-xs text-neutral-500">Cifrado de grado bancario</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side: Interactive Exchange Widget -->
        <div class="lg:col-span-5 flex justify-center w-full">
          <UCard class="w-full max-w-md border border-neutral-200/80 dark:border-neutral-800 shadow-xl dark:shadow-neutral-950/50 rounded-2xl bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl">
            <template #header>
              <div class="flex justify-between items-center">
                <span class="font-bold text-lg text-neutral-900 dark:text-white">Calculadora de Cambio</span>
                <span class="text-xs text-neutral-500 font-mono">{{ rateMessage }}</span>
              </div>
            </template>

            <div class="space-y-5">
              <!-- Sender input -->
              <div class="p-4 rounded-xl bg-neutral-100/50 dark:bg-neutral-950/40 border border-neutral-200/50 dark:border-neutral-800/40 space-y-2">
                <label class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tú envías</label>
                <div class="flex items-center gap-2">
                  <UInput
                    v-model="fromAmount"
                    type="number"
                    variant="none"
                    size="xl"
                    class="flex-1 font-semibold text-2xl bg-transparent border-0 p-0 focus:ring-0 w-full"
                    placeholder="0.00"
                  />
                  <!-- Select Menu for Origin Currency -->
                  <USelectMenu
                    v-model="fromCurrency"
                    :items="currencies"
                    class="w-32 shadow-sm"
                  >
                    <template #default="{ modelValue }">
                      <div class="flex items-center gap-2">
                        <UIcon :name="modelValue?.icon || 'i-lucide-globe'" class="w-4 h-4 text-blue-500" />
                        <span class="font-bold">{{ modelValue?.code }}</span>
                      </div>
                    </template>
                    <template #item="{ item }">
                      <div class="flex items-center gap-2 py-1">
                        <UIcon :name="item.icon" class="w-4 h-4 text-neutral-500" />
                        <span class="font-medium text-xs">{{ item.name }}</span>
                      </div>
                    </template>
                  </USelectMenu>
                </div>
              </div>

              <!-- Swap Button Wrapper -->
              <div class="relative flex justify-center -my-3 z-10">
                <UButton
                  icon="i-lucide-arrow-up-down"
                  color="primary"
                  variant="solid"
                  size="md"
                  class="rounded-full shadow-lg border-2 border-white dark:border-neutral-900 hover:scale-105 transition-transform"
                  @click="swapCurrencies"
                />
              </div>

              <!-- Receiver input -->
              <div class="p-4 rounded-xl bg-neutral-100/50 dark:bg-neutral-950/40 border border-neutral-200/50 dark:border-neutral-800/40 space-y-2">
                <label class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tú recibes (Estimado)</label>
                <div class="flex items-center gap-2">
                  <div class="flex-1 font-semibold text-2xl text-neutral-900 dark:text-white py-1">
                    {{ toAmount }}
                  </div>
                  <!-- Select Menu for Target Currency -->
                  <USelectMenu
                    v-model="toCurrency"
                    :items="currencies"
                    class="w-32 shadow-sm"
                  >
                    <template #default="{ modelValue }">
                      <div class="flex items-center gap-2">
                        <UIcon :name="modelValue?.icon || 'i-lucide-globe'" class="w-4 h-4 text-indigo-500" />
                        <span class="font-bold">{{ modelValue?.code }}</span>
                      </div>
                    </template>
                    <template #item="{ item }">
                      <div class="flex items-center gap-2 py-1">
                        <UIcon :name="item.icon" class="w-4 h-4 text-neutral-500" />
                        <span class="font-medium text-xs">{{ item.name }}</span>
                      </div>
                    </template>
                  </USelectMenu>
                </div>
              </div>

              <!-- Action Button -->
              <UButton
                label="Comenzar Transacción"
                color="primary"
                variant="solid"
                size="lg"
                block
                class="rounded-xl shadow-lg shadow-blue-500/20 font-bold py-3 mt-4"
              />
            </div>
          </UCard>
        </div>

      </div>
    </main>

    <!-- Footer -->
    <footer class="w-full max-w-7xl mx-auto px-6 py-6 border-t border-neutral-200/50 dark:border-neutral-800/30 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
      <div>
        © 2026 Nexus Inc. Todos los derechos reservados. (Provisional)
      </div>
      <div class="flex items-center gap-6">
        <a href="#" class="hover:text-neutral-800 dark:hover:text-white transition-colors">Términos</a>
        <a href="#" class="hover:text-neutral-800 dark:hover:text-white transition-colors">Privacidad</a>
        <a href="#" class="hover:text-neutral-800 dark:hover:text-white transition-colors">Contacto</a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Standard styling is handled by Tailwind v4 */
</style>
