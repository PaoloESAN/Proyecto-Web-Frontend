<script setup lang="ts">
import { ref } from 'vue'

const toast = useToast()

const dniFrontalFile = ref<File | null>(null)
const dniPosteriorFile = ref<File | null>(null)

const frontalInput = ref<HTMLInputElement | null>(null)
const posteriorInput = ref<HTMLInputElement | null>(null)

const loading = ref(false)

const triggerFileInput = (type: 'frontal' | 'posterior') => {
  if (type === 'frontal' && frontalInput.value) {
    frontalInput.value.click()
  } else if (type === 'posterior' && posteriorInput.value) {
    posteriorInput.value.click()
  }
}

const handleFileChange = (type: 'frontal' | 'posterior', event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: 'Archivo demasiado grande',
      description: 'El archivo excede el límite de 5MB.',
      color: 'error'
    })
    target.value = ''
    return
  }

  if (type === 'frontal') {
    dniFrontalFile.value = file
  } else if (type === 'posterior') {
    dniPosteriorFile.value = file
  }
}

const handleSubmit = async () => {
  if (!dniFrontalFile.value || !dniPosteriorFile.value) {
    toast.add({
      title: 'Archivos requeridos',
      description: 'Por favor, selecciona tanto el DNI frontal como el reverso para continuar.',
      color: 'error'
    })
    return
  }

  loading.value = true

  try {
    const formData = new FormData()
    formData.append('dniFrontal', dniFrontalFile.value)
    formData.append('dniPosterior', dniPosteriorFile.value)

    await $fetch('http://localhost:5132/api/users/verify-identity', {
      method: 'POST',
      body: formData
    })

    toast.add({
      title: 'Identidad enviada',
      description: 'Tus documentos han sido recibidos para validación.',
      color: 'success'
    })

    dniFrontalFile.value = null
    dniPosteriorFile.value = null

  } catch (error) {
    toast.add({
      title: 'Error de envío',
      description: 'Ocurrió un problema al enviar los documentos. Inténtalo de nuevo.',
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
      
      <!-- Tarjeta del Formulario -->
      <UCard class="w-full max-w-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm rounded-xl bg-white dark:bg-neutral-900/80">
        
        <h1 class="text-2xl font-bold mb-2 text-center text-neutral-900 dark:text-white">
          Verificación de Identidad
        </h1>
        
        <p class="text-gray-500 text-sm text-center mb-8">
          Para garantizar la máxima seguridad institucional de sus activos, requerimos una validación de identidad estándar. Sus datos están encriptados de extremo a extremo.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- DNI FRONTAL -->
          <div>
            <h2 class="text-xs font-bold uppercase mb-2 text-neutral-700 dark:text-neutral-300">DNI FRONTAL</h2>
            <div 
              class="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-8 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              @click="triggerFileInput('frontal')"
            >
              <UIcon name="i-lucide-id-card" class="w-12 h-12 text-neutral-400 mb-4" />
              <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-1 text-center">Haz clic o arrastra tu imagen aquí</p>
              <p class="text-xs text-neutral-500 mb-6 text-center">(Max 5MB)</p>
              
              <UButton 
                color="primary" 
                variant="solid" 
                class="bg-neutral-200 text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600 font-medium"
                @click.stop="triggerFileInput('frontal')"
              >
                {{ dniFrontalFile ? dniFrontalFile.name : 'Seleccionar Archivo' }}
              </UButton>
              <input 
                type="file" 
                ref="frontalInput" 
                class="hidden" 
                accept="image/*" 
                @change="handleFileChange('frontal', $event)" 
              />
            </div>
          </div>

          <!-- DNI REVERSO -->
          <div>
            <h2 class="text-xs font-bold uppercase mb-2 text-neutral-700 dark:text-neutral-300">DNI REVERSO</h2>
            <div 
              class="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-8 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              @click="triggerFileInput('posterior')"
            >
              <UIcon name="i-lucide-credit-card" class="w-12 h-12 text-neutral-400 mb-4" />
              <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-1 text-center">Haz clic o arrastra tu imagen aquí</p>
              <p class="text-xs text-neutral-500 mb-6 text-center">(Max 5MB)</p>
              
              <UButton 
                color="primary" 
                variant="solid" 
                class="bg-neutral-200 text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600 font-medium"
                @click.stop="triggerFileInput('posterior')"
              >
                {{ dniPosteriorFile ? dniPosteriorFile.name : 'Seleccionar Archivo' }}
              </UButton>
              <input 
                type="file" 
                ref="posteriorInput" 
                class="hidden" 
                accept="image/*" 
                @change="handleFileChange('posterior', $event)" 
              />
            </div>
          </div>
        </div>

        <div class="mt-8 flex flex-col items-center">
          <UButton
            color="primary"
            variant="solid"
            size="lg"
            class="rounded-lg shadow-md font-bold py-2.5 px-8 bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            :loading="loading"
            @click="handleSubmit"
          >
            Enviar Documentos
          </UButton>
          
          <div class="flex items-center gap-1.5 mt-4 text-xs font-medium text-neutral-500">
            <UIcon name="i-lucide-lock" class="w-3.5 h-3.5" />
            <span>Conexión Segura SSL 256-bit</span>
          </div>
        </div>

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
