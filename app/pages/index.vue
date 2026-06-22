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
  <div>Redirigiendo...</div>
</template>
