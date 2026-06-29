<script setup lang="ts">
const props = defineProps<{
  buyerVoucher: { fechaSubida: string; imagenUrl: string } | null;
  sellerVoucher: { fechaSubida: string; imagenUrl: string } | null;
}>();

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div v-if="props.buyerVoucher || props.sellerVoucher" class="border-t border-neutral-100 dark:border-neutral-800 pt-6 mt-6 space-y-6">
    <h3 class="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
      <UIcon name="i-lucide-file-text" class="size-4" />
      Comprobantes de Transferencia
    </h3>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <!-- Comprobante del Comprador -->
      <div
        v-if="props.buyerVoucher"
        class="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Voucher del Comprador</span>
          <span class="text-[9px] text-neutral-400 font-mono">{{ formatDate(props.buyerVoucher.fechaSubida) }}</span>
        </div>
        <div class="aspect-video w-full max-h-44 rounded-lg overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center">
          <a :href="props.buyerVoucher.imagenUrl" target="_blank" class="block cursor-zoom-in">
            <img :src="props.buyerVoucher.imagenUrl" alt="Comprobante Comprador" class="max-h-full object-contain hover:scale-105 transition-transform">
          </a>
        </div>
        <div class="text-center">
          <a :href="props.buyerVoucher.imagenUrl" target="_blank" class="text-xs text-primary hover:underline font-bold inline-flex items-center gap-1">
            <UIcon name="i-lucide-external-link" />
            Ver pantalla completa
          </a>
        </div>
      </div>

      <!-- Comprobante del Vendedor -->
      <div
        v-if="props.sellerVoucher"
        class="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Voucher del Vendedor</span>
          <span class="text-[9px] text-neutral-400 font-mono">{{ formatDate(props.sellerVoucher.fechaSubida) }}</span>
        </div>
        <div class="aspect-video w-full max-h-44 rounded-lg overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center">
          <a :href="props.sellerVoucher.imagenUrl" target="_blank" class="block cursor-zoom-in">
            <img :src="props.sellerVoucher.imagenUrl" alt="Comprobante Vendedor" class="max-h-full object-contain hover:scale-105 transition-transform">
          </a>
        </div>
        <div class="text-center">
          <a :href="props.sellerVoucher.imagenUrl" target="_blank" class="text-xs text-primary hover:underline font-bold inline-flex items-center gap-1">
            <UIcon name="i-lucide-external-link" />
            Ver pantalla completa
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
