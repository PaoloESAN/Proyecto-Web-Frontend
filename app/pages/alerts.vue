<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { AlertaResponse, AlertaCreateResponse } from '~/types'

definePageMeta({
  middleware: ['auth']
})

const toast = useToast()
const api = useApi()

const alertas = ref<AlertaResponse[]>([])
const loading = ref(true)
const creating = ref(false)

async function fetchAlertas() {
  loading.value = true
  try {
    alertas.value = await api<AlertaResponse[]>('/api/alertas')
  } catch {
    toast.add({ title: 'Error', description: 'No se pudieron cargar las alertas', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    loading.value = false
  }
}

const modalOpen = ref(false)

const monedas = ['USD', 'EUR', 'GBP', 'MXN', 'PEN']

const schema = z.object({
  moneda: z.string().min(1, 'Selecciona una moneda'),
  tipoCambioDeseado: z.number({ message: 'Debe ser un número' }).positive('Debe ser mayor a 0')
})

type Schema = z.output<typeof schema>
const state = reactive<Partial<Schema>>({ moneda: '', tipoCambioDeseado: undefined })

async function onSubmit(event: FormSubmitEvent<Schema>) {
  creating.value = true
  try {
    await api<AlertaCreateResponse>('/api/alertas', {
      method: 'POST',
      body: event.data
    })
    toast.add({ title: 'Alerta creada', color: 'success', icon: 'i-lucide-circle-check' })
    modalOpen.value = false
    state.moneda = ''
    state.tipoCambioDeseado = undefined
    await fetchAlertas()
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo crear la alerta', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    creating.value = false
  }
}

const deletingId = ref<number | null>(null)

async function deleteAlerta(id: number) {
  deletingId.value = id
  try {
    await api(`/api/alertas/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Alerta eliminada', color: 'success', icon: 'i-lucide-circle-check' })
    await fetchAlertas()
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo eliminar la alerta', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    deletingId.value = null
  }
}

function getEstadoColor(estado: string) {
  return estado === 'Activa' ? 'success' : 'neutral'
}

onMounted(fetchAlertas)
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <header class="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      <div class="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <h1 class="text-xl font-bold">Alertas de Tipo de Cambio</h1>
        <UButton label="Volver" color="neutral" variant="ghost" icon="i-lucide-arrow-left" @click="navigateTo('/debug')" />
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div class="flex items-center justify-between">
        <p class="text-sm text-neutral-500">Recibe notificaciones cuando el tipo de cambio alcance el valor deseado.</p>
        <UButton label="Nueva alerta" color="primary" icon="i-lucide-plus" @click="modalOpen = true" />
      </div>

      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Moneda</th>
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Tipo de Cambio Deseado</th>
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Estado</th>
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Fecha de Creación</th>
                <th class="text-right px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading" class="animate-pulse">
                <td v-for="i in 5" :key="i" class="px-5 py-4">
                  <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
                </td>
              </tr>
              <tr v-else v-for="alerta in alertas" :key="alerta.alertaId" class="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <td class="px-5 py-4 font-medium">{{ alerta.moneda }}</td>
                <td class="px-5 py-4 font-mono">{{ alerta.tipoCambioDeseado }}</td>
                <td class="px-5 py-4">
                  <UBadge :color="getEstadoColor(alerta.estado)" variant="soft" size="sm">{{ alerta.estado }}</UBadge>
                </td>
                <td class="px-5 py-4 text-xs text-neutral-500">{{ new Date(alerta.fechaCreacion).toLocaleDateString() }}</td>
                <td class="px-5 py-4 text-right">
                  <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" :loading="deletingId === alerta.alertaId" @click="deleteAlerta(alerta.alertaId)" />
                </td>
              </tr>
              <tr v-if="!loading && alertas.length === 0">
                <td colspan="5" class="text-center py-12 text-neutral-400">
                  <UIcon name="i-lucide-bell-off" class="size-10 mx-auto mb-2" />
                  <p>No tienes alertas configuradas</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <UModal v-model:open="modalOpen" title="Nueva Alerta" description="Configura una alerta para recibir notificaciones cuando el tipo de cambio alcance el valor deseado.">
      <template #body>
        <UForm id="alerta-form" :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField name="moneda" label="Moneda" required>
            <USelect v-model="state.moneda" :items="monedas" placeholder="Selecciona una moneda" class="w-full" />
          </UFormField>
          <UFormField name="tipoCambioDeseado" label="Tipo de Cambio Deseado" required>
            <UInput v-model="state.tipoCambioDeseado" type="number" step="0.01" placeholder="Ej: 3.75" class="w-full" />
          </UFormField>
        </UForm>
      </template>
      <template #footer="{ close }">
        <UButton label="Cancelar" color="neutral" variant="outline" @click="close" />
        <UButton type="submit" form="alerta-form" label="Crear alerta" :loading="creating" />
      </template>
    </UModal>
  </div>
</template>
