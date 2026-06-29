<script setup lang="ts">
import type { UserProfileResponse } from "~/types";

definePageMeta({
  layout: false,
});

const router = useRouter();
const authStore = useAuthStore();
const api = useApi();

const testTransactionId = ref("1");
const testOfferId = ref("1");
const profile = ref<UserProfileResponse | null>(null);
const loadingProfile = ref(false);

onMounted(async () => {
  if (authStore.isAuthenticated) {
    loadingProfile.value = true;
    try {
      profile.value = await api<UserProfileResponse>("/api/users/profile");
    } catch (err) {
      console.error(err);
    } finally {
      loadingProfile.value = false;
    }
  }
});

// Obtener todas las rutas de la aplicación desde Nuxt
const availableRoutes = computed(() => {
  return router
    .getRoutes()
    .filter((route) => route.path !== "/" && route.path !== "/debug")
    .map((route) => {
      const path = route.path;

      let linkPath = path;
      if (path.includes(":id")) {
        if (path.includes("transaction")) {
          linkPath = `/transaction/${testTransactionId.value}`;
        } else if (path.includes("offers")) {
          linkPath = `/offers/${testOfferId.value}`;
        }
      }

      return {
        path,
        linkPath,
        isDynamic: path.includes(":"),
        name: route.name ? String(route.name) : path,
      };
    });
});

async function handleLogout() {
  authStore.logout();
  await navigateTo("/login");
}

function handleNavigation(linkPath: string) {
  navigateTo(linkPath);
}
</script>

<template>
  <div class="min-h-dvh bg-linear-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-50 px-6 py-10">
    <div class="max-w-screen-2xl mx-auto space-y-8">
      <!-- Encabezado Principal -->
      <header class="flex flex-col sm:flex-row items-start sm:items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-md gap-4 justify-between">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-primary/10 text-primary rounded-xl">
            <UIcon name="i-lucide-terminal" class="size-8 animate-pulse" />
          </div>
          <div>
            <h1 class="text-2xl font-bold tracking-tight">Nexus Panel de Debug</h1>
          </div>
        </div>

        <div v-if="authStore.isAuthenticated" class="flex items-center gap-3">
          <UButton
            label="Cerrar Sesión"
            color="error"
            variant="soft"
            icon="i-lucide-log-out"
            size="md"
            class="font-semibold cursor-pointer"
            @click="handleLogout"
          />
        </div>
      </header>

      <DebugSessionCard
        :is-authenticated="authStore.isAuthenticated"
        :usuario="authStore.usuario"
        :avatar-url="authStore.avatarUrl"
        :profile="profile"
        :loading-profile="loadingProfile"
      />

      <!-- Panel de Administración -->
      <section v-if="authStore.isAdmin" class="bg-white dark:bg-neutral-900 border border-primary-200 dark:border-primary-800 rounded-2xl p-6 shadow-md space-y-4">
        <h2 class="text-lg font-bold flex items-center gap-2">
          <UIcon name="i-lucide-shield" class="text-primary size-5" />
          Panel de Administración
        </h2>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">Tienes permisos de administrador. Accede a las herramientas de gestión.</p>
        <div class="flex gap-3">
          <UButton label="Gestionar Usuarios" color="primary" icon="i-lucide-users" class="cursor-pointer" @click="navigateTo('/admin/users')" />
          <UButton label="Gestionar Disputas" color="error" variant="soft" icon="i-lucide-scale" class="cursor-pointer" @click="navigateTo('/admin/disputas')" />
        </div>
      </section>

      <DebugRoutesCard
        v-model:test-transaction-id="testTransactionId"
        v-model:test-offer-id="testOfferId"
        :available-routes="availableRoutes"
        @navigate="handleNavigation"
      />
    </div>
  </div>
</template>
