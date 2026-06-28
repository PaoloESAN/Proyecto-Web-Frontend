<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type { MessageResponse, ErrorResponse } from "~/types";

definePageMeta({
  layout: false,
});

const schema = z.object({
  correo: z.string().email("Ingresa un correo electrónico válido"),
});

type Schema = z.output<typeof schema>;

const state = reactive({ correo: "" });
const loading = ref(false);
const sent = ref(false);
const errorMessage = ref<string | null>(null);

const api = useApi();

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true;
  errorMessage.value = null;
  sent.value = false;

  try {
    await api<MessageResponse>("/api/auth/recover-password", {
      method: "POST",
      body: event.data,
    });
    sent.value = true;
  } catch (error) {
    const err = error as { data?: ErrorResponse };
    const errorData = err.data;
    errorMessage.value =
      errorData?.mensaje ||
      "No se pudo procesar la solicitud. Inténtalo de nuevo.";
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
      class="w-full max-w-xl backdrop-blur-md bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/50 dark:border-neutral-800/50 shadow-2xl rounded-2xl"
      :ui="{ body: 'p-6 sm:p-8' }"
    >
      <template #header>
        <div class="flex flex-col items-center text-center space-y-2">
          <div class="p-3 bg-primary/10 text-primary rounded-xl">
            <UIcon name="i-lucide-key-round" class="size-6" />
          </div>
          <h1 class="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Recuperar Contraseña
          </h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>
      </template>

      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :description="errorMessage"
        class="mb-6"
      />

      <UAlert
        v-if="sent"
        color="success"
        variant="soft"
        icon="i-lucide-check-circle"
        title="Correo enviado"
        description="Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."
        class="mb-6"
      />

      <UForm
        v-if="!sent"
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

        <UButton
          type="submit"
          label="Enviar enlace de recuperación"
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
