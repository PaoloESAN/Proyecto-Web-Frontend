<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { ErrorResponse, RegisterRequest, RegisterResponse } from "~/types";

definePageMeta({
  layout: false,
});

// Esquema de validación con Zod
const schema = z
  .object({
    nombres: z
      .string()
      .min(1, "El nombre es requerido")
      .max(100, "El nombre no puede exceder los 100 caracteres"),
    apellidos: z
      .string()
      .min(1, "El apellido es requerido")
      .max(100, "El apellido no puede exceder los 100 caracteres"),
    correo: z
      .email("Ingresa un correo electrónico válido")
      .max(150, "El correo no puede exceder los 150 caracteres"),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .max(255, "La contraseña no puede exceder los 255 caracteres"),
    confirmarPassword: z.string().min(1, "Debes confirmar tu contraseña"),
  })
  .refine((data) => data.password === data.confirmarPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarPassword"],
  });

type Schema = z.output<typeof schema>;

const state = reactive<RegisterRequest>({
  nombres: "",
  apellidos: "",
  correo: "",
  password: "",
  confirmarPassword: "",
});

const loading = ref(false);
const errorMessage = ref<string | null>(null);

const api = useApi();
const toast = useToast();

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true;
  errorMessage.value = null;

  try {
    const response = await api<RegisterResponse>("/api/auth/register", {
      method: "POST",
      body: event.data,
    });

    toast.add({
      title: "Registro exitoso",
      description:
        response.mensaje ||
        "Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión.",
      color: "success",
    });

    await navigateTo("/login");
  } catch (error: any) {
    const errorData = error.data as ErrorResponse | undefined;
    if (errorData && errorData.mensaje) {
      errorMessage.value = errorData.mensaje;
    } else {
      errorMessage.value =
        "Ocurrió un error inesperado al registrar tu cuenta. Inténtalo de nuevo.";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="flex min-h-dvh items-center justify-center bg-linear-to-br from-neutral-100 via-neutral-50 to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary-950/20 px-6 py-10"
  >
    <UCard
      class="w-full max-w-2xl backdrop-blur-md bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/50 dark:border-neutral-800/50 shadow-2xl rounded-2xl transition-all duration-300 hover:shadow-primary/5 dark:hover:shadow-primary/10"
      :ui="{ body: 'p-6 sm:p-8' }"
    >
      <template #header>
        <div class="flex flex-col items-center text-center space-y-2">
          <div class="p-3 bg-primary/10 text-primary rounded-xl">
            <UIcon name="i-lucide-user-plus" class="size-6 animate-pulse" />
          </div>
          <h1
            class="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white"
          >
            Crea tu cuenta
          </h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Regístrate en la plataforma y empieza a comerciar divisas
          </p>
        </div>
      </template>

      <!-- Alerta de Error del Servidor -->
      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :title="errorMessage ? '' : 'Error al registrarse'"
        :description="errorMessage"
        class="mb-6"
      />

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="flex flex-col sm:flex-row gap-4">
          <UFormField name="nombres" label="Nombres" required class="flex-1">
            <UInput
              v-model="state.nombres"
              type="text"
              placeholder="Juan"
              icon="i-lucide-user"
              class="w-full"
              autocomplete="given-name"
            />
          </UFormField>

          <UFormField name="apellidos" label="Apellidos" required class="flex-1">
            <UInput
              v-model="state.apellidos"
              type="text"
              placeholder="Pérez"
              icon="i-lucide-user"
              class="w-full"
              autocomplete="family-name"
            />
          </UFormField>
        </div>

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
          <UInput
            v-model="state.password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            icon="i-lucide-key-round"
            class="w-full"
            autocomplete="new-password"
          />
        </UFormField>

        <UFormField name="confirmarPassword" label="Confirmar contraseña" required>
          <UInput
            v-model="state.confirmarPassword"
            type="password"
            placeholder="••••••••"
            icon="i-lucide-key-round"
            class="w-full"
            autocomplete="new-password"
          />
        </UFormField>

        <div class="pt-2">
          <UButton
            type="submit"
            label="Registrarse"
            color="primary"
            block
            class="font-semibold py-2.5 transition-transform active:scale-[0.98]"
            :loading="loading"
          />
        </div>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-neutral-500 dark:text-neutral-400">
          ¿Ya tienes una cuenta?
          <ULink to="/login" class="text-primary font-semibold hover:underline">
            Inicia sesión
          </ULink>
        </p>
      </template>
    </UCard>
  </div>
</template>
