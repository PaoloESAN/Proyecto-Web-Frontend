<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { MessageResponse, ErrorResponse } from "~/types";

definePageMeta({
  layout: false,
});

const route = useRoute();
const router = useRouter();

const token = computed(() => route.query.token as string | undefined);

const schema = z
  .object({
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmarPassword: z.string().min(1, "Confirma tu nueva contraseña"),
  })
  .refine((data) => data.password === data.confirmarPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarPassword"],
  });

type Schema = z.output<typeof schema>;

const state = reactive({ password: "", confirmarPassword: "" });
const loading = ref(false);
const success = ref(false);
const errorMessage = ref<string | null>(null);

const api = useApi();

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!token.value) {
    errorMessage.value = "Token de recuperación inválido o ausente.";
    return;
  }

  loading.value = true;
  errorMessage.value = null;

  try {
    await api<MessageResponse>("/api/auth/reset-password", {
      method: "POST",
      body: {
        token: token.value,
        password: event.data.password,
      },
    });
    success.value = true;
  } catch (error: any) {
    const errorData = error.data as ErrorResponse | undefined;
    errorMessage.value =
      errorData?.mensaje ||
      "No se pudo restablecer la contraseña. El enlace puede haber expirado.";
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
      class="w-full max-w-md backdrop-blur-md bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/50 dark:border-neutral-800/50 shadow-2xl rounded-2xl"
      :ui="{ body: 'p-6 sm:p-8' }"
    >
      <template #header>
        <div class="flex flex-col items-center text-center space-y-2">
          <div class="p-3 bg-primary/10 text-primary rounded-xl">
            <UIcon name="i-lucide-lock" class="size-6" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Restablecer Contraseña
          </h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Ingresa tu nueva contraseña.
          </p>
        </div>
      </template>

      <UAlert
        v-if="!token"
        color="warning"
        variant="soft"
        icon="i-lucide-alert-triangle"
        title="Enlace inválido"
        description="El enlace de recuperación no contiene un token válido. Solicita un nuevo restablecimiento de contraseña."
        class="mb-6"
      />

      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :description="errorMessage"
        class="mb-6"
      />

      <UAlert
        v-if="success"
        color="success"
        variant="soft"
        icon="i-lucide-check-circle"
        title="Contraseña restablecida"
        description="Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña."
        class="mb-6"
      />

      <UForm
        v-if="!success && token"
        :schema="schema"
        :state="state"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField name="password" label="Nueva contraseña" required>
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
            placeholder="Repite la contraseña"
            icon="i-lucide-check"
            class="w-full"
            autocomplete="new-password"
          />
        </UFormField>

        <UButton
          type="submit"
          label="Restablecer contraseña"
          color="primary"
          block
          class="font-semibold py-2.5"
          :loading="loading"
        />
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-neutral-500 dark:text-neutral-400">
          <ULink to="/login" class="text-primary font-semibold hover:underline">
            Volver al inicio de sesión
          </ULink>
        </p>
      </template>
    </UCard>
  </div>
</template>
