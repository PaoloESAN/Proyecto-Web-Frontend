<script setup lang="ts">
const props = defineProps<{
  statusOptions: string[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: "search"): void;
}>();

const search = defineModel<string>("search", { required: true });
const estadoFilter = defineModel<string>("estado-filter", { required: true });
</script>

<template>
  <div class="p-5 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
    <div class="flex gap-3 items-center flex-1">
      <UInput
        v-model="search"
        placeholder="Buscar por nombre o correo..."
        icon="i-lucide-search"
        class="w-full sm:w-72"
        @keyup.enter="emit('search')"
      />
      <USelect v-model="estadoFilter" :items="props.statusOptions" class="w-40" />
    </div>
    <UButton
      label="Buscar"
      color="primary"
      class="cursor-pointer font-semibold"
      :loading="props.loading"
      @click="emit('search')"
    />
  </div>
</template>
