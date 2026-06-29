<script setup lang="ts">
import type { GetDisputesAdminResponse, TransaccionDetailResponse, MensajeChatResponse } from "~/types";

const props = defineProps<{
  selectedDispute: GetDisputesAdminResponse["datos"][number];
  transactionDetails: TransaccionDetailResponse | null;
  loadingTxDetails: boolean;
  loadingMessages: boolean;
  chatMessages: MensajeChatResponse[];
  resolving: boolean;
  buyerSendsAmount: { amount: number; currency: string };
  sellerSendsAmount: { amount: number; currency: string } | null;
}>();

const emit = defineEmits<{
  (e: "open-preview", url: string): void;
  (e: "resolve", resolucion: "A favor del comprador" | "A favor del vendedor"): void;
}>();

function formatCurrencyWithCode(amount: number, currency: string) {
  const symbol = currency === "PEN" ? "S/." : "$";
  return `${symbol} ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-PE", { month: "short", day: "numeric", year: "numeric" }) +
    " - " +
    d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
  );
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <div class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Caso de Disputa: TX-{{ props.selectedDispute.transaccion.transaccionId }}</h1>
          <div class="flex items-center gap-3 mt-2">
            <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">Investigación Activa</span>
            <span class="text-xs text-neutral-400 flex items-center gap-1">
              <UIcon name="i-lucide-calendar" class="size-3.5" />
              Iniciada el {{ formatDateShort(props.selectedDispute.fechaApertura) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Info strip -->
      <div class="grid grid-cols-2 gap-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
        <div>
          <p class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">COMPRADOR</p>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-user" class="size-4 text-neutral-500 shrink-0" />
            <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{{ props.selectedDispute.transaccion.comprador.nombres }} {{ props.selectedDispute.transaccion.comprador.apellidos }}</span>
          </div>
        </div>
        <div>
          <p class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">VENDEDOR</p>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-user" class="size-4 text-neutral-500 shrink-0" />
            <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{{ props.selectedDispute.transaccion.vendedor.nombres }} {{ props.selectedDispute.transaccion.vendedor.apellidos }}</span>
          </div>
        </div>
      </div>

      <!-- Detalle de Cuentas y Liquidación Cruzada -->
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4">
        <h3 class="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
          <UIcon name="i-lucide-arrow-left-right" class="size-4 text-primary" />
          Detalle de cuentas e intercambio cruzado
        </h3>

        <USkeleton v-if="props.loadingTxDetails" class="h-28 w-full rounded-lg" />

        <div v-else-if="props.transactionDetails" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Comprador debe pagar a Vendedor -->
          <div class="p-4 rounded-lg bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">PAGO DEL COMPRADOR</span>
                <span class="text-[10px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">De Comprador a Vendedor</span>
              </div>
              <div class="text-xs text-neutral-500 mb-2">
                El comprador <strong class="text-neutral-800 dark:text-neutral-200">{{ props.transactionDetails.comprador.nombres }} {{ props.transactionDetails.comprador.apellidos }}</strong> debe transferir:
              </div>
              <div class="text-2xl font-black text-red-600 dark:text-red-400 mb-4">
                {{ formatCurrencyWithCode(props.buyerSendsAmount.amount, props.buyerSendsAmount.currency) }}
              </div>
            </div>
            <div class="border-t border-red-100 dark:border-red-900/20 pt-3 space-y-2">
              <div class="text-xs text-neutral-400 font-semibold uppercase">A la cuenta bancaria del Vendedor:</div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span class="text-neutral-400 block text-[10px]">Banco</span>
                  <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ props.transactionDetails.instruccionesPago.banco }}</span>
                </div>
                <div>
                  <span class="text-neutral-400 block text-[10px]">Titular</span>
                  <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ props.transactionDetails.instruccionesPago.nombreTitular }}</span>
                </div>
                <div class="col-span-2">
                  <span class="text-neutral-400 block text-[10px]">Número de Cuenta</span>
                  <span class="font-mono font-bold text-neutral-800 dark:text-neutral-200 bg-white/60 dark:bg-neutral-800/40 px-1.5 py-0.5 rounded border border-neutral-200/50 dark:border-neutral-700/50 select-all block">{{ props.transactionDetails.instruccionesPago.numeroCuenta }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Vendedor debe pagar a Comprador -->
          <div class="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">PAGO DEL VENDEDOR</span>
                <span class="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">De Vendedor a Comprador</span>
              </div>
              <div class="text-xs text-neutral-500 mb-2">
                El vendedor <strong class="text-neutral-800 dark:text-neutral-200">{{ props.transactionDetails.vendedor.nombres }} {{ props.transactionDetails.vendedor.apellidos }}</strong> debe transferir:
              </div>
              <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-4">
                <span v-if="props.sellerSendsAmount">
                  {{ formatCurrencyWithCode(props.sellerSendsAmount.amount, props.sellerSendsAmount.currency) }}
                </span>
                <span v-else class="text-sm font-semibold text-neutral-400">Sin datos de envío</span>
              </div>
            </div>
            <div class="border-t border-emerald-100 dark:border-emerald-900/20 pt-3 space-y-2">
              <div class="text-xs text-neutral-400 font-semibold uppercase">A la cuenta bancaria del Comprador:</div>
              <div v-if="props.transactionDetails.metodoPagoComprador" class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span class="text-neutral-400 block text-[10px]">Banco</span>
                  <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ props.transactionDetails.metodoPagoComprador.banco }}</span>
                </div>
                <div>
                  <span class="text-neutral-400 block text-[10px]">Titular</span>
                  <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ props.transactionDetails.metodoPagoComprador.nombreTitular }}</span>
                </div>
                <div class="col-span-2">
                  <span class="text-neutral-400 block text-[10px]">Número de Cuenta</span>
                  <span class="font-mono font-bold text-neutral-800 dark:text-neutral-200 bg-white/60 dark:bg-neutral-800/40 px-1.5 py-0.5 rounded border border-neutral-200/50 dark:border-neutral-700/50 select-all block">{{ props.transactionDetails.metodoPagoComprador.numeroCuenta }}</span>
                </div>
              </div>
              <div v-else class="text-xs text-neutral-400 italic py-2">
                El comprador no seleccionó cuenta de recepción para esta transacción.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Evidence + Audit Trail -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Evidence (Comprobantes) -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
          <div class="p-4 border-b border-neutral-100 dark:border-neutral-800">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-file-text" class="size-4 text-neutral-600 dark:text-neutral-400" />
              <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">COMPROBANTES DE PAGO SUBIDOS</span>
            </div>
          </div>
          <div class="p-4 flex-1">
            <template v-if="props.loadingTxDetails">
              <USkeleton v-for="i in 2" :key="i" class="h-40 rounded-lg mb-3 animate-pulse" />
            </template>

            <div v-else-if="props.transactionDetails && props.transactionDetails.comprobantes && props.transactionDetails.comprobantes.length > 0" class="space-y-4">
              <div
                v-for="c in props.transactionDetails.comprobantes"
                :key="c.comprobanteId"
                class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 overflow-hidden p-3"
              >
                <div class="flex items-center justify-between mb-2">
                  <span
                    class="text-xs font-bold px-2.5 py-0.5 rounded-full"
                    :class="
                      c.usuarioId === props.transactionDetails.comprador.usuarioId
                        ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                        : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                    "
                  >
                    {{ c.usuarioId === props.transactionDetails.comprador.usuarioId ? 'Subido por Comprador' : 'Subido por Vendedor' }}
                  </span>
                  <span class="text-[10px] text-neutral-400">{{ formatDate(c.fechaSubida) }}</span>
                </div>

                <p class="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  {{
                    c.usuarioId === props.transactionDetails.comprador.usuarioId
                      ? `${props.transactionDetails.comprador.nombres} ${props.transactionDetails.comprador.apellidos}`
                      : `${props.transactionDetails.vendedor.nombres} ${props.transactionDetails.vendedor.apellidos}`
                  }}
                </p>

                <!-- Contenedor de miniatura -->
                <div
                  class="relative h-44 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 group cursor-pointer"
                  @click="emit('open-preview', c.imagenUrl)"
                >
                  <img :src="c.imagenUrl" alt="Comprobante de Pago" class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <span class="text-white text-xs font-semibold flex items-center gap-1">
                      <UIcon name="i-lucide-zoom-in" class="size-4" />
                      Ampliar comprobante
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="props.selectedDispute.transaccion.comprobantes && props.selectedDispute.transaccion.comprobantes.length > 0" class="space-y-4">
              <div
                v-for="c in props.selectedDispute.transaccion.comprobantes"
                :key="c.comprobanteId"
                class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 overflow-hidden p-3"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                    Comprobante
                  </span>
                  <span class="text-[10px] text-neutral-400">{{ formatDate(c.fechaSubida) }}</span>
                </div>

                <div
                  class="relative h-44 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 group cursor-pointer"
                  @click="emit('open-preview', c.imagenUrl)"
                >
                  <img :src="c.imagenUrl" alt="Comprobante" class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <span class="text-white text-xs font-semibold flex items-center gap-1">
                      <UIcon name="i-lucide-zoom-in" class="size-4" />
                      Ampliar comprobante
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="flex flex-col items-center justify-center py-12 text-neutral-400">
              <UIcon name="i-lucide-image-off" class="size-8 mb-2" />
              <p class="text-sm">No se han subido comprobantes</p>
            </div>
          </div>
        </div>

        <!-- Audit Trail -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
          <div class="p-4 border-b border-neutral-100 dark:border-neutral-800">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-message-square-text" class="size-4 text-neutral-600 dark:text-neutral-400" />
              <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">HISTORIAL Y CHAT DE LA TRANSACCIÓN</span>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-4 space-y-4 max-h-125">
            <div class="text-center mb-3">
              <span class="text-[11px] font-medium text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                Disputa abierta el {{ formatDate(props.selectedDispute.fechaApertura) }}
              </span>
            </div>

            <template v-if="props.loadingMessages">
              <USkeleton v-for="i in 3" :key="i" class="h-20 rounded-lg animate-pulse" />
            </template>

            <template v-else-if="props.chatMessages.length > 0">
              <div v-for="msg in props.chatMessages" :key="msg.mensajeId">
                <div v-if="msg.remitenteId === props.selectedDispute.transaccion.comprador.usuarioId">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {{ props.selectedDispute.transaccion.comprador.nombres }} {{ props.selectedDispute.transaccion.comprador.apellidos }}
                      <span class="text-[11px] text-neutral-400 font-normal">(Comprador)</span>
                    </span>
                    <span class="text-[11px] text-neutral-400">{{ formatTime(msg.fechaEnvio) }}</span>
                  </div>
                  <div class="bg-neutral-100 dark:bg-neutral-800 rounded-lg rounded-tl-none p-3 max-w-[85%]">
                    <p class="text-sm text-neutral-800 dark:text-neutral-200">{{ msg.contenido }}</p>
                  </div>
                </div>
                <div v-else class="flex flex-col items-end">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-[11px] text-neutral-400">{{ formatTime(msg.fechaEnvio) }}</span>
                    <span class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {{ props.selectedDispute.transaccion.vendedor.nombres }} {{ props.selectedDispute.transaccion.vendedor.apellidos }}
                      <span class="text-[11px] text-neutral-400 font-normal">(Vendedor)</span>
                    </span>
                  </div>
                  <div class="bg-neutral-800 dark:bg-neutral-700 rounded-lg rounded-tr-none p-3 max-w-[85%]">
                    <p class="text-sm text-white">{{ msg.contenido }}</p>
                  </div>
                </div>
              </div>
            </template>

            <div v-else class="flex flex-col items-center justify-center py-8 text-neutral-400">
              <UIcon name="i-lucide-message-circle-off" class="size-8 mb-2" />
              <p class="text-sm">No hay mensajes en esta disputa</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Guía de Resolución de Disputas -->
      <div class="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 text-xs text-neutral-600 dark:text-neutral-400 space-y-2 mt-5">
        <div class="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wide">
          <UIcon name="i-lucide-shield-alert" class="size-4" />
          Guía de Resolución de Disputas
        </div>
        <p>Como administrador, tu resolución afectará el sistema de la siguiente manera:</p>
        <ul class="list-disc list-inside space-y-1 pl-1">
          <li>
            <strong class="text-neutral-800 dark:text-neutral-200">A favor del Vendedor:</strong>
            Se finaliza la transacción. La operación se marca como completada de forma definitiva en el sistema.
          </li>
          <li>
            <strong class="text-neutral-800 dark:text-neutral-200">A favor del Comprador:</strong>
            Se cancela la transacción. La oferta vuelve a estar activa y visible en el mercado para recibir nuevas solicitudes.
          </li>
        </ul>
      </div>
    </div>

    <!-- Footer actions -->
    <div v-if="props.selectedDispute.estado === 'Abierta'" class="shrink-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-2 text-sm text-neutral-500">
        <UIcon name="i-lucide-info" class="size-4 text-neutral-400" />
        <span>Se requiere acción de administrador para resolver la disputa</span>
      </div>
      <div class="flex items-center gap-3">
        <UButton
          label="A FAVOR DEL VENDEDOR"
          color="neutral"
          variant="outline"
          class="cursor-pointer"
          icon="i-lucide-x"
          :loading="props.resolving"
          :disabled="props.resolving"
          @click="emit('resolve', 'A favor del vendedor')"
        />
        <UButton
          label="A FAVOR DEL COMPRADOR"
          color="error"
          icon="i-lucide-check"
          class="text-white font-semibold cursor-pointer"
          :loading="props.resolving"
          :disabled="props.resolving"
          @click="emit('resolve', 'A favor del comprador')"
        />
      </div>
    </div>
    <div v-else class="shrink-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-center">
      <div class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <UIcon name="i-lucide-circle-check" class="size-4" />
        <span>Disputa Resuelta — {{ props.selectedDispute.resolucion }}</span>
      </div>
    </div>
  </div>
</template>
