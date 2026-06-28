<script setup lang="ts">
import type { VerifyIdentityResponse } from '~/types'

definePageMeta({
  middleware: ['auth'],
  title: "Verificar Identidad",
  back: "/profile"
})

const toast = useToast()
const api = useApi()
const authStore = useAuthStore()

const dniFrontalFile = ref<File | null>(null)
const dniPosteriorFile = ref<File | null>(null)
const dniFrontalPreview = ref<string | null>(null)
const dniPosteriorPreview = ref<string | null>(null)
const uploading = ref(false)
const successMsg = ref<string | null>(null)
const dniFrontalError = ref<string | null>(null)
const dniPosteriorError = ref<string | null>(null)

function validateFile(file: File): string | null {
  if (file.size > 5 * 1024 * 1024) {
    return 'El archivo debe pesar menos de 5MB.'
  }
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    return 'Solo se admiten imágenes en formato JPG o PNG.'
  }
  return null
}

function onDniFrontalSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files[0]
  if (!file) return

  const error = validateFile(file)
  if (error) {
    dniFrontalError.value = error
    dniFrontalFile.value = null
    dniFrontalPreview.value = null
    return
  }

  dniFrontalError.value = null
  dniFrontalFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => {
    dniFrontalPreview.value = ev.target?.result as string
  }
  reader.readAsDataURL(file)
}

function onDniPosteriorSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files[0]
  if (!file) return

  const error = validateFile(file)
  if (error) {
    dniPosteriorError.value = error
    dniPosteriorFile.value = null
    dniPosteriorPreview.value = null
    return
  }

  dniPosteriorError.value = null
  dniPosteriorFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => {
    dniPosteriorPreview.value = ev.target?.result as string
  }
  reader.readAsDataURL(file)
}

function removeFrontal() {
  dniFrontalFile.value = null
  dniFrontalPreview.value = null
  dniFrontalError.value = null
}

function removePosterior() {
  dniPosteriorFile.value = null
  dniPosteriorPreview.value = null
  dniPosteriorError.value = null
}

const canSubmit = computed(() => {
  return dniFrontalFile.value !== null && dniPosteriorFile.value !== null && !uploading.value
})

async function submitKyc() {
  if (!canSubmit.value) return
  uploading.value = true
  successMsg.value = null

  try {
    const formData = new FormData()
    formData.append('dniFrontal', dniFrontalFile.value!)
    formData.append('dniPosterior', dniPosteriorFile.value!)

    const res = await api<VerifyIdentityResponse>('/api/users/verify-identity', {
      method: 'POST',
      body: formData,
    })

    successMsg.value = res.mensaje
    if (authStore.usuario) {
      authStore.usuario.esVerificado = true
    }
    toast.add({
      title: 'Identidad verificada',
      description: res.mensaje,
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
  } catch (err) {
    const error = err as { data?: { mensaje?: string } }
    const errorData = error.data
    toast.add({
      title: 'Error al verificar',
      description: errorData?.mensaje || 'No se pudo verificar la identidad.',
      color: 'error',
    })
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div
    class="min-h-dvh bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50"
  >
    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 sm:p-8 shadow-sm space-y-8">
        <!-- Encabezado -->
        <div class="space-y-1">
          <h2 class="text-base font-bold text-neutral-900 dark:text-white">
            Sube las imágenes de tu DNI
          </h2>
          <p class="text-sm text-neutral-500">
            Para poder operar en la plataforma, debes verificar tu identidad
            adjuntando el anverso (frontal) y reverso (posterior) de tu
            documento de identidad. Las imágenes deben ser JPG o PNG y pesar
            menos de 5MB cada una.
          </p>
        </div>

        <!-- Mensaje de éxito -->
        <div
          v-if="successMsg"
          class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3"
        >
          <UIcon name="i-lucide-check-circle" class="text-emerald-500 size-5 shrink-0 mt-0.5" />
          <div>
            <h3 class="text-sm font-bold text-emerald-800 dark:text-emerald-400">
              Identidad verificada exitosamente
            </h3>
            <p class="text-xs text-emerald-700/90 dark:text-emerald-400/90 mt-1">
              {{ successMsg }}
            </p>
          </div>
        </div>

        <!-- DNI Frontal -->
        <div class="space-y-3">
          <label class="text-sm font-bold text-neutral-900 dark:text-white block">
            DNI Frontal (Anverso)
          </label>

          <div
            v-if="!dniFrontalPreview"
            class="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl p-6 text-center hover:border-primary/50 transition-colors relative"
          >
            <input
              type="file"
              accept="image/jpeg,image/png"
              class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              @change="onDniFrontalSelected"
            >
            <div class="space-y-1">
              <UIcon name="i-lucide-id-card" class="size-8 text-neutral-400 mx-auto" />
              <p class="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                Selecciona la imagen frontal del DNI
              </p>
              <p class="text-[10px] text-neutral-400">JPG o PNG · Máx 5MB</p>
            </div>
          </div>

          <div
            v-else
            class="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-3"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold truncate text-neutral-700 dark:text-neutral-300">
                {{ dniFrontalFile?.name }}
              </span>
              <UButton icon="i-lucide-trash" color="error" variant="ghost" size="xs" @click="removeFrontal" />
            </div>
            <div class="aspect-video w-full max-h-48 rounded-lg overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center">
              <img :src="dniFrontalPreview" alt="Vista previa DNI Frontal" class="max-h-full object-contain" >
            </div>
          </div>

          <p v-if="dniFrontalError" class="text-xs text-red-500 font-medium flex items-center gap-1">
            <UIcon name="i-lucide-alert-circle" class="size-3.5" />
            {{ dniFrontalError }}
          </p>
        </div>

        <!-- DNI Posterior -->
        <div class="space-y-3">
          <label class="text-sm font-bold text-neutral-900 dark:text-white block">
            DNI Posterior (Reverso)
          </label>

          <div
            v-if="!dniPosteriorPreview"
            class="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl p-6 text-center hover:border-primary/50 transition-colors relative"
          >
            <input
              type="file"
              accept="image/jpeg,image/png"
              class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              @change="onDniPosteriorSelected"
            >
            <div class="space-y-1">
              <UIcon name="i-lucide-id-card" class="size-8 text-neutral-400 mx-auto" />
              <p class="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                Selecciona la imagen posterior del DNI
              </p>
              <p class="text-[10px] text-neutral-400">JPG o PNG · Máx 5MB</p>
            </div>
          </div>

          <div
            v-else
            class="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-3"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold truncate text-neutral-700 dark:text-neutral-300">
                {{ dniPosteriorFile?.name }}
              </span>
              <UButton icon="i-lucide-trash" color="error" variant="ghost" size="xs" @click="removePosterior" />
            </div>
            <div class="aspect-video w-full max-h-48 rounded-lg overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center">
              <img :src="dniPosteriorPreview" alt="Vista previa DNI Posterior" class="max-h-full object-contain" >
            </div>
          </div>

          <p v-if="dniPosteriorError" class="text-xs text-red-500 font-medium flex items-center gap-1">
            <UIcon name="i-lucide-alert-circle" class="size-3.5" />
            {{ dniPosteriorError }}
          </p>
        </div>

        <!-- Botón Enviar -->
        <UButton
          label="Enviar y Verificar Identidad"
          color="primary"
          size="lg"
          class="w-full font-bold justify-center py-3"
          icon="i-lucide-check-circle"
          :disabled="!canSubmit"
          :loading="uploading"
          @click="submitKyc"
        />
      </div>
    </main>
  </div>
</template>
