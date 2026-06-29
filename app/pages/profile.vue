<script setup lang="ts">
import type {
  UserProfileResponse,
  MetodoPagoResponse,
  UpdateProfileResponse,
  ErrorResponse,
} from "~/types";

definePageMeta({
  middleware: ["auth"],
  title: "Mi Perfil",
});

const toast = useToast();
const api = useApi();
const authStore = useAuthStore();

const profile = ref<UserProfileResponse | null>(null);
const metodosPago = ref<MetodoPagoResponse[]>([]);
const loadingProfile = ref(true);
const loadingAccounts = ref(true);

async function fetchProfile() {
  loadingProfile.value = true;
  try {
    profile.value = await api<UserProfileResponse>("/api/users/profile");
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudo cargar el perfil",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    loadingProfile.value = false;
  }
}

async function fetchMetodosPago() {
  loadingAccounts.value = true;
  try {
    metodosPago.value = await api<MetodoPagoResponse[]>(
      "/api/users/metodos-pago"
    );
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudieron cargar las cuentas",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    loadingAccounts.value = false;
  }
}

// Edit Profile Modal State
const editProfileModalOpen = ref(false);
const savingProfile = ref(false);

async function handleProfileSubmit(payload: {
  nombres: string;
  apellidos: string;
  file: File | null;
  removeAvatar: boolean;
}) {
  savingProfile.value = true;
  try {
    const formData = new FormData();
    formData.append("nombres", payload.nombres);
    formData.append("apellidos", payload.apellidos);
    if (payload.file) {
      formData.append("fotoPerfil", payload.file);
    }
    // Note: If removeAvatar is true, we should pass it or handle it. In the original code,
    // if removeAvatar is clicked, tempAvatarUrl is cleared. The original PUT endpoint
    // might expect a flag, or just update the profile. Wait, original profile PUT didn't
    // explicitly send a remove flag but we can support it if needed, or stick to what original did:
    // (original did not send remove flag to backend, but we want to make sure we don't break existing logic).
    // Original code:
    // async function onSubmitProfile(event: FormSubmitEvent<ProfileSchema>) { ...
    //   if (selectedFile.value) { formData.append("fotoPerfil", selectedFile.value); }
    // }
    // Wait, original had `removeTempAvatar()` that just cleared frontend state. If the user clears the
    // avatar, original did not send any delete file request or flag. Let's stick to original behavior!

    if (payload.file) {
      // payload file exists
    }

    const res = await api<UpdateProfileResponse>("/api/users/profile", {
      method: "PUT",
      body: formData,
    });

    toast.add({
      title: "Perfil actualizado",
      color: "success",
      icon: "i-lucide-circle-check",
    });

    if (profile.value) {
      profile.value.nombres = res.usuario.nombres;
      profile.value.apellidos = res.usuario.apellidos;
      profile.value.fotoPerfilUrl = res.usuario.fotoPerfilUrl;
    }
    if (authStore.usuario) {
      authStore.usuario.nombres = res.usuario.nombres;
      authStore.usuario.apellidos = res.usuario.apellidos;
      authStore.usuario.fotoPerfilUrl = res.usuario.fotoPerfilUrl;
    }
    editProfileModalOpen.value = false;
  } catch (error) {
    const err = error as { data?: ErrorResponse & { message?: string } };
    const errorMsg =
      err.data?.mensaje || err.data?.message || "No se pudo actualizar el perfil";
    toast.add({
      title: "Error",
      description: errorMsg,
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    savingProfile.value = false;
  }
}

// Payment Method Modal State
const accountModalOpen = ref(false);
const savingAccount = ref(false);
const editingAccountId = ref<number | null>(null);
const initialAccountData = ref<Partial<MetodoPagoResponse>>({});

function handleAddAccount() {
  editingAccountId.value = null;
  initialAccountData.value = {
    banco: "",
    numeroCuenta: "",
    nombreTitular: "",
    tipoMoneda: "USD",
  };
  accountModalOpen.value = true;
}

function handleEditAccount(cuenta: MetodoPagoResponse) {
  editingAccountId.value = cuenta.metodoPagoId;
  initialAccountData.value = { ...cuenta };
  accountModalOpen.value = true;
}

async function handleAccountSubmit(data: {
  banco: string;
  numeroCuenta: string;
  nombreTitular: string;
  tipoMoneda: string;
}) {
  savingAccount.value = true;
  try {
    if (editingAccountId.value) {
      await api(`/api/users/metodos-pago/${editingAccountId.value}`, {
        method: "PUT",
        body: data,
      });
      toast.add({
        title: "Cuenta actualizada",
        color: "success",
        icon: "i-lucide-circle-check",
      });
    } else {
      await api("/api/users/metodos-pago", {
        method: "POST",
        body: data,
      });
      toast.add({
        title: "Cuenta agregada",
        color: "success",
        icon: "i-lucide-circle-check",
      });
    }
    accountModalOpen.value = false;
    editingAccountId.value = null;
    await fetchMetodosPago();
  } catch {
    toast.add({
      title: "Error",
      description: editingAccountId.value
        ? "No se pudo actualizar la cuenta"
        : "No se pudo agregar la cuenta",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    savingAccount.value = false;
  }
}

// Delete Account Modal State
const deleteConfirmOpen = ref(false);
const deletingAccountId = ref<number | null>(null);
const deletingAccountLabel = ref("");

function handleDeleteAccount(cuenta: MetodoPagoResponse) {
  deletingAccountId.value = cuenta.metodoPagoId;
  deletingAccountLabel.value = `${cuenta.banco} (${cuenta.numeroCuenta})`;
  deleteConfirmOpen.value = true;
}

async function executeDelete() {
  if (!deletingAccountId.value) return;
  try {
    await api(`/api/users/metodos-pago/${deletingAccountId.value}`, {
      method: "DELETE",
    });
    toast.add({
      title: "Cuenta eliminada",
      color: "success",
      icon: "i-lucide-circle-check",
    });
    deleteConfirmOpen.value = false;
    deletingAccountId.value = null;
    await fetchMetodosPago();
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudo eliminar la cuenta",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  }
}

onMounted(() => {
  Promise.all([fetchProfile(), fetchMetodosPago()]);
});
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div class="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
        <ProfileInfoCard
          :profile="profile"
          :loading-profile="loadingProfile"
          :avatar-url="authStore.avatarUrl"
          @edit-profile="editProfileModalOpen = true"
        />

        <ProfilePaymentMethodsList
          :metodos-pago="metodosPago"
          :loading-accounts="loadingAccounts"
          @add-account="handleAddAccount"
          @edit-account="handleEditAccount"
          @delete-account="handleDeleteAccount"
        />
      </div>
    </main>

    <ProfileEditProfileModal
      v-model:open="editProfileModalOpen"
      :initial-nombres="profile?.nombres || ''"
      :initial-apellidos="profile?.apellidos || ''"
      :current-avatar-url="authStore.avatarUrl"
      :saving="savingProfile"
      @submit="handleProfileSubmit"
    />

    <ProfilePaymentMethodModal
      v-model:open="accountModalOpen"
      :editing-account-id="editingAccountId"
      :initial-data="initialAccountData"
      :saving="savingAccount"
      @submit="handleAccountSubmit"
    />

    <ProfileDeleteConfirmModal
      v-model:open="deleteConfirmOpen"
      :account-label="deletingAccountLabel"
      @confirm="executeDelete"
    />
  </div>
</template>
