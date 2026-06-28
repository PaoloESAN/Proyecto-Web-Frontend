<script setup lang="ts">
import { ref, computed } from "vue";
import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui";

const authStore = useAuthStore();
const open = ref(true);
const colorMode = useColorMode();
const route = useRoute();
const router = useRouter();
// Definición de links principales
function getItems(_state: "collapsed" | "expanded") {
  const links = [
    {
      label: "Marketplace",
      icon: "i-lucide-arrow-right-left",
      to: "/marketplace",
    },
    {
      label: "Ofertas",
      icon: "i-lucide-tag",
      children: [
        {
          label: "Mis transacciones",
          icon: "i-lucide-inbox",
          to: "/my-transactions",
        },
        {
          label: "Mis ofertas",
          icon: "i-lucide-send",
          to: "/my-offers",
        },
      ],
    },
    {
      label: "Historial",
      icon: "i-lucide-history",
      to: "/history",
    },
  ];

  if (authStore.usuario?.rol === "Administrador") {
    links.push(
      {
        label: "Admin - Usuarios",
        icon: "i-lucide-users",
        to: "/admin/users",
      },
      {
        label: "Admin - Disputas",
        icon: "i-lucide-scale",
        to: "/admin/disputas",
      },
    );
  }
  return links satisfies NavigationMenuItem[];
}

async function handleLogout() {
  authStore.logout();
  await navigateTo("/login");
}

function handleBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back();
    return;
  }

  if (route.meta.back) {
    navigateTo(route.meta.back as string);
    return;
  }

  navigateTo("/marketplace");
}

// Menú desplegable del usuario
const userItems = computed<DropdownMenuItem[][]>(() => {
  const items: DropdownMenuItem[][] = [];

  const userActions: DropdownMenuItem[] = [
    {
      label: "Mi Perfil",
      icon: "i-lucide-user",
      to: "/profile",
    },
    {
      label: "Alertas",
      icon: "i-lucide-bell",
      to: "/alerts",
    },
  ];

  if (!authStore.usuario?.esVerificado) {
    userActions.push({
      label: "Verificar Identidad",
      icon: "i-lucide-shield-check",
      to: "/verify-identity",
    });
  }

  items.push(userActions);

  items.push([
    {
      label: "Apariencia",
      icon: "i-lucide-sun-moon",
      children: [
        {
          label: "Claro",
          icon: "i-lucide-sun",
          type: "checkbox",
          checked: colorMode.value === "light",
          onUpdateChecked(checked: boolean) {
            if (checked) {
              colorMode.preference = "light";
            }
          },
          onSelect(e: Event) {
            e.preventDefault();
          },
        },
        {
          label: "Oscuro",
          icon: "i-lucide-moon",
          type: "checkbox",
          checked: colorMode.value === "dark",
          onUpdateChecked(checked: boolean) {
            if (checked) {
              colorMode.preference = "dark";
            }
          },
          onSelect(e: Event) {
            e.preventDefault();
          },
        },
      ],
    },
  ]);

  items.push([
    {
      label: "Cerrar Sesión",
      icon: "i-lucide-log-out",
      onSelect() {
        handleLogout();
      },
    },
  ]);

  return items;
});
</script>

