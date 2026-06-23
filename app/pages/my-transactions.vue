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

async function fetchData() {
  loading.value = true
  try {
    const txRes = await api<TransaccionHistoryResponse>('/api/transacciones/history', {
      params: { page: 1, pageSize: 200 }
    })

    myTransactions.value = txRes?.datos ?? []
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
            class="block rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-4 space-y-3 hover:shadow-md transition"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-bold">Transacción #{{ tx.transaccionId }}</p>
                <p class="text-xs text-neutral-500">Oferta #{{ tx.ofertaId }} · {{ tx.tipoOperacion }} · {{ tx.monedaTengo }} → {{ tx.monedaRecibo }}</p>
              </div>
              <UBadge :color="tx.estado === 'Disputa' ? 'error' : (tx.estado === 'Pendiente' ? 'warning' : (tx.estado === 'Pagado' ? 'info' : 'primary'))" variant="soft">
                {{ tx.estado }}
              </UBadge>
            </div>

            <div class="grid sm:grid-cols-3 gap-3 text-sm">
              <div class="border border-default rounded-lg p-3">
                <p class="text-xs text-neutral-500">Entrega contraparte</p>
                <p class="font-bold">{{ Number(tx.montoTengo).toLocaleString() }} {{ tx.monedaTengo }}</p>
              </div>
              <div class="border border-default rounded-lg p-3">
                <p class="text-xs text-neutral-500">Recibe contraparte</p>
                <p class="font-bold">{{ Number(tx.montoRecibo).toLocaleString() }} {{ tx.monedaRecibo }}</p>
              </div>
              <div class="border border-default rounded-lg p-3">
                <p class="text-xs text-neutral-500">Usuario</p>
                <p class="font-bold">{{ tx.contraparte.nombres }} {{ tx.contraparte.apellidos }}</p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </template>
    </main>
  </div>
</template>
