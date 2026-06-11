<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const loading = ref(false)
const toast = useToast()

const handleRecoverPassword = async () => {
  if (!email.value) return

  loading.value = true
  try {
    await $fetch('http://localhost:5132/api/auth/recover-password', {
      method: 'POST',
      body: { email: email.value }
    })
    
    toast.add({
      title: 'Enlace enviado',
      description: 'Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.',
      color: 'success'
    })
    
    // Opcional: limpiar el input tras el éxito
    email.value = ''
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Ocurrió un error al intentar enviar el enlace de recuperación. Inténtalo de nuevo.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col justify-between bg-neutral-50 dark:bg-neutral-950 font-sans">
    
    <!-- Contenido Central Centrado -->
    <main class="flex-1 flex flex-col items-center justify-center px-4 py-12 w-full max-w-7xl mx-auto">
      
      <!-- Encabezados Fuera de la Tarjeta -->
      <div class="text-center mb-8 flex flex-col items-center">
        <h1 class="text-xl md:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          FinTech Pro
        </h1>
        <h2 class="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white mt-4">
          Recupera tu acceso
        </h2>
        <p class="text-sm md:text-base text-neutral-500 dark:text-neutral-400 mt-2 max-w-sm mx-auto">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      <!-- Tarjeta del Formulario -->
      <UCard class="w-full max-w-md border border-neutral-200/80 dark:border-neutral-800 shadow-sm rounded-xl bg-white dark:bg-neutral-900/80">
        
        <UForm :state="{ email }" @submit="handleRecoverPassword" class="space-y-6">
          <UFormField label="Correo Electrónico" name="email">
            <UInput
              v-model="email"
              type="email"
              placeholder="tu@correo.com"
              icon="i-lucide-mail"
              size="lg"
              class="w-full font-medium"
              required
            />
          </UFormField>

          <UButton
            type="submit"
            color="neutral"
            variant="solid"
            size="lg"
            block
            class="rounded-lg shadow-md font-bold py-2.5 mt-2 bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            :loading="loading"
            trailing-icon="i-lucide-arrow-right"
          >
            Enviar enlace de recuperación
          </UButton>
        </UForm>

      </UCard>
    </main>

    <!-- Footer Inferior -->
    <footer class="w-full border-t border-neutral-200/60 dark:border-neutral-800/60 py-6 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400 gap-4">
      <div class="text-center md:text-left">
        © 2024 FinTech Pro. Institutional Stability & Digital Precision.
      </div>
      <div class="flex items-center justify-center gap-6">
        <a href="#" class="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Terms of Service</a>
        <a href="#" class="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Privacy Policy</a>
        <a href="#" class="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Security</a>
        <a href="#" class="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Support</a>
      </div>
    </footer>
  </div>
</template>
