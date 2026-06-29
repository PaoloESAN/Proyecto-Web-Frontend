<script setup lang="ts">
import type { UserProfileResponse } from "~/types";

const props = defineProps<{
  isAuthenticated: boolean;
  usuario: {
    usuarioId: number;
    nombres: string;
    apellidos: string;
    correo: string;
    rol: string;
    esVerificado: boolean;
  } | null;
  avatarUrl: string | null;
  profile: UserProfileResponse | null;
  loadingProfile: boolean;
}>();
</script>

<template>
  <section class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-md space-y-4">
    <h2 class="text-lg font-bold flex items-center gap-2">
      <UIcon name="i-lucide-user-check" class="text-primary size-5" />
      Detalles de la Sesión de Usuario
    </h2>

    <div v-if="props.isAuthenticated && props.usuario" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      <div class="space-y-1">
        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-semibold block uppercase tracking-wider">Nombre Completo</span>
        <span class="text-base font-bold text-neutral-900 dark:text-white">
          {{ props.usuario.nombres }} {{ props.usuario.apellidos }}
        </span>
      </div>

      <div class="space-y-1">
        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-semibold block uppercase tracking-wider">Correo Electrónico</span>
        <span class="text-base font-medium text-neutral-900 dark:text-white">
          {{ props.usuario.correo }}
        </span>
      </div>

      <div class="space-y-1">
        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-semibold block uppercase tracking-wider">ID de Usuario</span>
        <span class="text-base font-mono font-bold text-neutral-900 dark:text-white">
          {{ props.usuario.usuarioId }}
        </span>
      </div>

      <div class="space-y-1">
        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-semibold block uppercase tracking-wider">Rol en Plataforma</span>
        <div>
          <span class="inline-block text-xs px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold uppercase tracking-wider">
            {{ props.usuario.rol }}
          </span>
        </div>
      </div>

      <div class="space-y-1">
        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-semibold block uppercase tracking-wider">Estado de Verificación</span>
        <div>
          <span
            v-if="props.usuario.esVerificado"
            class="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold"
          >
            <UIcon name="i-lucide-check-circle-2" class="size-3.5 animate-pulse" />
            Verificado (DNI aprobado)
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-bold"
          >
            <UIcon name="i-lucide-help-circle" class="size-3.5" />
            Pendiente de Verificación
          </span>
        </div>
      </div>

      <div class="space-y-1">
        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-semibold block uppercase tracking-wider">Calificación</span>
        <div>
          <USkeleton v-if="props.loadingProfile" class="h-6 w-24 rounded-full" />
          <div v-else-if="props.profile" class="flex items-center">
            <CommonRatingStars :rating="props.profile.calificacion" size="sm" />
          </div>
          <span v-else class="text-sm font-medium text-neutral-500 dark:text-neutral-400">-</span>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-6 text-neutral-500 dark:text-neutral-400 text-sm">
      <UIcon name="i-lucide-user-x" class="size-10 mx-auto text-neutral-400 mb-2" />
      No hay ninguna sesión de usuario activa actualmente. Por favor, inicia sesión.
    </div>
  </section>
</template>
