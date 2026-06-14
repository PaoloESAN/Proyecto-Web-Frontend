<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { ErrorResponse, LoginRequest, LoginResponse } from "~/types";

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

    await navigateTo("/marketplace");
  } catch (error: any) {
    const errorData = error.data as ErrorResponse | undefined;
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
</script>

<template>
  <div
    class="flex min-h-dvh items-center justify-center bg-linear-to-tr from-neutral-100 to-neutral-50 dark:from-neutral-950 dark:to-neutral-900 px-4"
  >
    <UCard
      class="w-full max-w-md backdrop-blur-md bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/50 dark:border-neutral-800/50 shadow-2xl rounded-2xl transition-all duration-300 hover:shadow-primary/5 dark:hover:shadow-primary/10"
      :ui="{ body: 'p-6 sm:p-8' }"
    >
      <template #header>
        <div class="flex flex-col items-center text-center space-y-2">
          <div class="p-3 bg-primary/10 text-primary rounded-xl">
            <UIcon name="i-lucide-lock" class="size-6 animate-pulse" />
          </div>
          <h1
            class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white"
          >
            Bienvenido de nuevo
          </h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Ingresa a tu cuenta P2P para comerciar
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
