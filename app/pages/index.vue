<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: [
    function () {
      const token = useCookie('auth_token')
      if (token.value) {
        return navigateTo('/marketplace')
      }
      return navigateTo('/login')
    }
  ]
})
</script>

<template>
  <div class="min-h-dvh grid place-items-center bg-linear-to-br from-neutral-100 via-neutral-50 to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary-950/20">
    <div class="text-center space-y-3">
      <UIcon name="i-lucide-loader-2" class="size-7 animate-spin text-primary mx-auto" />
      <p class="text-sm text-neutral-600 dark:text-neutral-300">Redirigiendo...</p>
    </div>
  </div>
</template>
