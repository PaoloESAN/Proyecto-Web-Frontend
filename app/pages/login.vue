<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { ErrorResponse, LoginRequest, LoginResponse } from "~/types";

definePageMeta({
  layout: false,
});

// Esquema de validación con Zod
const schema = z.object({
  correo: z.email("Ingresa un formato de correo electrónico válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type Schema = z.output<typeof schema>;

const state = reactive<LoginRequest>({
  correo: "",
  password: "",
});

const loading = ref(false);
const errorMessage = ref<string | null>(null);

const api = useApi();
const authStore = useAuthStore();

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true;
  errorMessage.value = null;

  try {
    const response = await api<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: event.data,
    });

    // Guardar sesión en Pinia y cookies
    authStore.login(response.token, response.expiracion, response.usuario);

    // Redirigir a la pantalla principal
    await navigateTo('/marketplace')
  } catch (error) {
    const err = error as { data?: ErrorResponse };
    const errorData = err.data;
    if (errorData && errorData.mensaje) {
      errorMessage.value = errorData.mensaje;
    } else {
      errorMessage.value =
        "Ocurrió un error inesperado al iniciar sesión. Inténtalo de nuevo.";
    }
  } finally {
    loading.value = false;
  }
}

function quickLogin(correo: string, contrasena: string) {
  state.correo = correo
  state.password = contrasena
}
</script>

<template>
  <div
    class="flex min-h-dvh items-center justify-center bg-linear-to-br from-neutral-100 via-neutral-50 to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary-950/20 px-6 py-10"
  >
    <UCard
      class="w-full max-w-xl backdrop-blur-md bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/50 dark:border-neutral-800/50 shadow-2xl rounded-2xl transition-all duration-300 hover:shadow-primary/5 dark:hover:shadow-primary/10"
      :ui="{ body: 'p-6 sm:p-8' }"
    >
      <template #header>
        <div class="flex flex-col items-center text-center space-y-2">
          <div class="p-3 bg-primary/10 text-primary rounded-xl">
            <UIcon name="i-lucide-lock" class="size-6 animate-pulse" />
          </div>
          <h1
            class="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white"
          >
            Bienvenido de nuevo
          </h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Ingresa a tu cuenta para comerciar
          </p>
        </div>
      </template>

      <!-- Alerta de Error del Servidor -->
      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :title="errorMessage ? '' : 'Error de inicio de sesión'"
        :description="errorMessage"
        class="mb-6"
      />

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField name="correo" label="Correo electrónico" required>
          <UInput
            v-model="state.correo"
            type="email"
            placeholder="correo@ejemplo.com"
            icon="i-lucide-mail"
            class="w-full"
            autocomplete="email"
          />
        </UFormField>

        <UFormField name="password" label="Contraseña" required>
          <template #hint>
            <ULink
              to="/recover-password"
              class="text-xs text-primary font-medium hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </ULink>
          </template>
          <UInput
            v-model="state.password"
            type="password"
            placeholder="••••••••"
            icon="i-lucide-key-round"
            class="w-full"
            autocomplete="current-password"
          />
        </UFormField>

        <UButton
          type="submit"
          label="Iniciar Sesión"
          color="primary"
          block
          class="font-semibold py-2.5 transition-transform active:scale-[0.98]"
          :loading="loading"
        />
      </UForm>

      <!-- Botones de Acceso Rápido para Pruebas -->
      <div class="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
        <p class="text-center text-[10px] font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
          Acceso Rápido (Pruebas)
        </p>
        <div class="grid grid-cols-3 gap-2">
          <UButton
            label="Usuario 1"
            variant="outline"
            color="neutral"
            size="xs"
            class="justify-center text-[11px]"
            @click="quickLogin('julioprofe@email.com', '123456')"
          />
          <UButton
            label="Usuario 2"
            variant="outline"
            color="neutral"
            size="xs"
            class="justify-center text-[11px]"
            @click="quickLogin('juanjose@email.com', '123456')"
          />
          <UButton
            label="Admin"
            variant="outline"
            color="neutral"
            size="xs"
            class="justify-center text-[11px]"
            @click="quickLogin('admin@exchange.com', 'admin123')"
          />
        </div>
      </div>

      <template #footer>
        <p class="text-center text-sm text-neutral-500 dark:text-neutral-400">
          ¿No tienes una cuenta?
          <ULink
            to="/register"
            class="text-primary font-semibold hover:underline"
          >
            Regístrate
          </ULink>
        </p>
      </template>
    </UCard>
  </div>
</template>
