<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
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
</script>

<template>
  <div
    class="min-h-dvh bg-linear-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-50 px-4 py-8"
  >
    <div class="max-w-6xl mx-auto space-y-8">
      <!-- Encabezado Principal -->
      <header
        class="flex flex-col sm:flex-row items-start sm:items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-md gap-4 justify-between"
      >
        <!-- Izquierda: Título -->
        <div class="flex items-center gap-4">
          <div class="p-3 bg-primary/10 text-primary rounded-xl">
            <UIcon name="i-lucide-terminal" class="size-8 animate-pulse" />
          </div>
          <div>
            <h1 class="text-2xl font-bold tracking-tight">
              Nexus Panel de Debug
            </h1>
          </div>
        </div>



        <!-- Derecha: Botón de Cerrar Sesión -->
        <div v-if="authStore.isAuthenticated" class="flex items-center gap-3">
          <UButton
            label="Cerrar Sesión"
            color="error"
            variant="soft"
            icon="i-lucide-log-out"
            size="md"
            class="font-semibold"
            @click="handleLogout"
          />
        </div>
      </header>

      <!-- Detalles del Usuario Logueado (Sesión) -->
      <section class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-md space-y-4">
        <h2 class="text-lg font-bold flex items-center gap-2">
          <UIcon name="i-lucide-user-check" class="text-primary size-5" />
          Detalles de la Sesión de Usuario
        </h2>
        
        <div v-if="authStore.isAuthenticated && authStore.usuario" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div class="space-y-1">
            <span class="text-xs text-neutral-500 dark:text-neutral-400 font-semibold block uppercase tracking-wider">Nombre Completo</span>
            <span class="text-base font-bold text-neutral-900 dark:text-white">
              {{ authStore.usuario.nombres }} {{ authStore.usuario.apellidos }}
            </span>
          </div>

          <div class="space-y-1">
            <span class="text-xs text-neutral-500 dark:text-neutral-400 font-semibold block uppercase tracking-wider">Correo Electrónico</span>
            <span class="text-base font-medium text-neutral-900 dark:text-white">
              {{ authStore.usuario.correo }}
            </span>
          </div>

          <div class="space-y-1">
            <span class="text-xs text-neutral-500 dark:text-neutral-400 font-semibold block uppercase tracking-wider">ID de Usuario</span>
            <span class="text-base font-mono font-bold text-neutral-900 dark:text-white">
              {{ authStore.usuario.usuarioId }}
            </span>
          </div>

          <div class="space-y-1">
            <span class="text-xs text-neutral-500 dark:text-neutral-400 font-semibold block uppercase tracking-wider">Rol en Plataforma</span>
            <div>
              <span class="inline-block text-xs px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold uppercase tracking-wider">
                {{ authStore.usuario.rol }}
              </span>
            </div>
          </div>

          <div class="space-y-1">
            <span class="text-xs text-neutral-500 dark:text-neutral-400 font-semibold block uppercase tracking-wider">Estado de Verificación</span>
            <div>
              <span 
                v-if="authStore.usuario.esVerificado"
                class="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold"
              >
                <UIcon name="i-lucide-check-circle-2" class="size-3.5 animate-pulse" />
                Verificado (DNI aprobado)
              </span>
              <span 
                v-else
                class="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-bold"
              >
                <UIcon name="i-lucide-help-circle" class="size-3.5" />
                Pendiente de Verificación
              </span>
            </div>
          </div>

          <div class="space-y-1">
            <span class="text-xs text-neutral-500 dark:text-neutral-400 font-semibold block uppercase tracking-wider">Calificación</span>
            <div>
              <USkeleton v-if="loadingProfile" class="h-6 w-24 rounded-full" />
              <div 
                v-else-if="profile"
                class="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold"
              >
                <UIcon name="i-lucide-star" class="size-3.5 fill-amber-500" />
                <span>{{ profile.calificacion?.toFixed(2) ?? '0.00' }} (Calificación)</span>
              </div>
              <span v-else class="text-sm font-medium text-neutral-500 dark:text-neutral-400">-</span>
            </div>
          </div>

        </div>
        
        <div v-else class="text-center py-6 text-neutral-500 dark:text-neutral-400 text-sm">
          <UIcon name="i-lucide-user-x" class="size-10 mx-auto text-neutral-400 mb-2" />
          No hay ninguna sesión de usuario activa actualmente. Por favor, inicia sesión.
        </div>
      </section>

      <!-- Panel de Administración -->
      <section v-if="authStore.isAdmin" class="bg-white dark:bg-neutral-900 border border-primary-200 dark:border-primary-800 rounded-2xl p-6 shadow-md space-y-4">
        <h2 class="text-lg font-bold flex items-center gap-2">
          <UIcon name="i-lucide-shield" class="text-primary size-5" />
          Panel de Administración
        </h2>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">Tienes permisos de administrador. Accede a las herramientas de gestión.</p>
        <div class="flex gap-3">
          <UButton label="Gestionar Usuarios" color="primary" icon="i-lucide-users" @click="navigateTo('/admin/users')" />
          <UButton label="Gestionar Disputas" color="error" variant="soft" icon="i-lucide-scale" @click="navigateTo('/admin/disputas')" />
        </div>
      </section>

      <!-- Configurador de Parámetros de Prueba -->
      <section
        class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-md space-y-4"
      >
        <h2 class="text-lg font-bold flex items-center gap-2">
          <UIcon
            name="i-lucide-sliders-horizontal"
            class="text-primary size-5"
          />
          Configuración de Rutas Dinámicas (Simulación de IDs)
        </h2>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">
          Modifica estos valores para cambiar el ID de destino al hacer clic en
          las rutas dinámicas como `/transaction/:id` o `/offers/:id`.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="ID de Transacción de prueba">
            <UInput
              v-model="testTransactionId"
              type="text"
              placeholder="1, 12, 100, etc."
              class="w-full"
              icon="i-lucide-message-square"
            />
          </UFormField>
          <UFormField label="ID de Oferta de prueba">
            <UInput
              v-model="testOfferId"
              type="text"
              placeholder="1, 5, 23, etc."
              class="w-full"
              icon="i-lucide-tag"
            />
          </UFormField>
        </div>
      </section>

      <!-- Listado de Rutas Detectadas -->
      <section class="space-y-4">
        <h2 class="text-xl font-bold flex items-center gap-2 px-1">
          <UIcon name="i-lucide-compass" class="text-primary size-6" />
          Páginas Registradas en la App ({{ availableRoutes.length }})
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <UCard
            v-for="route in availableRoutes"
            :key="route.path"
            class="cursor-pointer bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1.5 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-2xl hover:shadow-primary-500/10 hover:ring-1 hover:ring-primary-500/20"
            :ui="{ body: 'p-5' }"
            @click="navigateTo(route.linkPath)"
          >
            <div class="flex flex-col space-y-3">
              <!-- Ruta en Grande -->
              <span
                class="text-xl font-bold tracking-tight text-neutral-900 dark:text-white truncate"
              >
                {{ route.path }}
              </span>

              <!-- Meta y Badge -->
              <div
                class="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800"
              >
                <span
                  class="font-mono text-[10px] truncate max-w-40"
                  :title="route.name"
                >
                  {{ route.name }}
                </span>

                <span
                  v-if="route.isDynamic"
                  class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                >
                  Dinámica
                </span>
                <span
                  v-else
                  class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20"
                >
                  Estática
                </span>
              </div>
            </div>
          </UCard>
        </div>
      </section>
    </div>
  </div>
</template>
