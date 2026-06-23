<script setup lang="ts">
import type { GetUsersAdminResponse, UpdateUserStatusResponse, ErrorResponse } from '~/types'

definePageMeta({
  middleware: ['auth'],
  title: "Administración - Usuarios"
})

const toast = useToast()
const api = useApi()
const authStore = useAuthStore()

const search = ref('')
const estadoFilter = ref('Todos')
const page = ref(1)
const pageSize = 10

const data = ref<GetUsersAdminResponse | null>(null)
const loading = ref(false)
const updatingId = ref<number | null>(null)

function getEstadoParam(val: string) {
  return val === 'Todos' ? '' : val
}

async function fetchUsers() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, pageSize }
    if (search.value) params.search = search.value
    const estado = getEstadoParam(estadoFilter.value)
    if (estado) params.estado = estado
    const res = await api<GetUsersAdminResponse>('/api/admin/users', { params })
    data.value = res
  } catch {
    toast.add({ title: 'Error', description: 'No se pudieron cargar los usuarios', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    loading.value = false
  }
}

const statusOptions = ['Todos', 'Activo', 'Suspendido', 'Bloqueado']

function getEstadoColor(estado: string) {
  switch (estado) {
    case 'Activo': return 'success'
    case 'Suspendido': return 'warning'
    case 'Bloqueado': return 'error'
    default: return 'neutral'
  }
}

async function updateStatus(usuarioId: number, nuevoEstado: 'Activo' | 'Suspendido' | 'Bloqueado') {
  updatingId.value = usuarioId
  try {
    await api<UpdateUserStatusResponse>(`/api/admin/users/${usuarioId}/status`, {
      method: 'PUT',
      body: { estado: nuevoEstado }
    })
    toast.add({ title: 'Estado actualizado', color: 'success', icon: 'i-lucide-circle-check' })
    await fetchUsers()
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo actualizar el estado', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    updatingId.value = null
  }
}

onMounted(() => {
  if (!authStore.isAdmin) {
    toast.add({ title: 'Acceso Denegado', description: 'No tienes permisos de administrador', color: 'error' })
    navigateTo('/debug')
    return
  }
  fetchUsers()
})

watch(estadoFilter, () => { page.value = 1; fetchUsers() })

function totalPages() {
  return data.value?.totalPaginas || 1
}
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <main class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div class="p-5 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div class="flex gap-3 items-center flex-1">
            <UInput v-model="search" placeholder="Buscar por nombre o correo..." icon="i-lucide-search" class="w-full sm:w-72" @keyup.enter="fetchUsers" />
            <USelect v-model="estadoFilter" :items="statusOptions" class="w-40" />
          </div>
          <UButton label="Buscar" color="primary" :loading="loading" @click="fetchUsers" />
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">ID</th>
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Nombres</th>
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Correo</th>
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Rol</th>
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Estado</th>
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Verificado</th>
                <th class="text-left px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Registro</th>
                <th class="text-right px-5 py-3 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading" class="animate-pulse">
                <td v-for="i in 8" :key="i" class="px-5 py-4">
                  <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
                </td>
              </tr>
              <tr v-else v-for="user in data?.datos || []" :key="user.usuarioId" class="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <td class="px-5 py-4 font-mono text-xs text-neutral-500">{{ user.usuarioId }}</td>
                <td class="px-5 py-4 font-medium">{{ user.nombres }} {{ user.apellidos }}</td>
                <td class="px-5 py-4 text-neutral-500">{{ user.correo }}</td>
                <td class="px-5 py-4">
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">{{ user.rol }}</span>
                </td>
                <td class="px-5 py-4">
                  <UBadge :color="getEstadoColor(user.estado)" variant="soft" size="sm">{{ user.estado }}</UBadge>
                </td>
                <td class="px-5 py-4">
                  <UIcon v-if="user.esVerificado" name="i-lucide-check-circle" class="size-5 text-green-500" />
                  <UIcon v-else name="i-lucide-x-circle" class="size-5 text-neutral-300" />
                </td>
                <td class="px-5 py-4 text-xs text-neutral-500">{{ new Date(user.fechaRegistro).toLocaleDateString() }}</td>
                <td class="px-5 py-4 text-right">
                  <UDropdownMenu :items="[
                    [{ label: 'Activo', icon: 'i-lucide-check-circle', onSelect: () => updateStatus(user.usuarioId, 'Activo') }],
                    [
                      { label: 'Suspendido', icon: 'i-lucide-pause-circle', onSelect: () => updateStatus(user.usuarioId, 'Suspendido') },
                      { label: 'Bloqueado', icon: 'i-lucide-ban', onSelect: () => updateStatus(user.usuarioId, 'Bloqueado') },
                    ]
                  ]">
                    <UButton label="Cambiar estado" color="neutral" variant="outline" size="xs" :loading="updatingId === user.usuarioId" icon="i-lucide-chevron-down" trailing />
                  </UDropdownMenu>
                </td>
              </tr>
              <tr v-if="!loading && (!data?.datos || data.datos.length === 0)">
                <td colspan="8" class="text-center py-12 text-neutral-400">
                  <UIcon name="i-lucide-users" class="size-10 mx-auto mb-2" />
                  <p>No se encontraron usuarios</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <span class="text-xs text-neutral-500">Total: {{ data?.total || 0 }} usuarios</span>
          <div class="flex items-center gap-2">
            <UButton label="Anterior" color="neutral" variant="outline" size="sm" :disabled="page <= 1" @click="page--; fetchUsers()" />
            <span class="text-xs text-neutral-500">Pág. {{ page }} de {{ totalPages() }}</span>
            <UButton label="Siguiente" color="neutral" variant="outline" size="sm" :disabled="page >= totalPages()" @click="page++; fetchUsers()" />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
