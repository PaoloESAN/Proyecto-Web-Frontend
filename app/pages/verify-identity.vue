<script setup lang="ts">
import type { VerifyIdentityResponse } from "~/types";

definePageMeta({
  middleware: ["auth"],
  title: "Verificar Identidad",
  back: "/profile",
});

const toast = useToast();
const api = useApi();
const authStore = useAuthStore();

const uploading = ref(false);
const successMsg = ref<string | null>(null);

async function handleKycSubmit(payload: { dniFrontal: File; dniPosterior: File }) {
  uploading.value = true;
  successMsg.value = null;

  try {
    const formData = new FormData();
    formData.append("dniFrontal", payload.dniFrontal);
    formData.append("dniPosterior", payload.dniPosterior);

    const res = await api<VerifyIdentityResponse>("/api/users/verify-identity", {
      method: "POST",
      body: formData,
    });

    successMsg.value = res.mensaje;
    if (authStore.usuario) {
      authStore.usuario.esVerificado = true;
    }
    toast.add({
      title: "Identidad verificada",
      description: res.mensaje,
      color: "success",
      icon: "i-lucide-check-circle",
    });
  } catch (err) {
    const error = err as { data?: { mensaje?: string } };
    const errorData = error.data;
    toast.add({
      title: "Error al verificar",
      description: errorData?.mensaje || "No se pudo verificar la identidad.",
      color: "error",
    });
  } finally {
    uploading.value = false;
  }
}
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <VerifyIdentityUploadForm
        :uploading="uploading"
        :success-msg="successMsg"
        @submit="handleKycSubmit"
      />
    </main>
  </div>
</template>
