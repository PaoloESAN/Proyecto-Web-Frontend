<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import type {
  OfertaDetalleResponse,
  TransaccionCreateResponse,
  ErrorResponse,
} from "~/types";

const route = useRoute();
const toast = useToast();
const api = useApi();
const authStore = useAuthStore();

const offerId = Number(route.params.id);
const loading = ref(true);
const offer = ref<OfertaDetalleResponse | null>(null);
const errorMsg = ref<string | null>(null);
const transactionLoading = ref(false);

// Form State
const state = reactive({
  montoOperacion: 0,
});

// Cargar la información de la oferta directamente por ID
async function fetchOffer() {
  loading.value = true;
  errorMsg.value = null;
  try {
    const response = await api<OfertaDetalleResponse>(
      `/api/ofertas/${offerId}`,
    );
    offer.value = response;
    state.montoOperacion = response.montoMinimo;
  } catch (err: any) {
    if (err.status === 404) {
      errorMsg.value =
        "La oferta especificada no existe, está inactiva o ya ha sido completada.";
    } else {
      errorMsg.value =
        "No se pudo cargar la información de la oferta. Por favor, recarga la página.";
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchOffer();
});

// Lógica de conversión de divisas en tiempo real
const conversion = computed(() => {
  if (!offer.value)
    return {
      recibe: 0,
      paga: 0,
      entrega: 0,
      currencyEntrega: "",
      currencyRecibe: "",
    };
  const rate = offer.value.tipoCambio;
  const amount = state.montoOperacion || 0;
  const totalConverted = Number((amount * rate).toFixed(2));
  const bankCurrency = offer.value.metodoPago?.tipoMoneda || "PEN";

  if (offer.value.tipoOperacion === "Venta") {
    // El creador vende moneda (ej. USD). El visitante COMPRA esa moneda.
    return {
      entrega: totalConverted,
      recibe: amount,
      currencyEntrega: bankCurrency,
      currencyRecibe: offer.value.moneda,
    };
  } else {
    // El creador compra moneda (ej. USD). El visitante VENDE esa moneda.
    return {
      entrega: amount,
      recibe: totalConverted,
      currencyEntrega: offer.value.moneda,
      currencyRecibe: bankCurrency,
    };
  }
});

// Validación dinámica con Zod basada en los límites de la oferta
const schema = computed(() => {
  const min = offer.value?.montoMinimo ?? 0;
  const max = offer.value?.montoMaximo ?? 999999999;
  const total = offer.value?.montoTotal ?? 999999999;
  const currency = offer.value?.moneda ?? "";

  return z.object({
    montoOperacion: z
      .number({ message: "Ingresa un valor numérico válido" })
      .min(min, `El monto mínimo para operar es ${min} ${currency}`)
      .max(
        Math.min(max, total),
        `El monto máximo permitido es ${Math.min(max, total)} ${currency}`,
      ),
  });
});

// Manejo del envío del formulario e inicio de la transacción
async function onSubmit(event: FormSubmitEvent<any>) {
  if (!authStore.isAuthenticated) {
    toast.add({
      title: "Iniciar Sesión Requerido",
      description: "Inicia sesión para poder realizar transacciones P2P.",
      color: "warning",
      icon: "i-lucide-user-x",
    });
    navigateTo("/login");
    return;
  }

  if (authStore.usuario?.usuarioId === offer.value?.usuarioCreador?.usuarioId) {
    toast.add({
      title: "Operación Inválida",
      description:
        "No puedes iniciar una transacción sobre tu propia oferta comercial.",
      color: "error",
      icon: "i-lucide-alert-triangle",
    });
    return;
  }

  transactionLoading.value = true;
  try {
    const payload = {
      ofertaId: offerId,
      montoOperacion: event.data.montoOperacion,
    };

    const res = await api<TransaccionCreateResponse>("/api/transacciones", {
      method: "POST",
      body: payload,
    });

    toast.add({
      title: "Transacción Iniciada",
      description: res.mensaje || "Se han reservado los fondos correctamente.",
      color: "success",
      icon: "i-lucide-circle-check",
    });

    // Redirigir a la sala de transacción
    navigateTo(`/transaction/${res.transaccion.transaccionId}`);
  } catch (error: any) {
    const errorData = error.data as ErrorResponse | undefined;
    toast.add({
      title: "Error al procesar",
      description:
        errorData?.mensaje || "Hubo un inconveniente al crear la transacción.",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    transactionLoading.value = false;
  }
}

// Comprobación si la oferta es del usuario activo
const isOwnOffer = computed(() => {
  return (
    authStore.isAuthenticated &&
    offer.value?.usuarioCreador?.usuarioId === authStore.usuario?.usuarioId
  );
});
</script>

<template>
  <div
    class="min-h-dvh bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 flex flex-col"
  >
    <!-- Cabecera de navegación -->
    <header
      class="bg-white dark:bg-neutral-900 border-b border-default shrink-0"
    >
      <div
        class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            class="rounded-xl transition-transform hover:-translate-x-0.5 active:scale-95 cursor-pointer"
            @click="navigateTo('/debug')"
          />
          <div>
            <h1 class="text-sm font-bold tracking-tight text-highlighted">
              Detalle de Oferta P2P
            </h1>
            <p class="text-[10px] text-muted">ID de Oferta: #{{ offerId }}</p>
          </div>
        </div>

        <div
          v-if="authStore.isAuthenticated && authStore.usuario"
          class="flex items-center gap-2"
        >
          <div class="text-right hidden sm:block">
            <p class="text-xs font-bold text-highlighted">
              {{ authStore.usuario.nombres }}
            </p>
            <p class="text-[10px] text-muted capitalize">
              {{ authStore.usuario.rol }}
            </p>
          </div>
          <UAvatar :alt="authStore.usuario.nombres" size="sm" />
        </div>
      </div>
    </header>

    <!-- Contenido Principal -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
      <!-- Esqueleto de Carga -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2 space-y-6">
          <USkeleton class="h-40 rounded-2xl" />
          <USkeleton class="h-64 rounded-2xl" />
        </div>
        <div class="space-y-6">
          <USkeleton class="h-95 rounded-2xl" />
        </div>
      </div>

      <!-- Alerta de Oferta no Encontrada o Error -->
      <div
        v-else-if="errorMsg"
        class="flex flex-col items-center justify-center text-center py-16 bg-white dark:bg-neutral-900 border border-default rounded-3xl shadow-xl max-w-xl mx-auto p-8 space-y-4"
      >
        <div class="p-4 bg-error/10 text-error rounded-full">
          <UIcon name="i-lucide-alert-triangle" class="size-10" />
        </div>
        <h2 class="text-xl font-bold text-highlighted">Oferta No Disponible</h2>
        <p class="text-sm text-muted">{{ errorMsg }}</p>
        <UButton
          label="Volver al Panel"
          color="primary"
          variant="solid"
          icon="i-lucide-arrow-left"
          class="font-semibold py-2.5 px-6 rounded-xl transition-all hover:shadow-lg active:scale-[0.98] cursor-pointer"
          @click="navigateTo('/debug')"
        />
      </div>

      <!-- Contenido Principal de la Oferta (2 columnas, garantizando que offer no sea null) -->
      <div
        v-else-if="offer"
        class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start"
      >
        <!-- Detalles Generales (Columna Izquierda / Ancha) -->
        <div class="space-y-6">
          <!-- Fila de Creador y Cuentas (Al principio / arriba) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <!-- Datos del Creador (Acerca del Anunciante - Izquierda) -->
            <UCard
              class="backdrop-blur-md bg-white/90 dark:bg-neutral-900/90 border border-default shadow-xl rounded-2xl"
            >
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-user" class="text-primary size-5" />
                  <h3 class="font-bold text-highlighted text-sm">
                    Acerca del Anunciante
                  </h3>
                </div>
              </template>
              <div
                v-if="offer.usuarioCreador"
                class="flex flex-col items-center text-center py-2"
              >
                <UAvatar
                  :alt="offer.usuarioCreador.nombres"
                  size="md"
                  class="bg-primary/10 text-primary font-extrabold mb-3 size-14 ring-2 ring-primary/20"
                />
                <h4 class="text-sm font-bold text-highlighted leading-snug">
                  {{ offer.usuarioCreador.nombres }}
                  {{ offer.usuarioCreador.apellidos }}
                </h4>
                <p class="text-xs text-muted truncate max-w-full mt-1">
                  {{ offer.usuarioCreador.correo }}
                </p>
                <div
                  class="mt-4 flex items-center gap-1.5 text-amber-500 bg-amber-500/10 dark:bg-amber-500/20 px-3 py-1 rounded-full text-xs font-bold"
                >
                  <UIcon name="i-lucide-star" class="size-3.5 fill-amber-500" />
                  <span>{{ offer.usuarioCreador.calificacion?.toFixed(2) ?? '0.00' }} (Calificación)</span>
                </div>
              </div>
              <div v-else class="text-center py-8 text-muted text-xs">
                Información del anunciante no disponible.
              </div>
            </UCard>

            <!-- Datos de Pago vinculados (Método de Cobro P2P - Derecha) -->
            <UCard
              class="backdrop-blur-md bg-white/90 dark:bg-neutral-900/90 border border-default shadow-xl rounded-2xl"
            >
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-landmark" class="text-primary size-5" />
                  <h3 class="font-bold text-highlighted text-sm">
                    Método de Cobro P2P
                  </h3>
                </div>
              </template>

              <div v-if="offer.metodoPago" class="space-y-3 py-1">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <span
                      class="text-[10px] text-muted font-bold uppercase tracking-wider block mb-0.5"
                      >Entidad Bancaria</span
                    >
                    <span
                      class="text-sm font-extrabold text-highlighted block"
                      >{{ offer.metodoPago.banco }}</span
                    >
                  </div>
                  <div>
                    <span
                      class="text-[10px] text-muted font-bold uppercase tracking-wider block mb-0.5"
                      >Moneda</span
                    >
                    <UBadge
                      color="neutral"
                      variant="soft"
                      size="xs"
                      class="font-bold uppercase"
                      >{{ offer.metodoPago.tipoMoneda }}</UBadge
                    >
                  </div>
                </div>

                <div
                  class="pt-3 border-t border-neutral-100 dark:border-neutral-800"
                >
                  <span
                    class="text-[10px] text-muted font-bold uppercase tracking-wider block mb-0.5"
                    >Titular</span
                  >
                  <span class="text-xs font-semibold text-highlighted block">{{
                    offer.metodoPago.nombreTitular
                  }}</span>
                </div>

                <div
                  class="pt-3 border-t border-neutral-100 dark:border-neutral-800"
                >
                  <span
                    class="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1"
                    >Número de Cuenta</span
                  >
                  <span
                    class="font-mono text-xs font-bold text-highlighted tracking-wider block bg-neutral-100 dark:bg-neutral-800/80 p-2 rounded-lg text-center border border-default"
                  >
                    {{ offer.metodoPago.numeroCuenta }}
                  </span>
                </div>
              </div>
              <div v-else class="text-center py-8 text-muted text-xs">
                Información de cobro no especificada.
              </div>
            </UCard>
          </div>

          <!-- Tarjeta Principal de Información Comercial (Al final / abajo) -->
          <UCard
            class="backdrop-blur-md bg-white/90 dark:bg-neutral-900/90 border border-default shadow-xl rounded-2xl overflow-hidden"
          >
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="p-2.5 rounded-xl"
                    :class="
                      offer.tipoOperacion === 'Compra'
                        ? 'bg-info/10 text-info'
                        : 'bg-success/10 text-success'
                    "
                  >
                    <UIcon
                      :name="
                        offer.tipoOperacion === 'Compra'
                          ? 'i-lucide-arrow-down-left'
                          : 'i-lucide-arrow-up-right'
                      "
                      class="size-6"
                    />
                  </div>
                  <div>
                    <h2 class="text-base font-bold text-highlighted">
                      Información Comercial
                    </h2>
                    <p class="text-xs text-muted">
                      Datos publicados por el anunciante
                    </p>
                  </div>
                </div>
                <UBadge
                  :color="offer.tipoOperacion === 'Compra' ? 'info' : 'success'"
                  variant="soft"
                  size="md"
                  class="font-bold uppercase tracking-wider"
                >
                  {{ offer.tipoOperacion === "Compra" ? "Compra" : "Venta" }}
                </UBadge>
              </div>
            </template>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-6 py-2">
              <div class="space-y-1">
                <span
                  class="text-[10px] text-muted font-bold uppercase tracking-wider block"
                  >Moneda</span
                >
                <span
                  class="text-lg font-extrabold text-highlighted flex items-center gap-1.5"
                >
                  <UIcon name="i-lucide-wallet" class="text-primary size-5" />
                  {{ offer.moneda }}
                </span>
              </div>

              <div class="space-y-1">
                <span
                  class="text-[10px] text-muted font-bold uppercase tracking-wider block"
                  >Tipo de Cambio</span
                >
                <span
                  class="text-lg font-extrabold text-highlighted flex items-center gap-1.5"
                >
                  <UIcon
                    name="i-lucide-trending-up"
                    class="text-success size-5"
                  />
                  {{ offer.tipoCambio.toFixed(4) }}
                  <span class="text-xs text-muted font-semibold"
                    >/ {{ offer.metodoPago?.tipoMoneda || "PEN" }}</span
                  >
                </span>
              </div>

              <div class="space-y-1">
                <span
                  class="text-[10px] text-muted font-bold uppercase tracking-wider block"
                  >Disponible</span
                >
                <span class="text-lg font-extrabold text-highlighted">
                  {{ offer.montoTotal.toLocaleString() }} {{ offer.moneda }}
                </span>
              </div>

              <!-- Límites de Operación con diseño transparente y línea discontinua -->
              <div
                class="space-y-1 col-span-2 sm:col-span-3 pt-4 border-t border-neutral-100 dark:border-neutral-800"
              >
                <span
                  class="text-[10px] text-muted font-bold uppercase tracking-wider block mb-3"
                  >Límites de Operación por Transacción</span
                >
                <div class="grid grid-cols-2 gap-4">
                  <div
                    class="border border-dashed border-default p-3 rounded-xl text-center bg-transparent"
                  >
                    <span
                      class="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1"
                      >Monto Mínimo</span
                    >
                    <span class="text-sm font-extrabold text-highlighted"
                      >{{ offer.montoMinimo.toLocaleString() }}
                      {{ offer.moneda }}</span
                    >
                  </div>
                  <div
                    class="border border-dashed border-default p-3 rounded-xl text-center bg-transparent"
                  >
                    <span
                      class="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1"
                      >Monto Máximo</span
                    >
                    <span class="text-sm font-extrabold text-highlighted"
                      >{{ offer.montoMaximo.toLocaleString() }}
                      {{ offer.moneda }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Calculadora y Formulario de Transacción -->
        <div class="space-y-6">
          <UCard
            class="backdrop-blur-md bg-white/90 dark:bg-neutral-900/90 border border-default shadow-xl rounded-2xl relative overflow-hidden"
          >
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-calculator" class="text-primary size-5" />
                <h3 class="font-bold text-highlighted text-sm">
                  Iniciar Intercambio
                </h3>
              </div>
            </template>

            <!-- Caso: Oferta Propia -->
            <div v-if="isOwnOffer" class="space-y-4">
              <UAlert
                color="warning"
                variant="soft"
                icon="i-lucide-alert-triangle"
                title="Oferta Propia"
                description="Has creado esta oferta. No está permitido iniciar transacciones con tus propias publicaciones comerciales."
              />
              <UButton
                label="Gestionar Mis Ofertas"
                color="neutral"
                variant="outline"
                icon="i-lucide-pencil"
                block
                class="font-semibold py-2.5 rounded-xl cursor-pointer"
                @click="navigateTo('/debug')"
              />
            </div>

            <!-- Caso: No Autenticado -->
            <div
              v-else-if="!authStore.isAuthenticated"
              class="space-y-4 text-center py-4"
            >
              <div
                class="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 animate-bounce"
              >
                <UIcon name="i-lucide-lock" class="size-6" />
              </div>
              <h4 class="text-sm font-bold text-highlighted">
                ¿Listo para operar?
              </h4>
              <p class="text-xs text-muted px-2">
                Inicia sesión de forma segura para congelar los fondos y
                comenzar el intercambio P2P.
              </p>
              <UButton
                label="Iniciar Sesión"
                color="primary"
                variant="solid"
                icon="i-lucide-log-in"
                block
                class="font-semibold py-2.5 rounded-xl transition-all hover:shadow-primary/25 hover:shadow-md cursor-pointer"
                @click="navigateTo('/login')"
              />
            </div>

            <!-- Caso: Autenticado y Apto para comerciar -->
            <div v-else class="space-y-4">
              <UForm
                :schema="schema"
                :state="state"
                class="space-y-4"
                @submit="onSubmit"
              >
                <UFormField
                  name="montoOperacion"
                  :label="`Monto a Operar (${offer.moneda})`"
                  required
                >
                  <template #description>
                    <span class="text-[10px] text-muted">
                      Rango: {{ offer.montoMinimo }} -
                      {{ Math.min(offer.montoMaximo, offer.montoTotal) }}
                      {{ offer.moneda }}
                    </span>
                  </template>
                  <UInput
                    v-model.number="state.montoOperacion"
                    type="number"
                    placeholder="Monto"
                    class="w-full font-bold text-lg"
                    :min="offer.montoMinimo"
                    :max="Math.min(offer.montoMaximo, offer.montoTotal)"
                    step="any"
                  >
                    <template #trailing>
                      <span class="text-xs font-bold text-muted">{{
                        offer.moneda
                      }}</span>
                    </template>
                  </UInput>
                </UFormField>

                <!-- Panel de Detalle de la Conversión -->
                <div
                  class="bg-neutral-500/5 dark:bg-neutral-800/20 border border-default p-4 rounded-xl space-y-3"
                >
                  <div class="flex items-center justify-between text-xs">
                    <span
                      class="text-muted font-semibold flex items-center gap-1.5"
                    >
                      <UIcon
                        name="i-lucide-arrow-right-left"
                        class="size-3.5"
                      />
                      Tú Entregas
                    </span>
                    <span class="font-extrabold text-highlighted">
                      {{
                        conversion.entrega.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      }}
                      {{ conversion.currencyEntrega }}
                    </span>
                  </div>

                  <div class="flex justify-center relative py-1">
                    <div
                      class="w-full border-t border-dashed border-default absolute top-1/2 left-0 -translate-y-1/2"
                    ></div>
                    <div
                      class="bg-white dark:bg-neutral-900 text-primary border border-default p-1.5 rounded-full z-10 size-7 flex items-center justify-center shadow-sm"
                    >
                      <UIcon name="i-lucide-arrow-down-up" class="size-4" />
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-xs">
                    <span
                      class="text-primary font-bold flex items-center gap-1.5"
                    >
                      <UIcon
                        name="i-lucide-sparkles"
                        class="size-3.5 text-primary"
                      />
                      Tú Recibes
                    </span>
                    <span class="font-black text-primary text-sm">
                      {{
                        conversion.recibe.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      }}
                      {{ conversion.currencyRecibe }}
                    </span>
                  </div>
                </div>

                <!-- Botón de Envío -->
                <UButton
                  type="submit"
                  label="Comenzar Transacción"
                  color="primary"
                  variant="solid"
                  block
                  size="lg"
                  class="font-bold py-3 rounded-xl transition-all hover:shadow-primary/20 hover:shadow-lg active:scale-[0.98] cursor-pointer"
                  :loading="transactionLoading"
                />
              </UForm>
            </div>
          </UCard>
        </div>
      </div>
    </main>
  </div>
</template>
