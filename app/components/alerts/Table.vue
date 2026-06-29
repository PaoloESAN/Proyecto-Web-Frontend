<script setup lang="ts">
import type { AlertaResponse } from "~/types";

const props = defineProps<{
  alertas: AlertaResponse[];
  loading: boolean;
  deletingId: number | null;
}>();

const emit = defineEmits<{
  (e: "delete", id: number): void;
}>();

function getEstadoColor(estado: string) {
  return estado === "Activa" ? "success" : "neutral";
}
</script>

<template>
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
          <tr v-if="props.loading" class="animate-pulse">
            <td v-for="i in 5" :key="i" class="px-5 py-4">
              <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
            </td>
          </tr>
          <tr
            v-for="alerta in props.alertas"
            v-else
            :key="alerta.alertaId"
            class="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
          >
            <td class="px-5 py-4 font-medium">{{ alerta.moneda }}</td>
            <td class="px-5 py-4 font-mono">{{ alerta.tipoCambioDeseado }}</td>
            <td class="px-5 py-4">
              <UBadge :color="getEstadoColor(alerta.estado)" variant="soft" size="sm">{{ alerta.estado }}</UBadge>
            </td>
            <td class="px-5 py-4 text-xs text-neutral-500">{{ new Date(alerta.fechaCreacion).toLocaleDateString() }}</td>
            <td class="px-5 py-4 text-right">
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="sm"
                class="cursor-pointer"
                :loading="props.deletingId === alerta.alertaId"
                @click="emit('delete', alerta.alertaId)"
              />
            </td>
          </tr>
          <tr v-if="!props.loading && props.alertas.length === 0">
            <td colspan="5" class="text-center py-12 text-neutral-400">
              <UIcon name="i-lucide-bell-off" class="size-10 mx-auto mb-2" />
              <p>No tienes alertas configuradas</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
