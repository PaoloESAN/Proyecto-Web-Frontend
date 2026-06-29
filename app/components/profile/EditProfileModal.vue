<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

const props = defineProps<{
  initialNombres: string;
  initialApellidos: string;
  currentAvatarUrl: string | null;
  saving: boolean;
}>();

const emit = defineEmits<{
  (
    e: "submit",
    payload: { nombres: string; apellidos: string; file: File | null; removeAvatar: boolean }
  ): void;
}>();

const open = defineModel<boolean>("open", { required: true });

const profileSchema = z.object({
  nombres: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  apellidos: z
    .string()
    .min(1, "El apellido es requerido")
    .max(100, "Máximo 100 caracteres"),
});

type ProfileSchema = z.output<typeof profileSchema>;

const profileState = reactive<Partial<ProfileSchema>>({
  nombres: "",
  apellidos: "",
});

const fileInput = ref<HTMLInputElement | null>(null);
const tempAvatarUrl = ref<string | null>(null);
const selectedFile = ref<File | null>(null);
const removeAvatarFlag = ref(false);
const toast = useToast();

watch(
  () => open.value,
  (newVal) => {
    if (newVal) {
      profileState.nombres = props.initialNombres;
      profileState.apellidos = props.initialApellidos;
      tempAvatarUrl.value = props.currentAvatarUrl;
      selectedFile.value = null;
      removeAvatarFlag.value = false;
    }
  }
);

function triggerFileInput() {
  fileInput.value?.click();
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  if (!file) return;

  const validTypes = ["image/jpeg", "image/png"];
  if (!validTypes.includes(file.type)) {
    toast.add({
      title: "Error",
      description: "La imagen debe ser JPG o PNG",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
    return;
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    toast.add({
      title: "Error",
      description: "La imagen debe pesar menos de 5MB",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
    return;
  }

  selectedFile.value = file;
  removeAvatarFlag.value = false;
  const reader = new FileReader();
  reader.onload = (e) => {
    tempAvatarUrl.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

function removeTempAvatar() {
  tempAvatarUrl.value = null;
  selectedFile.value = null;
  removeAvatarFlag.value = true;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
}

function handleFormSubmit(event: FormSubmitEvent<ProfileSchema>) {
  emit("submit", {
    nombres: event.data.nombres,
    apellidos: event.data.apellidos,
    file: selectedFile.value,
    removeAvatar: removeAvatarFlag.value,
  });
}
</script>

<template>
  <UModal v-model:open="open" title="Editar Perfil" description="Actualiza tus datos personales.">
    <template #body>
      <UForm
        id="edit-profile-form"
        :schema="profileSchema"
        :state="profileState"
        class="space-y-4"
        @submit="handleFormSubmit"
      >
        <!-- Foto de Perfil Upload -->
        <div class="flex flex-col items-center gap-3 mb-4">
          <div class="relative group cursor-pointer" @click="triggerFileInput">
            <UAvatar
              :src="tempAvatarUrl || undefined"
              :alt="profileState.nombres || '?'"
              :text="profileState.nombres?.charAt(0).toUpperCase() || '?'"
              size="3xl"
              class="size-24 rounded-full border-2 border-neutral-200 dark:border-neutral-800"
            />
            <div
              class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <UIcon name="i-lucide-camera" class="size-6 text-white" />
            </div>
          </div>
          <div v-if="tempAvatarUrl" class="flex justify-center">
            <UButton
              type="button"
              label="Eliminar foto"
              size="xs"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              @click="removeTempAvatar"
            />
          </div>
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            accept="image/png, image/jpeg"
            @change="onFileChange"
          >
          <span class="text-[10px] text-neutral-400 dark:text-neutral-500">JPG o PNG, máx 5MB</span>
        </div>

        <UFormField name="nombres" label="Nombre(s)" required>
          <UInput v-model="profileState.nombres" class="w-full" />
        </UFormField>
        <UFormField name="apellidos" label="Apellido(s)" required>
          <UInput v-model="profileState.apellidos" class="w-full" />
        </UFormField>
      </UForm>
    </template>
    <template #footer="{ close }">
      <UButton label="Cancelar" color="neutral" variant="outline" @click="close" />
      <UButton type="submit" form="edit-profile-form" label="Guardar" :loading="props.saving" />
    </template>
  </UModal>
</template>
