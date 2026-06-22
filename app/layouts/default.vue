<script setup lang="ts">
import { ref, computed } from "vue";
import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui";

const authStore = useAuthStore();
const open = ref(true);
const colorMode = useColorMode();
const route = useRoute();

// Definición de links principales
function getItems(state: "collapsed" | "expanded") {
  const links = [
    {
      label: "Marketplace",
      icon: "i-lucide-arrow-right-left",
      to: "/marketplace",
    },
    {
      label: "Mis Ofertas",
      icon: "i-lucide-tag",
      to: "/my-offers",
    },
    {
      label: "Transacciones",
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
      }
    );
  }
  return links satisfies NavigationMenuItem[];
}

async function handleLogout() {
  authStore.logout();
  await navigateTo("/login");
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
  <div
    class="flex h-dvh overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50"
  >
    <!-- USidebar component from Nuxt UI v4 -->
    <USidebar
      v-model:open="open"
      collapsible="icon"
      rail
      :ui="{
        container: 'h-full',
        inner: 'bg-elevated/25 divide-transparent',
        body: 'py-0',
      }"
    >
      <!-- Slot #header: Brand logo -->
      <template #header>
        <div class="flex items-center gap-3 w-full overflow-hidden">
          <div class="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
            <UIcon name="i-lucide-arrow-right-left" class="size-6" />
          </div>
          <div class="min-w-0 flex-1" v-if="open">
            <span class="font-bold text-base tracking-tight text-neutral-900 dark:text-white block truncate">
              FinTech P2P
            </span>
            <span class="block text-[9px] text-primary font-bold uppercase tracking-wider leading-none mt-0.5">
              Intercambio
            </span>
          </div>
        </div>
      </template>

      <!-- Slot #default: Navigation Menu -->
      <template #default="{ state }">
        <UNavigationMenu
          :key="state"
          :items="getItems(state)"
          orientation="vertical"
          class="w-full"
          :ui="{ link: 'p-1.5 overflow-hidden' }"
        />
      </template>

      <!-- Slot #footer: User profile dropdown trigger -->
      <template #footer>
        <UDropdownMenu
          :items="userItems"
          :content="{ align: 'center', collisionPadding: 12 }"
          :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width) min-w-48' }"
          class="w-full"
        >
          <UButton
            :label="open ? (authStore.usuario?.nombres ? `${authStore.usuario.nombres} ${authStore.usuario.apellidos}` : 'Usuario') : undefined"
            trailing-icon="i-lucide-chevrons-up-down"
            color="neutral"
            variant="ghost"
            square
            class="w-full data-[state=open]:bg-elevated overflow-hidden cursor-pointer"
            :ui="{
              trailingIcon: 'text-dimmed ms-auto',
            }"
          >
            <template #leading>
              <UAvatar
                :src="authStore.avatarUrl || undefined"
                :alt="authStore.usuario?.nombres || '?'"
                :text="authStore.usuario?.nombres?.charAt(0).toUpperCase() || '?'"
                size="sm"
                class="bg-primary/10 text-primary font-bold shrink-0"
              />
            </template>
          </UButton>
        </UDropdownMenu>
      </template>
    </USidebar>

    <!-- Main Content Container: height full, overflow hidden, containing page inside scrollable main -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <!-- Navbar superior -->
      <header
        class="h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between shrink-0 sticky top-0 z-30"
      >
        <div class="flex items-center gap-3">
          <UButton
            icon="i-lucide-panel-left"
            color="neutral"
            variant="ghost"
            aria-label="Toggle sidebar"
            @click="open = !open"
            class="cursor-pointer"
          />
          <span class="text-sm font-bold text-neutral-300 dark:text-neutral-700">|</span>
          <UButton
            v-if="route.meta.back"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            @click="navigateTo(route.meta.back as string)"
          />
          <span v-if="route.meta.back" class="text-sm font-bold text-neutral-300 dark:text-neutral-700">/</span>
          <span class="font-bold text-base tracking-tight text-neutral-900 dark:text-white">
            {{ route.meta.title || 'FinTech P2P Intercambio' }}
          </span>
        </div>
      </header>

      <!-- Main Page Slot (This is the container that scrolls!) -->
      <main class="flex-1 overflow-y-auto min-w-0 bg-neutral-50 dark:bg-neutral-950">
        <slot />
      </main>
    </div>
  </div>
</template>
