<script setup lang="ts">
import type { GetUsersAdminResponse, UpdateUserStatusResponse } from "~/types";

definePageMeta({
  middleware: ["auth"],
  title: "Administración - Usuarios",
});

const toast = useToast();
const api = useApi();
const authStore = useAuthStore();

const search = ref("");
const estadoFilter = ref("Todos");
const page = ref(1);
const pageSize = 10;

const data = ref<GetUsersAdminResponse | null>(null);
const loading = ref(false);
const updatingId = ref<number | null>(null);

function getEstadoParam(val: string) {
  return val === "Todos" ? "" : val;
}

async function fetchUsers() {
  loading.value = true;
  try {
    const params: Record<string, string | number> = {
      page: page.value,
      pageSize,
    };
    if (search.value) params.search = search.value;
    const estado = getEstadoParam(estadoFilter.value);
    if (estado) params.estado = estado;
    const res = await api<GetUsersAdminResponse>("/api/admin/users", {
      params,
    });
    data.value = res;
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudieron cargar los usuarios",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    loading.value = false;
  }
}

const statusOptions = ["Todos", "Activo", "Suspendido", "Bloqueado"];

async function handleUpdateStatus(payload: {
  id: number;
  status: "Activo" | "Suspendido" | "Bloqueado";
}) {
  updatingId.value = payload.id;
  try {
    await api<UpdateUserStatusResponse>(
      `/api/admin/users/${payload.id}/status`,
      {
        method: "PUT",
        body: { estado: payload.status },
      }
    );
    toast.add({
      title: "Estado actualizado",
      color: "success",
      icon: "i-lucide-circle-check",
    });
    await fetchUsers();
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudo actualizar el estado",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    updatingId.value = null;
  }
}

async function handleUpdateVerification(payload: {
  id: number;
  verified: boolean;
}) {
  updatingId.value = payload.id;
  try {
    await api<unknown>(`/api/admin/users/${payload.id}/verify`, {
      method: "PUT",
      body: { esVerificado: payload.verified },
    });
    toast.add({
      title: "Verificación actualizada",
      color: "success",
      icon: "i-lucide-circle-check",
    });
    await fetchUsers();
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudo actualizar la verificación",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    updatingId.value = null;
  }
}

onMounted(() => {
  if (!authStore.isAdmin) {
    toast.add({
      title: "Acceso Denegado",
      description: "No tienes permisos de administrador",
      color: "error",
    });
    navigateTo("/debug");
    return;
  }
  fetchUsers();
});

watch(estadoFilter, () => {
  page.value = 1;
  fetchUsers();
});

function totalPages() {
  return data.value?.totalPaginas || 1;
}
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <main class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <AdminUsersFilters
          v-model:search="search"
          v-model:estado-filter="estadoFilter"
          :status-options="statusOptions"
          :loading="loading"
          @search="fetchUsers"
        />

        <AdminUsersTable
          :users="data?.datos || []"
          :loading="loading"
          :updating-id="updatingId"
          @update-status="handleUpdateStatus"
          @update-verification="handleUpdateVerification"
        />

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
