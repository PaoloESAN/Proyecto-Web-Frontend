<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

const props = defineProps<{
  ratingSubmitted: boolean;
  submittingRating: boolean;
}>();

const emit = defineEmits<{
  (e: "submit", payload: { puntaje: number; comentario: string }): void;
}>();

const ratingState = reactive({
  puntaje: 5,
  comentario: "",
});

const ratingSchema = z.object({
  puntaje: z.number().min(1, "Selecciona al menos 1 estrella").max(5),
  comentario: z
    .string()
    .max(500, "El comentario no puede exceder los 500 caracteres")
    .optional(),
});

type RatingSchema = z.output<typeof ratingSchema>;

function handleFormSubmit(event: FormSubmitEvent<RatingSchema>) {
  emit("submit", {
    puntaje: event.data.puntaje,
    comentario: event.data.comentario || "",
  });
}
</script>

<template>
  <!-- Formulario de Calificación si no se ha enviado -->
  <div v-if="!props.ratingSubmitted" class="border-t border-neutral-100 dark:border-neutral-800 pt-6 space-y-4">
    <div class="space-y-1">
      <h3 class="text-base font-bold text-neutral-900 dark:text-white">
        Califica tu experiencia con la contraparte
      </h3>
      <p class="text-xs text-neutral-400">
        Tu opinión es muy importante para mantener una comunidad confiable y segura.
      </p>
    </div>

    <UForm :schema="ratingSchema" :state="ratingState" class="space-y-4" @submit="handleFormSubmit">
      <UFormField name="puntaje" label="Calificación (Estrellas)" required>
        <div class="flex items-center gap-1.5 mt-1">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            class="p-1 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            :class="star <= ratingState.puntaje ? 'text-amber-500' : 'text-neutral-300 dark:text-neutral-700'"
            @click="ratingState.puntaje = star"
          >
            <UIcon name="i-lucide-star" class="size-7 fill-current" />
          </button>
        </div>
      </UFormField>

      <UFormField name="comentario" label="Comentario u Opinión (Opcional)">
        <UInput
          v-model="ratingState.comentario"
          placeholder="Escribe un comentario breve sobre la rapidez, comunicación y amabilidad..."
          maxlength="500"
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        label="Enviar Calificación"
        color="primary"
        icon="i-lucide-star"
        class="font-bold py-2.5 cursor-pointer"
        :loading="props.submittingRating"
      />
    </UForm>
  </div>

  <!-- Calificación ya enviada -->
  <div
    v-else
    class="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl text-center text-sm text-neutral-500 border border-neutral-100 dark:border-neutral-800"
  >
    <UIcon name="i-lucide-heart" class="text-rose-500 mr-1 animate-pulse" />
    ¡Ya has calificado esta transacción! Gracias por tu colaboración.
  </div>
</template>
