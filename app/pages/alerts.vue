<script setup lang="ts">
import type { AlertaResponse, AlertaCreateResponse } from "~/types";

definePageMeta({
  middleware: ["auth"],
  title: "Alertas de Tipo de Cambio",
});

const toast = useToast();
const api = useApi();

const alertas = ref<AlertaResponse[]>([]);
const loading = ref(true);
const creating = ref(false);
const modalOpen = ref(false);
const deletingId = ref<number | null>(null);

async function fetchAlertas() {
  loading.value = true;
  try {
    alertas.value = await api<AlertaResponse[]>("/api/alertas");
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudieron cargar las alertas",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    loading.value = false;
  }
}

async function handleAlertSubmit(data: { moneda: string; tipoCambioDeseado: number }) {
  creating.value = true;
  try {
    await api<AlertaCreateResponse>("/api/alertas", {
      method: "POST",
      body: data,
    });
    toast.add({
      title: "Alerta creada",
      color: "success",
      icon: "i-lucide-circle-check",
    });
    modalOpen.value = false;
    await fetchAlertas();
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudo crear la alerta",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    creating.value = false;
  }
}

async function deleteAlerta(id: number) {
  deletingId.value = id;
  try {
    await api(`/api/alertas/${id}`, { method: "DELETE" });
    toast.add({
      title: "Alerta eliminada",
      color: "success",
      icon: "i-lucide-circle-check",
    });
    await fetchAlertas();
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudo eliminar la alerta",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    deletingId.value = null;
  }
}

onMounted(fetchAlertas);
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div class="flex items-center justify-between">
        <p class="text-sm text-neutral-500">Recibe notificaciones cuando el tipo de cambio alcance el valor deseado.</p>
        <UButton label="Nueva alerta" color="primary" icon="i-lucide-plus" @click="modalOpen = true" />
      </div>

      <AlertsTable
        :alertas="alertas"
        :loading="loading"
        :deleting-id="deletingId"
        @delete="deleteAlerta"
      />
    </main>

    <AlertsModal
      v-model:open="modalOpen"
      :creating="creating"
      @submit="handleAlertSubmit"
    />
  </div>
</template>
