<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

const colorMode = useColorMode()
const toast = useToast()

interface Profile {
  nombres: string
  telefono: string
  email: string
}
interface MetodoPago {
  id: number
  banco: string
  numeroCuenta: string
  nombreTitular: string
  tipoMoneda: string
}

const profile = ref<Profile>({ nombres: '', telefono: '', email: '' })
const metodosPago = ref<MetodoPago[]>([])
const loadingProfile = ref(true)
const loadingAccounts = ref(true)
const editingProfile = ref(false)

const API_BASE = 'http://localhost:5132/api'

async function fetchProfile() {
  loadingProfile.value = true
  try {
    const data = await $fetch<Profile>(`${API_BASE}/users/profile`)
    profile.value = data
    profileState.nombres = data.nombres
    profileState.telefono = data.telefono
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo cargar el perfil', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    loadingProfile.value = false
  }
}

async function fetchMetodosPago() {
  loadingAccounts.value = true
  try {
    const data = await $fetch<MetodoPago[]>(`${API_BASE}/users/metodos-pago`)
    metodosPago.value = data
  } catch {
    toast.add({ title: 'Error', description: 'No se pudieron cargar las cuentas', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    loadingAccounts.value = false
  }
}

const savingProfile = ref(false)
const profileState = reactive({ nombres: '', telefono: '' })

function validateProfile(state: { nombres: string; telefono: string }): FormError[] {
  const errors: FormError[] = []
  if (!state.nombres) errors.push({ name: 'nombres', message: 'El nombre es requerido' })
  if (!state.telefono) errors.push({ name: 'telefono', message: 'El teléfono es requerido' })
  return errors
}

async function onSubmitProfile(event: FormSubmitEvent<{ nombres: string; telefono: string }>) {
  savingProfile.value = true
  try {
    await $fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      body: { nombres: event.data.nombres, telefono: event.data.telefono }
    })
    toast.add({ title: 'Perfil actualizado', color: 'success', icon: 'i-lucide-circle-check' })
    profile.value.nombres = event.data.nombres
    profile.value.telefono = event.data.telefono
    editingProfile.value = false
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo actualizar el perfil', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    savingProfile.value = false
  }
}

const modalOpen = ref(false)
const savingAccount = ref(false)
const accountState = reactive({ banco: '', numeroCuenta: '', nombreTitular: '', tipoMoneda: 'USD' })

