<script setup lang="ts">
import type { MetodoPagoResponse } from "~/types";

const props = defineProps<{
  metodosPago: MetodoPagoResponse[];
  loadingAccounts: boolean;
}>();

const emit = defineEmits<{
  (e: "add-account"): void;
  (e: "edit-account" | "delete-account", cuenta: MetodoPagoResponse): void;
}>();
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-highlighted">
        Mis Cuentas Bancarias
      </h2>
      <UButton
        label="Agregar cuenta"
        color="primary"
        icon="i-lucide-plus"
        @click="emit('add-account')"
      />
    </div>

    <div v-if="props.loadingAccounts" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <USkeleton v-for="i in 2" :key="i" class="h-32 rounded-xl" />
    </div>

    <template v-else-if="props.metodosPago.length > 0">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="cuenta in props.metodosPago"
          :key="cuenta.metodoPagoId"
          class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 flex flex-col justify-between h-full relative shadow-sm"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="size-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0"
              >
                <UIcon name="i-lucide-landmark" class="size-5 text-neutral-500 dark:text-neutral-400" />
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-sm truncate text-neutral-900 dark:text-white">
                  {{ cuenta.banco }}
                </p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  {{ cuenta.nombreTitular }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="xs"
                class="rounded-full cursor-pointer"
                @click="emit('edit-account', cuenta)"
              />
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="xs"
                class="shrink-0 rounded-full cursor-pointer"
                @click="emit('delete-account', cuenta)"
              />
            </div>
          </div>
          <div
            class="flex items-center justify-between mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800"
          >
            <span class="text-sm font-semibold text-neutral-900 dark:text-white break-all tracking-normal">{{
              cuenta.numeroCuenta
            }}</span>
            <UBadge color="neutral" variant="soft" size="sm" class="shrink-0 ml-2">
              {{ cuenta.tipoMoneda }}
            </UBadge>
          </div>
        </div>
      </div>
    </template>

    <div
      v-else
      class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 cursor-pointer hover:border-primary-500/50 hover:shadow-sm transition-all"
      @click="emit('add-account')"
    >
      <div class="flex flex-col items-center justify-center py-8 text-center">
        <div
          class="size-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3"
        >
          <UIcon name="i-lucide-plus" class="size-6 text-neutral-500 dark:text-neutral-400" />
        </div>
        <p class="text-sm font-medium text-neutral-900 dark:text-white">
          Vincular nueva cuenta
        </p>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Aún no tienes cuentas bancarias vinculadas
        </p>
      </div>
    </div>
  </section>
</template>
