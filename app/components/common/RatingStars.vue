<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    rating: number;
    size?: "sm" | "md";
  }>(),
  {
    size: "sm",
  }
);
</script>

<template>
  <div
    class="flex items-center text-amber-500 font-extrabold bg-amber-500/10 rounded-full shrink-0 w-fit"
    :class="[
      props.size === 'sm' ? 'gap-1 text-xs px-2 py-0.5' : 'gap-1.5 text-sm px-3 py-1'
    ]"
  >
    <UIcon name="i-lucide-star" class="fill-amber-500" :class="[props.size === 'sm' ? 'size-3.5' : 'size-4']" />
    <span>{{ Number(props.rating ?? 0).toFixed(2) }}</span>
  </div>
</template>
