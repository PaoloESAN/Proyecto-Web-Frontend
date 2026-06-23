<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type {
  UserProfileResponse,
  MetodoPagoResponse,
  MetodoPagoCreateRequest,
  UpdateProfileResponse,
  VerifyIdentityResponse
} from '~/types'

definePageMeta({
  middleware: ['auth'],
  title: "Mi Perfil"
})

const toast = useToast()
const api = useApi()
const authStore = useAuthStore()

const profile = ref<UserProfileResponse | null>(null)
const metodosPago = ref<MetodoPagoResponse[]>([])
const loadingProfile = ref(true)
const loadingAccounts = ref(true)

async function fetchProfile() {
  loadingProfile.value = true
  try {
    profile.value = await api<UserProfileResponse>('/api/users/profile')
    profileState.nombres = profile.value.nombres
    profileState.apellidos = profile.value.apellidos
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo cargar el perfil', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    loadingProfile.value = false
  }
}

async function fetchMetodosPago() {
  loadingAccounts.value = true
  try {
    metodosPago.value = await api<MetodoPagoResponse[]>('/api/users/metodos-pago')
  } catch {
    toast.add({ title: 'Error', description: 'No se pudieron cargar las cuentas', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    loadingAccounts.value = false
  }
}

const editProfileModalOpen = ref(false)
const savingProfile = ref(false)

const profileSchema = z.object({
  nombres: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  apellidos: z.string().min(1, 'El apellido es requerido').max(100, 'Máximo 100 caracteres')
})

type ProfileSchema = z.output<typeof profileSchema>
const profileState = reactive<Partial<ProfileSchema>>({ nombres: '', apellidos: '' })

const fileInput = ref<HTMLInputElement | null>(null)
const tempAvatarUrl = ref<string | null>(null)
const selectedFile = ref<File | null>(null)

async function onSubmitProfile(event: FormSubmitEvent<ProfileSchema>) {
  savingProfile.value = true
  try {
    const formData = new FormData()
    formData.append('nombres', event.data.nombres)
    formData.append('apellidos', event.data.apellidos)
    if (selectedFile.value) {
      formData.append('fotoPerfil', selectedFile.value)
    }

    const res = await api<UpdateProfileResponse>('/api/users/profile', {
      method: 'PUT',
      body: formData
    })

    toast.add({ title: 'Perfil actualizado', color: 'success', icon: 'i-lucide-circle-check' })
    if (profile.value) {
      profile.value.nombres = res.usuario.nombres
      profile.value.apellidos = res.usuario.apellidos
      profile.value.fotoPerfilUrl = res.usuario.fotoPerfilUrl
    }
    if (authStore.usuario) {
      authStore.usuario.nombres = res.usuario.nombres
      authStore.usuario.apellidos = res.usuario.apellidos
      authStore.usuario.fotoPerfilUrl = res.usuario.fotoPerfilUrl
    }
    editProfileModalOpen.value = false
  } catch (error: any) {
    const errorMsg = error.data?.mensaje || error.data?.message || 'No se pudo actualizar el perfil'
    toast.add({ title: 'Error', description: errorMsg, color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    savingProfile.value = false
  }
}

function openEditProfile() {
  if (profile.value) {
    profileState.nombres = profile.value.nombres
    profileState.apellidos = profile.value.apellidos
  }
  tempAvatarUrl.value = authStore.avatarUrl
  selectedFile.value = null
  editProfileModalOpen.value = true
}

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files[0]

  const validTypes = ['image/jpeg', 'image/png']
  if (!validTypes.includes(file.type)) {
    toast.add({ title: 'Error', description: 'La imagen debe ser JPG o PNG', color: 'error', icon: 'i-lucide-alert-circle' })
    return
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    toast.add({ title: 'Error', description: 'La imagen debe pesar menos de 5MB', color: 'error', icon: 'i-lucide-alert-circle' })
    return
  }

  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    tempAvatarUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function removeTempAvatar() {
  tempAvatarUrl.value = null
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const accountModalOpen = ref(false)
const savingAccount = ref(false)
const deleteConfirmOpen = ref(false)
const deletingAccountId = ref<number | null>(null)
const deletingAccountLabel = ref('')
const editingAccountId = ref<number | null>(null)

const accountSchema = z.object({
  banco: z.string().min(1, 'El banco es requerido'),
  numeroCuenta: z.string().min(1, 'El número de cuenta es requerido'),
  nombreTitular: z.string().min(1, 'El nombre del titular es requerido'),
  tipoMoneda: z.string().min(1, 'Selecciona una moneda')
})

type AccountSchema = z.output<typeof accountSchema>
const accountState = reactive<Partial<AccountSchema>>({ banco: '', numeroCuenta: '', nombreTitular: '', tipoMoneda: 'USD' })

const monedas = [
  { label: 'USD - Dólar Estadounidense', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - Libra Esterlina', value: 'GBP' },
  { label: 'MXN - Peso Mexicano', value: 'MXN' },
  { label: 'PEN - Sol Peruano', value: 'PEN' },
]

function openAddAccount() {
  editingAccountId.value = null
  accountState.banco = ''
  accountState.numeroCuenta = ''
  accountState.nombreTitular = ''
  accountState.tipoMoneda = 'USD'
  accountModalOpen.value = true
}

function openEditAccount(cuenta: MetodoPagoResponse) {
  editingAccountId.value = cuenta.metodoPagoId
  accountState.banco = cuenta.banco
  accountState.numeroCuenta = cuenta.numeroCuenta
  accountState.nombreTitular = cuenta.nombreTitular
  accountState.tipoMoneda = cuenta.tipoMoneda
  accountModalOpen.value = true
}

async function onSubmitAccount(event: FormSubmitEvent<AccountSchema>) {
  savingAccount.value = true
  try {
    if (editingAccountId.value) {
      await api(`/api/users/metodos-pago/${editingAccountId.value}`, {
        method: 'PUT',
        body: event.data
      })
      toast.add({ title: 'Cuenta actualizada', color: 'success', icon: 'i-lucide-circle-check' })
    } else {
      await api('/api/users/metodos-pago', {
        method: 'POST',
        body: event.data
      })
      toast.add({ title: 'Cuenta agregada', color: 'success', icon: 'i-lucide-circle-check' })
    }
    accountModalOpen.value = false
    editingAccountId.value = null
    accountState.banco = ''
    accountState.numeroCuenta = ''
    accountState.nombreTitular = ''
    accountState.tipoMoneda = 'USD'
    await fetchMetodosPago()
  } catch {
    toast.add({
      title: 'Error',
      description: editingAccountId.value ? 'No se pudo actualizar la cuenta' : 'No se pudo agregar la cuenta',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    savingAccount.value = false
  }
}

function confirmDelete(cuenta: MetodoPagoResponse) {
  deletingAccountId.value = cuenta.metodoPagoId
  deletingAccountLabel.value = `${cuenta.banco} (${cuenta.numeroCuenta})`
  deleteConfirmOpen.value = true
}

async function executeDelete() {
  if (!deletingAccountId.value) return
  try {
    await api(`/api/users/metodos-pago/${deletingAccountId.value}`, { method: 'DELETE' })
    toast.add({ title: 'Cuenta eliminada', color: 'success', icon: 'i-lucide-circle-check' })
    deleteConfirmOpen.value = false
    deletingAccountId.value = null
    await fetchMetodosPago()
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo eliminar la cuenta', color: 'error', icon: 'i-lucide-alert-circle' })
  }
}

onMounted(() => {
  Promise.all([fetchProfile(), fetchMetodosPago()])
})
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
    <main class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div class="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
        <aside class="space-y-6">
          <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 flex flex-col items-center text-center shadow-sm space-y-4">
            <div class="flex items-center justify-center">
              <USkeleton v-if="loadingProfile" class="size-24 rounded-full" />
              <UAvatar
                v-else
                :src="authStore.avatarUrl || undefined"
                :alt="profile?.nombres ?? '?'"
                :text="profile?.nombres?.charAt(0).toUpperCase() ?? '?'"
                size="2xl"
                class="mx-auto"
              />
            </div>

            <div>
              <USkeleton v-if="loadingProfile" class="h-5 w-40 mb-1 mx-auto" />
              <h2 v-else class="text-lg font-bold text-highlighted">{{ profile?.nombres }} {{ profile?.apellidos }}</h2>

              <USkeleton v-if="loadingProfile" class="h-4 w-48 mb-1 mx-auto" />
              <p v-else class="text-sm text-muted">{{ profile?.correo }}</p>

              <USkeleton v-if="loadingProfile" class="h-4 w-32 mx-auto" />
              <div v-else class="flex items-center justify-center gap-1.5 text-xs text-amber-500 font-bold mt-1">
                <UIcon name="i-lucide-star" class="size-3.5 fill-amber-500" />
                <span>{{ profile?.calificacion?.toFixed(2) ?? '0.00' }} (Calificación)</span>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-muted uppercase tracking-wider">Estado</span>
              <UBadge v-if="profile?.esVerificado" color="success" variant="soft" size="sm">
                <template #leading>
                  <UIcon name="i-lucide-check-circle" class="size-3.5" />
                </template>
                Verificado
              </UBadge>
              <UBadge v-else color="warning" variant="soft" size="sm">
                <template #leading>
                  <UIcon name="i-lucide-help-circle" class="size-3.5" />
                </template>
                Pendiente
              </UBadge>
            </div>
            <UButton v-if="!profile?.esVerificado" label="Verificar identidad" color="primary" variant="soft" icon="i-lucide-id-card" block @click="navigateTo('/verify-identity')" class="cursor-pointer" />
          </div>

          <UButton label="Editar Perfil" color="neutral" variant="outline" icon="i-lucide-pencil" block @click="openEditProfile" class="cursor-pointer" />
        </aside>

        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-highlighted">Mis Cuentas Bancarias</h2>
            <UButton label="Agregar cuenta" color="primary" icon="i-lucide-plus" @click="openAddAccount" />
          </div>

          <div v-if="loadingAccounts" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <USkeleton v-for="i in 2" :key="i" class="h-32 rounded-xl" />
          </div>

          <template v-else-if="metodosPago.length > 0">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="cuenta in metodosPago" :key="cuenta.metodoPagoId" class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 flex flex-col justify-between h-full relative shadow-sm">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="size-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                      <UIcon name="i-lucide-landmark" class="size-5 text-neutral-500 dark:text-neutral-400" />
                    </div>
                    <div class="min-w-0">
                      <p class="font-semibold text-sm truncate text-neutral-900 dark:text-white">{{ cuenta.banco }}</p>
                      <p class="text-xs text-neutral-500 dark:text-neutral-400 truncate">{{ cuenta.nombreTitular }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" class="rounded-full cursor-pointer" @click="openEditAccount(cuenta)" />
                    <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" class="shrink-0 rounded-full cursor-pointer" @click="confirmDelete(cuenta)" />
                  </div>
                </div>
                <div class="flex items-center justify-between mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <span class="text-sm font-semibold text-neutral-900 dark:text-white break-all tracking-normal">{{ cuenta.numeroCuenta }}</span>
                  <UBadge color="neutral" variant="soft" size="sm" class="shrink-0 ml-2">{{ cuenta.tipoMoneda }}</UBadge>
                </div>
              </div>
            </div>
          </template>

          <div v-else class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 cursor-pointer hover:border-primary-500/50 hover:shadow-sm transition-all" @click="openAddAccount">
            <div class="flex flex-col items-center justify-center py-8 text-center">
              <div class="size-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                <UIcon name="i-lucide-plus" class="size-6 text-neutral-500 dark:text-neutral-400" />
              </div>
              <p class="text-sm font-medium text-neutral-900 dark:text-white">Vincular nueva cuenta</p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Aún no tienes cuentas bancarias vinculadas</p>
            </div>
          </div>
        </section>
      </div>
    </main>

    <UModal v-model:open="accountModalOpen" :title="editingAccountId ? 'Editar cuenta bancaria' : 'Agregar cuenta bancaria'" :description="editingAccountId ? 'Actualiza los datos de tu cuenta bancaria.' : 'Ingresa los datos de tu cuenta para recibir pagos.'">
      <template #body>
        <UForm id="account-form" :schema="accountSchema" :state="accountState" class="space-y-4" @submit="onSubmitAccount">
          <UFormField name="banco" label="Banco" required>
            <UInput v-model="accountState.banco" placeholder="Ej: Banco Santander" class="w-full" />
          </UFormField>
          <UFormField name="numeroCuenta" label="Número de cuenta" required>
            <UInput v-model="accountState.numeroCuenta" placeholder="Ej: 1234 5678 9012 3456" class="w-full" />
          </UFormField>
          <UFormField name="nombreTitular" label="Titular" required>
            <UInput v-model="accountState.nombreTitular" placeholder="Nombre del titular" class="w-full" />
          </UFormField>
          <UFormField name="tipoMoneda" label="Moneda" required>
            <USelect v-model="accountState.tipoMoneda" :items="monedas" class="w-full" />
          </UFormField>
        </UForm>
      </template>
      <template #footer="{ close }">
        <UButton label="Cancelar" color="neutral" variant="outline" @click="close" />
        <UButton type="submit" form="account-form" :label="editingAccountId ? 'Guardar cambios' : 'Guardar cuenta'" :loading="savingAccount" />
      </template>
    </UModal>

    <UModal v-model:open="deleteConfirmOpen" title="Eliminar cuenta" description="Esta acción no se puede deshacer. ¿Estás seguro de eliminar esta cuenta bancaria?">
      <template #body>
        <div class="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <UIcon name="i-lucide-alert-triangle" class="size-5 text-warning shrink-0" />
          <div>
            <p class="text-sm font-medium">Se eliminará:</p>
            <p class="text-sm text-muted">{{ deletingAccountLabel }}</p>
          </div>
        </div>
      </template>
      <template #footer="{ close }">
        <UButton label="Cancelar" color="neutral" variant="outline" @click="close" />
        <UButton label="Eliminar" color="error" icon="i-lucide-trash-2" @click="executeDelete" />
      </template>
    </UModal>

    <UModal v-model:open="editProfileModalOpen" title="Editar Perfil" description="Actualiza tus datos personales.">
      <template #body>
        <UForm id="edit-profile-form" :schema="profileSchema" :state="profileState" class="space-y-4" @submit="onSubmitProfile">
          <!-- Foto de Perfil Upload -->
          <div class="flex flex-col items-center gap-3 mb-4">
            <div class="relative group cursor-pointer" @click="triggerFileInput">
              <UAvatar
                :src="tempAvatarUrl || undefined"
                :alt="profileState.nombres || '?'"
                :text="profileState.nombres?.charAt(0).toUpperCase() || '?'"
                size="3xl"
                class="size-24 rounded-full border-2 border-neutral-200 dark:border-neutral-800"
              />
              <div class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <UIcon name="i-lucide-camera" class="size-6 text-white" />
              </div>
            </div>
            <div v-if="tempAvatarUrl" class="flex justify-center">
              <UButton
                type="button"
                label="Eliminar foto"
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                @click="removeTempAvatar"
              />
            </div>
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept="image/png, image/jpeg"
              @change="onFileChange"
            />
            <span class="text-[10px] text-neutral-400 dark:text-neutral-500">JPG o PNG, máx 5MB</span>
          </div>

          <UFormField name="nombres" label="Nombre(s)" required>
            <UInput v-model="profileState.nombres" class="w-full" />
          </UFormField>
          <UFormField name="apellidos" label="Apellido(s)" required>
            <UInput v-model="profileState.apellidos" class="w-full" />
          </UFormField>
        </UForm>
      </template>
      <template #footer="{ close }">
        <UButton label="Cancelar" color="neutral" variant="outline" @click="close" />
        <UButton type="submit" form="edit-profile-form" label="Guardar" :loading="savingProfile" />
      </template>
    </UModal>
  </div>
</template>