const monedas = [
  { label: 'USD - Dólar Estadounidense', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - Libra Esterlina', value: 'GBP' },
  { label: 'MXN - Peso Mexicano', value: 'MXN' },
  { label: 'PEN - Sol Peruano', value: 'PEN' },
]

function validateAccount(state: { banco: string; numeroCuenta: string; nombreTitular: string }): FormError[] {
  const errors: FormError[] = []
  if (!state.banco) errors.push({ name: 'banco', message: 'El banco es requerido' })
  if (!state.numeroCuenta) errors.push({ name: 'numeroCuenta', message: 'El número de cuenta es requerido' })
  if (!state.nombreTitular) errors.push({ name: 'nombreTitular', message: 'El nombre del titular es requerido' })
  return errors
}

async function onSubmitAccount(event: FormSubmitEvent<{ banco: string; numeroCuenta: string; nombreTitular: string; tipoMoneda: string }>) {
  savingAccount.value = true
  try {
    await $fetch(`${API_BASE}/users/metodos-pago`, {
      method: 'POST',
      body: {
        banco: event.data.banco,
        numeroCuenta: event.data.numeroCuenta,
        nombreTitular: event.data.nombreTitular,
        tipoMoneda: event.data.tipoMoneda
      }
    })
    toast.add({ title: 'Cuenta agregada', color: 'success', icon: 'i-lucide-circle-check' })
    modalOpen.value = false
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

async function deleteAccount(id: number) {
  try {
    await $fetch(`${API_BASE}/users/metodos-pago/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Cuenta eliminada', color: 'success', icon: 'i-lucide-circle-check' })
    await fetchMetodosPago()
  } catch {
    toast.add({ title: 'Error', description: 'No se pudo eliminar la cuenta', color: 'error', icon: 'i-lucide-alert-circle' })
  }
}

onMounted(() => {
  Promise.all([fetchProfile(), fetchMetodosPago()])
})

function cancelEdit() {
  editingProfile.value = false
  profileState.nombres = profile.value.nombres
  profileState.telefono = profile.value.telefono
}
</script>

<template>
  <div class="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans">
    <nav class="h-[70px] bg-white border-b border-[#d9d9d9] flex items-center justify-between px-10">
      <div class="text-[32px] font-bold tracking-tight">FinTech Pro</div>
      <div class="flex items-center gap-10">
        <span class="text-sm font-medium text-[#8c8c8c] cursor-pointer hover:text-[#1a1a1a]">Dashboard</span>
        <span class="text-sm font-medium text-[#8c8c8c] cursor-pointer hover:text-[#1a1a1a]">Transactions</span>
        <span class="text-sm font-medium text-[#1a1a1a] cursor-pointer border-b-2 border-[#1a1a1a] pb-0.5">Profile</span>
      </div>
      <span class="text-sm font-medium text-[#8c8c8c] cursor-pointer hover:text-[#1a1a1a]">Sign In</span>
    </nav>

    <main class="max-w-6xl mx-auto px-10 py-8">
      <div class="flex gap-8">
        <div class="w-[360px] shrink-0 space-y-6">
          <div class="bg-white rounded-xl border border-[#d9d9d9] p-6 flex flex-col items-center">
            <USkeleton v-if="loadingProfile" class="w-[120px] h-[120px] rounded-full mb-4" />
            <div v-else class="w-[120px] h-[120px] rounded-full bg-[#e8e8e8] flex items-center justify-center text-4xl font-bold text-[#8c8c8c] mb-4">
              {{ profile.nombres ? profile.nombres.charAt(0).toUpperCase() : '?' }}
            </div>
            <USkeleton v-if="loadingProfile" class="h-6 w-40 mb-1" />
            <h2 v-else class="text-xl font-bold text-center">{{ profile.nombres }}</h2>
            <USkeleton v-if="loadingProfile" class="h-4 w-48 mb-1" />
            <p v-else class="text-sm text-[#8c8c8c] text-center">{{ profile.email }}</p>
            <USkeleton v-if="loadingProfile" class="h-4 w-32 mb-4" />
            <p v-else class="text-sm text-[#8c8c8c] text-center mb-4">{{ profile.telefono }}</p>
            <UButton
              label="Editar Perfil"
              color="neutral"
              variant="outline"
              block
              class="rounded-lg justify-center"
              @click="editingProfile = !editingProfile"
            />
          </div>

          <div class="bg-white rounded-xl border border-[#d9d9d9] p-5">
            <p class="text-xs font-semibold text-[#8c8c8c] tracking-widest uppercase mb-3">Account Status</p>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Verification</span>
              <span class="inline-flex items-center gap-1 text-xs font-semibold text-[#389e0d] bg-[#f6ffed] px-3 py-1 rounded-full border border-[#b7eb8f]">
                <UIcon name="i-lucide-check" class="size-3" />
                Verified
              </span>
            </div>
          </div>
        </div>

        <div class="flex-1 space-y-6">
          <div v-if="editingProfile" class="bg-white rounded-xl border border-[#d9d9d9] p-6">
            <h3 class="text-lg font-bold mb-4">Editar Perfil</h3>
            <UForm :state="profileState" :validate="validateProfile" class="space-y-4" @submit="onSubmitProfile">
              <UFormField label="Nombre completo" name="nombres" required>
                <UInput v-model="profileState.nombres" class="w-full" />
              </UFormField>
              <UFormField label="Teléfono" name="telefono" required>
                <UInput v-model="profileState.telefono" class="w-full" />
              </UFormField>
              <div class="flex justify-end gap-3 pt-2">
                <UButton label="Cancelar" color="neutral" variant="outline" @click="cancelEdit" />
                <UButton type="submit" label="Guardar" color="primary" :loading="savingProfile" :disabled="savingProfile" />
              </div>
            </UForm>
          </div>

          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold">Mis Cuentas Bancarias</h1>
            <UButton label="+ Agregar cuenta bancaria" color="neutral" class="rounded-lg text-white bg-[#1a1a1a] hover:bg-[#333]" @click="modalOpen = true" />
          </div>

          <div v-if="loadingAccounts" class="grid grid-cols-2 gap-4">
            <USkeleton v-for="i in 2" :key="i" class="h-[130px] rounded-xl" />
          </div>

          <template v-else-if="metodosPago.length > 0">
            <div class="grid grid-cols-2 gap-4">
              <div v-for="cuenta in metodosPago" :key="cuenta.id" class="bg-white rounded-xl border border-[#d9d9d9] p-5 h-[130px] flex flex-col justify-between relative group">
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-[#f0f0f0] flex items-center justify-center">
                      <UIcon name="i-lucide-account-balance" class="size-5 text-[#555]" />
                    </div>
                    <div>
                      <p class="font-semibold text-sm">{{ cuenta.banco }}</p>
                      <p class="text-[10px] font-semibold text-[#8c8c8c] tracking-wider uppercase">{{ cuenta.nombreTitular || cuenta.tipoMoneda }}</p>
                    </div>
                  </div>
                  <UButton
                    icon="i-lucide-trash-2"
                    color="neutral"
                    variant="ghost"
                    size="2xs"
                    class="opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                    @click="deleteAccount(cuenta.id)"
                  />
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xl font-bold tracking-widest text-[#333]">**** {{ cuenta.numeroCuenta.slice(-4) }}</span>
                  <span class="text-[10px] font-bold text-[#555] bg-[#f0f0f0] px-2.5 py-0.5 rounded">{{ cuenta.tipoMoneda }}</span>
                </div>
              </div>
            </div>
          </template>

          <div v-else class="bg-white rounded-xl border-2 border-dashed border-[#d9d9d9] p-10 flex flex-col items-center justify-center cursor-pointer hover:border-[#bbb] transition-colors min-h-[160px]" @click="modalOpen = true">
            <div class="w-12 h-12 rounded-full bg-[#f0f0f0] flex items-center justify-center mb-3">
              <UIcon name="i-lucide-plus" class="size-6 text-[#555]" />
            </div>
            <p class="text-sm font-medium text-[#555]">Vincular nueva cuenta</p>
          </div>
        </div>
      </div>
    </main>

    <footer class="border-t border-[#d9d9d9] mt-8">
      <div class="max-w-6xl mx-auto px-10 py-6 flex items-center justify-between text-xs text-[#8c8c8c]">
        <p>FinTech Pro © 2024 FinTech Pro. Institutional Stability & Digital Precision.</p>
        <div class="flex items-center gap-6">
          <span class="cursor-pointer hover:text-[#555]">Terms of Service</span>
          <span class="cursor-pointer hover:text-[#555]">Privacy Policy</span>
          <span class="cursor-pointer hover:text-[#555]">Security</span>
          <span class="cursor-pointer hover:text-[#555]">Support</span>
        </div>
      </div>
    </footer>

    <UModal v-model:open="modalOpen" title="Agregar cuenta bancaria">
      <template #body>
        <UForm :state="accountState" :validate="validateAccount" class="space-y-4" @submit="onSubmitAccount">
          <UFormField label="Nombre del Banco" name="banco" required>
            <UInput v-model="accountState.banco" placeholder="Ej: Banco Santander" class="w-full" />
          </UFormField>
          <UFormField label="Número de Cuenta" name="numeroCuenta" required>
            <UInput v-model="accountState.numeroCuenta" placeholder="Ej: 1234 5678 9012 3456" class="w-full" />
          </UFormField>
          <UFormField label="Nombre del Titular" name="nombreTitular" required>
            <UInput v-model="accountState.nombreTitular" placeholder="Nombre del titular" class="w-full" />
          </UFormField>
          <UFormField label="Moneda" name="tipoMoneda">
            <USelect v-model="accountState.tipoMoneda" :items="monedas" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-3 pt-2">
            <UButton label="Cancelar" color="neutral" variant="outline" @click="modalOpen = false" />
            <UButton type="submit" label="Guardar" :loading="savingAccount" :disabled="savingAccount" />
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
