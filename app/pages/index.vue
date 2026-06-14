<script setup lang="ts">
definePageMeta({
  middleware: [
    function () {
      return navigateTo('/login')
    }
  ]
})
</script>

<template>
  <div>Redirigiendo...</div>
</template>
