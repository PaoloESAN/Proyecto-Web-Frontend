<script setup lang="ts">
import type { UserProfileResponse } from "~/types";

const props = defineProps<{
  profile: UserProfileResponse | null;
  loadingProfile: boolean;
  avatarUrl: string | null;
}>();

const emit = defineEmits<{
  (e: "edit-profile"): void;
}>();
</script>

<template>
  <aside class="space-y-6">
    <div
      class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 flex flex-col items-center text-center shadow-sm space-y-4"
    >
      <div class="flex items-center justify-center">
        <USkeleton v-if="props.loadingProfile" class="size-24 rounded-full" />
        <UAvatar
          v-else
          :src="props.avatarUrl || undefined"
          :alt="props.profile?.nombres ?? '?'"
          :text="props.profile?.nombres?.charAt(0).toUpperCase() ?? '?'"
          size="2xl"
          class="mx-auto"
        />
      </div>

      <div>
        <USkeleton v-if="props.loadingProfile" class="h-5 w-40 mb-1 mx-auto" />
        <h2 v-else class="text-lg font-bold text-highlighted">
          {{ props.profile?.nombres }} {{ props.profile?.apellidos }}
        </h2>

        <USkeleton v-if="props.loadingProfile" class="h-4 w-48 mb-1 mx-auto" />
        <p v-else class="text-sm text-muted">{{ props.profile?.correo }}</p>

        <USkeleton v-if="props.loadingProfile" class="h-4 w-32 mx-auto" />
        <div v-else class="flex justify-center mt-1">
          <CommonRatingStars
            v-if="props.profile"
            :rating="props.profile.calificacion"
            size="sm"
          />
        </div>
      </div>
    </div>

    <div
      class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-4 shadow-sm"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-muted uppercase tracking-wider">Estado</span>
        <UBadge v-if="props.profile?.esVerificado" color="success" variant="soft" size="sm">
          <template #leading>
            <UIcon name="i-lucide-check-circle" class="size-3.5" />
          </template>
          Verificado
        </UBadge>
        <UBadge v-else color="warning" variant="soft" size="sm">
          <template #leading>
            <UIcon name="i-lucide-help-circle" class="size-3.5" />
          </template>
          Pendiente
        </UBadge>
      </div>
      <UButton
        v-if="!props.profile?.esVerificado"
        label="Verificar identidad"
        color="primary"
        variant="soft"
        icon="i-lucide-id-card"
        block
        class="cursor-pointer"
        @click="navigateTo('/verify-identity')"
      />
    </div>

    <UButton
      label="Editar Perfil"
      color="neutral"
      variant="outline"
      icon="i-lucide-pencil"
      block
      class="cursor-pointer"
      @click="emit('edit-profile')"
    />
  </aside>
</template>
