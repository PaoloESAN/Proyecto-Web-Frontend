<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    estado: string;
    showIcon?: boolean;
  }>(),
  {
    showIcon: true,
  }
);

const badgeColor = computed(() => {
  switch (props.estado) {
    case "Pendiente":
      return "warning";
    case "Pagado":
      return "info";
    case "Finalizado":
      return "success";
    case "Disputa":
      return "error";
    default:
      return "neutral";
  }
});

const badgeIcon = computed(() => {
  switch (props.estado) {
    case "Pendiente":
      return "i-lucide-clock";
    case "Pagado":
      return "i-lucide-wallet";
    case "Finalizado":
      return "i-lucide-check-circle-2";
    case "Disputa":
      return "i-lucide-alert-triangle";
    default:
      return "i-lucide-ban";
  }
});

const iconClass = computed(() => {
  if (props.estado === "Pendiente") return "animate-pulse";
  if (props.estado === "Disputa") return "animate-bounce";
  return "";
});
</script>

<template>
  <UBadge
    :color="badgeColor"
    variant="subtle"
    class="font-bold uppercase tracking-wider text-[10px]"
  >
    <UIcon
      v-if="props.showIcon"
      :name="badgeIcon"
      class="mr-1"
      :class="iconClass"
    />
    {{ props.estado }}
  </UBadge>
</template>
