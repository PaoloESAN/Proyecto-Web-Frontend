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

const toast = useToast()
const api = useApi()

const profile = ref<UserProfileResponse | null>(null)
const metodosPago = ref<MetodoPagoResponse[]>([])
const loadingProfile = ref(true)
const loadingAccounts = ref(true)

async function fetchProfile() {
  loadingProfile.value = true
  try {
    profile.value = await api<UserProfileResponse>('/api/users/profile')
    profileState.nombres = profile.value.nombres
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

const editingProfile = ref(false)
const savingProfile = ref(false)

const profileSchema = z.object({
  nombres: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres')
})

type ProfileSchema = z.output<typeof profileSchema>
const profileState = reactive<Partial<ProfileSchema>>({ nombres: '' })

async function onSubmitProfile(event: FormSubmitEvent<ProfileSchema>) {
  savingProfile.value = true
  try {
    const res = await api<UpdateProfileResponse>('/api/users/profile', {
      method: 'PUT',
      body: { nombres: event.data.nombres }
    })
    toast.add({ title: 'Perfil actualizado', color: 'success', icon: 'i-lucide-circle-check' })
    if (profile.value) {
      profile.value.nombres = res.usuario.nombres
    }
    editingProfile.value = false
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo actualizar el perfil', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    savingProfile.value = false
  }
}

function cancelEdit() {
  editingProfile.value = false
  if (profile.value) {
    profileState.nombres = profile.value.nombres
  }
}

const accountModalOpen = ref(false)
const savingAccount = ref(false)
const deleteConfirmOpen = ref(false)
const deletingAccountId = ref<number | null>(null)
const deletingAccountLabel = ref('')

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

async function onSubmitAccount(event: FormSubmitEvent<AccountSchema>) {
  savingAccount.value = true
  try {
    await api('/api/users/metodos-pago', {
      method: 'POST',
      body: event.data
    })
    toast.add({ title: 'Cuenta agregada', color: 'success', icon: 'i-lucide-circle-check' })
    accountModalOpen.value = false
    accountState.banco = ''
    accountState.numeroCuenta = ''
    accountState.nombreTitular = ''
    accountState.tipoMoneda = 'USD'
    await fetchMetodosPago()
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo agregar la cuenta', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    savingAccount.value = false
  }
}

function confirmDelete(cuenta: MetodoPagoResponse) {
  deletingAccountId.value = cuenta.metodoPagoId
  deletingAccountLabel.value = `${cuenta.banco} (**** ${cuenta.numeroCuenta.slice(-4)})`
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

const verifyModalOpen = ref(false)
const uploadingKyc = ref(false)

const kycSchema = z.object({
  dniFrontal: z.instanceof(File, { message: 'Debes seleccionar el DNI frontal' }),
  dniPosterior: z.instanceof(File, { message: 'Debes seleccionar el DNI posterior' })
})

type KycSchema = z.output<typeof kycSchema>
const kycState = reactive<Partial<KycSchema>>({})

async function onSubmitKyc(event: FormSubmitEvent<KycSchema>) {
  uploadingKyc.value = true
  try {
    const formData = new FormData()
    formData.append('dniFrontal', event.data.dniFrontal)
    formData.append('dniPosterior', event.data.dniPosterior)
    const res = await api<VerifyIdentityResponse>('/api/users/verify-identity', {
      method: 'POST',
      body: formData
    })
    toast.add({ title: 'Identidad verificada', description: res.mensaje, color: 'success', icon: 'i-lucide-circle-check' })
    verifyModalOpen.value = false
    profile.value!.esVerificado = true
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo verificar la identidad', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    uploadingKyc.value = false
  }
}

onMounted(() => {
  Promise.all([fetchProfile(), fetchMetodosPago()])
})
</script>

<template>
  <div class="min-h-dvh bg-default">
    <header class="sticky top-0 z-10 bg-elevated border-b border-default">
      <div class="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <h1 class="text-xl font-bold text-highlighted">Mi Perfil</h1>
        <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" label="Volver" @click="navigateTo('/debug')" />
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
        <aside class="space-y-6">
          <UCard :ui="{ body: 'flex flex-col items-center text-center' }">
            <template #header>
              <div class="flex items-center justify-center">
                <USkeleton v-if="loadingProfile" class="size-24 rounded-full" />
                <UAvatar v-else :alt="profile?.nombres ?? '?'" :text="profile?.nombres?.charAt(0).toUpperCase() ?? '?'" size="2xl" class="mx-auto" />
              </div>
            </template>

            <USkeleton v-if="loadingProfile" class="h-5 w-40 mb-1" />
            <h2 v-else class="text-lg font-bold text-highlighted">{{ profile?.nombres }}</h2>

            <USkeleton v-if="loadingProfile" class="h-4 w-48 mb-1" />
            <p v-else class="text-sm text-muted">{{ profile?.correo }}</p>

            <USkeleton v-if="loadingProfile" class="h-4 w-32 mx-auto" />
            <div v-else class="flex items-center justify-center gap-1.5 text-xs text-amber-500 font-bold mt-1">
              <UIcon name="i-lucide-star" class="size-3.5 fill-amber-500" />
              <span>{{ profile?.calificacion?.toFixed(2) ?? '0.00' }} (Calificación)</span>
            </div>
          </UCard>

          <UCard :ui="{ body: 'space-y-4' }">
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
            <UButton v-if="!profile?.esVerificado" label="Verificar identidad" color="primary" variant="soft" icon="i-lucide-id-card" block @click="verifyModalOpen = true" />
          </UCard>

          <UCard v-if="editingProfile">
            <template #header>
              <h3 class="font-semibold text-highlighted">Editar Perfil</h3>
            </template>
            <UForm :schema="profileSchema" :state="profileState" class="space-y-4" @submit="onSubmitProfile">
              <UFormField name="nombres" label="Nombre completo" required>
                <UInput v-model="profileState.nombres" class="w-full" />
              </UFormField>

              <div class="flex justify-end gap-3 pt-2">
                <UButton label="Cancelar" color="neutral" variant="outline" @click="cancelEdit" />
                <UButton type="submit" label="Guardar" color="primary" :loading="savingProfile" />
              </div>
            </UForm>
          </UCard>

          <UButton v-else label="Editar Perfil" color="neutral" variant="outline" icon="i-lucide-pencil" block @click="editingProfile = true" />
        </aside>

        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-highlighted">Mis Cuentas Bancarias</h2>
            <UButton label="Agregar cuenta" color="primary" icon="i-lucide-plus" @click="accountModalOpen = true" />
          </div>

          <div v-if="loadingAccounts" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <USkeleton v-for="i in 2" :key="i" class="h-32 rounded-xl" />
          </div>

          <template v-else-if="metodosPago.length > 0">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UCard v-for="cuenta in metodosPago" :key="cuenta.metodoPagoId" :ui="{ body: 'flex flex-col justify-between h-full', root: 'relative' }">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="size-10 rounded-full bg-accented flex items-center justify-center shrink-0">
                      <UIcon name="i-lucide-account-balance" class="size-5 text-muted" />
                    </div>
                    <div class="min-w-0">
                      <p class="font-semibold text-sm truncate">{{ cuenta.banco }}</p>
                      <p class="text-xs text-muted truncate">{{ cuenta.nombreTitular }}</p>
                    </div>
                  </div>
                  <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" class="shrink-0 rounded-full" @click="confirmDelete(cuenta)" />
                </div>
                <div class="flex items-center justify-between mt-auto">
                  <span class="text-lg font-bold tracking-widest text-highlighted">**** {{ cuenta.numeroCuenta.slice(-4) }}</span>
                  <UBadge color="neutral" variant="soft" size="sm">{{ cuenta.tipoMoneda }}</UBadge>
                </div>
              </UCard>
            </div>
          </template>

          <UCard v-else class="cursor-pointer" @click="accountModalOpen = true">
            <div class="flex flex-col items-center justify-center py-8 text-center">
              <div class="size-12 rounded-full bg-accented flex items-center justify-center mb-3">
                <UIcon name="i-lucide-plus" class="size-6 text-muted" />
              </div>
              <p class="text-sm font-medium">Vincular nueva cuenta</p>
              <p class="text-xs text-muted mt-1">Aún no tienes cuentas bancarias vinculadas</p>
            </div>
          </UCard>
        </section>
      </div>
    </main>

    <UModal v-model:open="accountModalOpen" title="Agregar cuenta bancaria" description="Ingresa los datos de tu cuenta para recibir pagos.">
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
        <UButton type="submit" form="account-form" label="Guardar cuenta" :loading="savingAccount" />
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

    <UModal v-model:open="verifyModalOpen" title="Verificar identidad" description="Sube las imágenes de tu DNI (anverso y reverso) para verificar tu identidad.">
      <template #body>
        <UForm id="kyc-form" :schema="kycSchema" :state="kycState" class="space-y-4" @submit="onSubmitKyc">
          <UFormField name="dniFrontal" label="DNI Frontal" required>
            <UFileUpload v-model="kycState.dniFrontal" accept="image/jpeg,image/png" :max-size="5 * 1024 * 1024" variant="area" />
          </UFormField>
          <UFormField name="dniPosterior" label="DNI Posterior" required>
            <UFileUpload v-model="kycState.dniPosterior" accept="image/jpeg,image/png" :max-size="5 * 1024 * 1024" variant="area" />
          </UFormField>
        </UForm>
      </template>
      <template #footer="{ close }">
        <UButton label="Cancelar" color="neutral" variant="outline" @click="close" />
        <UButton type="submit" form="kyc-form" label="Verificar" :loading="uploadingKyc" />
      </template>
    </UModal>
  </div>
</template>