<template>
  <div class="flex h-dvh overflow-hidden bg-neutral-100/60 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
    <!-- USidebar component from Nuxt UI v4 -->
    <USidebar v-model:open="open" collapsible="icon" rail :ui="{
      container: 'h-full',
      inner: 'bg-elevated/55 backdrop-blur-sm divide-transparent border-r border-default/50',
      body: 'py-1',
    }">
      <!-- Slot #header: Brand logo -->
      <template #header>
        <div class="flex items-center gap-3 w-full overflow-hidden">
          <div
            class="size-10 rounded-xl border border-default bg-white dark:bg-neutral-900 shrink-0 p-1.5 flex items-center justify-center">
            <img src="/logo.svg" alt="interYa" class="size-full object-contain">
          </div>
          <div v-if="open" class="min-w-0 flex-1">
            <span
              class="text-base tracking-tight text-neutral-900 dark:text-white block truncate font-semibold font-[Inter,sans-serif]">
              inter<span class="text-primary">Ya</span>
            </span>
            <span class="block text-[9px] text-neutral-500 font-bold uppercase tracking-wider leading-none mt-0.5">
              Intercambio de divisas
            </span>
          </div>
        </div>
      </template>

      <!-- Slot #default: Navigation Menu -->
      <template #default="{ state }">
        <div class="h-full flex flex-col gap-4">
          <UNavigationMenu :key="state" :items="getItems(state)" orientation="vertical" class="w-full"
            :ui="{ link: 'p-1.5 overflow-hidden' }" />

          <div v-if="state === 'expanded'" class="mt-auto px-2 pb-2 space-y-3">
            <div class="rounded-xl border border-default bg-muted/40 p-3 space-y-2">
              <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
                Accesos rápidos
              </p>
              <UButton label="Crear oferta" icon="i-lucide-plus" color="primary" size="sm" block
                @click="navigateTo('/offers/new')" />
              <UButton label="Configurar alertas" icon="i-lucide-bell-ring" color="neutral" variant="outline" size="sm"
                block @click="navigateTo('/alerts')" />
            </div>

            <div class="rounded-xl border border-default bg-elevated/70 p-3">
              <p class="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                Tip rápido
              </p>
              <p class="text-xs text-toned leading-relaxed">
                Revisa moneda y banco antes de iniciar una transacción para evitar errores en el
                envío.
              </p>
            </div>
          </div>
        </div>
      </template>

      <!-- Slot #footer: User profile dropdown trigger -->
      <template #footer>
        <UDropdownMenu :items="userItems" :content="{ align: 'center', collisionPadding: 12 }"
          :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width) min-w-48' }" class="w-full">
          <UButton :label="open
            ? authStore.usuario?.nombres
              ? `${authStore.usuario.nombres} ${authStore.usuario.apellidos}`
              : 'Usuario'
            : undefined
            " trailing-icon="i-lucide-chevrons-up-down" color="neutral" variant="ghost" square
            class="w-full data-[state=open]:bg-elevated overflow-hidden cursor-pointer" :ui="{
              trailingIcon: 'text-dimmed ms-auto',
            }">
            <template #leading>
              <UAvatar :src="authStore.avatarUrl || undefined" :alt="authStore.usuario?.nombres || '?'"
                :text="authStore.usuario?.nombres?.charAt(0).toUpperCase() || '?'" size="sm"
                class="bg-primary/10 text-primary font-bold shrink-0" />
            </template>
          </UButton>
        </UDropdownMenu>
      </template>
    </USidebar>

    <!-- Main Content Container: height full, overflow hidden, containing page inside scrollable main -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <!-- Navbar superior -->
      <header
        class="h-16 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div class="flex items-center gap-3">
          <UButton icon="i-lucide-panel-left" color="neutral" variant="ghost" aria-label="Toggle sidebar"
            class="cursor-pointer" @click="open = !open" />
          <span class="text-sm font-bold text-neutral-300 dark:text-neutral-700">|</span>
          <UButton v-if="route.meta.back" icon="i-lucide-arrow-left" color="neutral" variant="ghost" aria-label="Volver"
            class="cursor-pointer" @click="handleBack" />
          <span v-if="route.meta.back" class="text-sm font-bold text-neutral-300 dark:text-neutral-700">/</span>
          <span class="font-bold text-base sm:text-lg tracking-tight text-neutral-900 dark:text-white">
            <template v-if="route.meta.title">{{ route.meta.title }}</template>
            <template v-else>
              <span class="font-semibold font-[Inter,sans-serif]">inter<span class="text-primary">Ya</span></span>
            </template>
          </span>
        </div>
      </header>

      <!-- Main Page Slot (This is the container that scrolls!) -->
      <main
        class="flex-1 overflow-y-auto min-w-0 bg-linear-to-b from-neutral-50 to-neutral-100/60 dark:from-neutral-950 dark:to-neutral-950">
        <slot />
      </main>
    </div>
  </div>
</template>
