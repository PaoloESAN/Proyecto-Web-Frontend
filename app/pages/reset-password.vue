<script setup lang="ts">
import { ref } from 'vue'

const route = useRoute()
const toast = useToast()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

const handleResetPassword = async () => {
  // Validar que las contraseñas coincidan
  if (password.value !== confirmPassword.value) {
    toast.add({
      title: 'Error de validación',
      description: 'Las contraseñas no coinciden. Por favor, verifica e inténtalo de nuevo.',
      color: 'error'
    })
    return
  }

  // Validar que exista el token (opcional pero recomendado)
  const token = route.query.token
  if (!token) {
    toast.add({
      title: 'Token inválido',
      description: 'No se encontró un token válido en la URL para restablecer la contraseña.',
      color: 'error'
    })
    return
  }

  loading.value = true
  try {
    await $fetch('http://localhost:5132/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: token,
        password: password.value
      }
    })
    
    toast.add({
      title: 'Contraseña actualizada',
      description: 'Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión.',
      color: 'success'
    })
    
    // Opcional: limpiar los campos tras el éxito
    password.value = ''
    confirmPassword.value = ''
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'El servidor rechazó la solicitud o el token ha expirado. Inténtalo nuevamente.',
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
      
      <!-- Encabezados -->
      <div class="text-center mb-8 flex flex-col items-center">
        <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
          FinTech Pro
        </h1>
        <h2 class="text-lg md:text-xl font-semibold text-neutral-900 dark:text-white mb-2">
          Crea tu nueva contraseña
        </h2>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
          Ingresa una contraseña segura para restablecer tu acceso.
        </p>
      </div>

      <!-- Tarjeta del Formulario -->
      <UCard class="w-full max-w-md border border-neutral-200/80 dark:border-neutral-800 shadow-sm rounded-xl bg-white dark:bg-neutral-900/80">
        
        <UForm :state="{ password, confirmPassword }" @submit="handleResetPassword" class="space-y-6">
          
          <UFormField label="Nueva Contraseña" name="password">
            <UInput
              v-model="password"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              size="lg"
              class="w-full font-medium"
              required
            />
          </UFormField>

          <UFormField label="Confirmar Contraseña" name="confirmPassword">
            <UInput
              v-model="confirmPassword"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
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
          >
            Guardar nueva contraseña
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
