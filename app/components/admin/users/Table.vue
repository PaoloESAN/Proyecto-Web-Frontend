<script setup lang="ts">
import type { GetUsersAdminResponse } from "~/types";

const props = defineProps<{
  users: GetUsersAdminResponse["datos"];
  loading: boolean;
  updatingId: number | null;
}>();

const emit = defineEmits<{
  (e: "update-status", payload: { id: number; status: "Activo" | "Suspendido" | "Bloqueado" }): void;
  (e: "update-verification", payload: { id: number; verified: boolean }): void;
}>();

function getEstadoColor(estado: string) {
  switch (estado) {
    case "Activo":
      return "success";
    case "Suspendido":
      return "warning";
    case "Bloqueado":
      return "error";
    default:
      return "neutral";
  }
}
</script>

<template>
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
        <tr v-if="props.loading" class="animate-pulse">
          <td v-for="i in 8" :key="i" class="px-5 py-4">
            <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </td>
        </tr>
        <tr
          v-for="user in props.users"
          v-else
          :key="user.usuarioId"
          class="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
        >
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
            <UDropdownMenu
              :items="[
                [{ label: 'Activo', icon: 'i-lucide-check-circle', onSelect: () => emit('update-status', { id: user.usuarioId, status: 'Activo' }) }],
                [{ label: 'Bloqueado', icon: 'i-lucide-ban', onSelect: () => emit('update-status', { id: user.usuarioId, status: 'Bloqueado' }) }],
                [
                  user.esVerificado
                    ? { label: 'Quitar Verificación', icon: 'i-lucide-shield-off', onSelect: () => emit('update-verification', { id: user.usuarioId, verified: false }) }
                    : { label: 'Verificar Identidad', icon: 'i-lucide-shield-check', onSelect: () => emit('update-verification', { id: user.usuarioId, verified: true }) }
                ]
              ]"
            >
              <UButton
                label="Cambiar estado"
                color="neutral"
                variant="outline"
                size="xs"
                class="cursor-pointer"
                :loading="props.updatingId === user.usuarioId"
                icon="i-lucide-chevron-down"
                trailing
              />
            </UDropdownMenu>
          </td>
        </tr>
        <tr v-if="!props.loading && props.users.length === 0">
          <td colspan="8" class="text-center py-12 text-neutral-400">
            <UIcon name="i-lucide-users" class="size-10 mx-auto mb-2" />
            <p>No se encontraron usuarios</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
