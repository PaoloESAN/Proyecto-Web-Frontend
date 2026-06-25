<script setup lang="ts">
import type { TransaccionHistoryResponse } from '~/types'

definePageMeta({
  middleware: ['auth'],
  title: 'Mis transacciones'
})

const api = useApi()
const toast = useToast()

const loading = ref(false)
const myTransactions = ref<TransaccionHistoryResponse['datos']>([])

function formatAmount(value: number) {
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function txStatusColor(estado: string) {
  if (estado === 'Disputa') return 'error'
  if (estado === 'Pendiente') return 'warning'
  if (estado === 'Pagado') return 'info'
  if (estado === 'Finalizado') return 'success'
  return 'neutral'
}

function roleColor(rol: 'Comprador' | 'Vendedor') {
  return rol === 'Comprador' ? 'primary' : 'secondary'
}

function getAmountToSend(tx: TransaccionHistoryResponse['datos'][number]) {
  return tx.miRol === 'Comprador'
    ? { amount: tx.montoTengo, currency: tx.monedaTengo }
    : { amount: tx.montoRecibo, currency: tx.monedaRecibo }
}

function getAmountToReceive(tx: TransaccionHistoryResponse['datos'][number]) {
  return tx.miRol === 'Comprador'
    ? { amount: tx.montoRecibo, currency: tx.monedaRecibo }
    : { amount: tx.montoTengo, currency: tx.monedaTengo }
}

async function fetchData() {
  loading.value = true
  try {
    const txRes = await api<TransaccionHistoryResponse>('/api/transacciones/history', {
      params: { page: 1, pageSize: 200 }
    })

    myTransactions.value = (txRes?.datos ?? []).filter(t => t.estado !== 'Finalizado')
  } catch {
    toast.add({
      title: 'Error',
      description: 'No se pudo cargar la información de transacciones.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <main class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Mis transacciones</h1>
        <p class="text-sm text-neutral-500 mt-1">Transacciones donde participas (como comprador o vendedor).</p>
      </div>

      <div v-if="loading" class="grid gap-4">
        <USkeleton v-for="i in 3" :key="i" class="h-28 rounded-xl" />
      </div>

      <template v-else>
        <div v-if="myTransactions.length === 0" class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-16 text-center">
          <p class="text-neutral-500 font-medium">Aún no tienes transacciones</p>
          <p class="text-sm text-neutral-400 mt-1">Cuando inicies o recibas una operación aparecerá aquí.</p>
        </div>

        <div v-else class="grid gap-4">
          <NuxtLink
            v-for="tx in myTransactions"
            :key="tx.transaccionId"
            :to="`/transaction/${tx.transaccionId}`"
            class="group block rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-5 space-y-4 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30 transition-all duration-200"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-lg font-extrabold text-neutral-900 dark:text-white">Transacción #{{ tx.transaccionId }}</p>
                <p class="text-xs sm:text-sm text-neutral-500 mt-0.5 truncate">
                  Oferta #{{ tx.ofertaId }} · {{ tx.tipoOperacion }} · {{ tx.monedaTengo }} → {{ tx.monedaRecibo }}
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <UBadge :color="roleColor(tx.miRol)" variant="subtle">{{ tx.miRol }}</UBadge>
                <UBadge :color="txStatusColor(tx.estado)" variant="soft">{{ tx.estado }}</UBadge>
              </div>
            </div>

            <div class="grid sm:grid-cols-3 gap-3 text-sm">
              <div class="rounded-xl border border-default bg-muted/20 p-3.5">
                <p class="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold">Tú envías</p>
                <p class="font-extrabold text-rose-500 mt-1">
                  {{ formatAmount(getAmountToSend(tx).amount) }} {{ getAmountToSend(tx).currency }}
                </p>
              </div>
              <div class="rounded-xl border border-default bg-muted/20 p-3.5">
                <p class="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold">Tú recibes</p>
                <p class="font-extrabold text-emerald-500 mt-1">
                  {{ formatAmount(getAmountToReceive(tx).amount) }} {{ getAmountToReceive(tx).currency }}
                </p>
              </div>
              <div class="rounded-xl border border-default bg-muted/20 p-3.5">
                <p class="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold">Contraparte</p>
                <p class="font-bold mt-1 text-neutral-900 dark:text-neutral-100">{{ tx.contraparte.nombres }} {{ tx.contraparte.apellidos }}</p>
              </div>
            </div>

            <div class="flex items-center justify-end text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Ver sala de transacción
              <UIcon name="i-lucide-arrow-right" class="size-3.5 ml-1" />
            </div>
          </NuxtLink>
        </div>
      </template>
    </main>
  </div>
</template>
