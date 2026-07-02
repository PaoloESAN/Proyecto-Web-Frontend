<script setup lang="ts">
import type { ErrorResponse } from "~/types";

const props = defineProps<{
  transactionId: number;
  uploadingVoucher: boolean;
}>();

const emit = defineEmits<{
  (e: "voucher-uploaded"): void;
}>();

const toast = useToast();
const api = useApi();

const voucherFile = ref<File | null>(null);
const voucherPreview = ref<string | null>(null);
const loading = ref(false);

function onVoucherSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: "Archivo demasiado grande",
      description: "El comprobante debe pesar menos de 5MB.",
      color: "warning",
    });
    return;
  }

  if (file.type !== "image/jpeg" && file.type !== "image/png") {
    toast.add({
      title: "Formato no soportado",
      description: "Solo se admiten imágenes en formato JPG o PNG.",
      color: "warning",
    });
    return;
  }

  voucherFile.value = file;
  voucherPreview.value = URL.createObjectURL(file);
}

function removeVoucher() {
  voucherFile.value = null;
  voucherPreview.value = null;
}

async function uploadVoucher() {
  if (!voucherFile.value) return;
  loading.value = true;

  try {
    const formData = new FormData();
    formData.append("file", voucherFile.value);

    await api<unknown>(`/api/transacciones/${props.transactionId}/voucher`, {
      method: "POST",
      body: formData,
    });

    toast.add({
      title: "Voucher subido",
      description: "El comprobante de pago fue subido y la transacción pasó a estado 'En Proceso'.",
      color: "success",
      icon: "i-lucide-check-circle",
    });

    removeVoucher();
    emit("voucher-uploaded");
  } catch (err) {
    const error = err as { data?: ErrorResponse };
    const errorData = error.data;
    toast.add({
      title: "Error al subir voucher",
      description: errorData?.mensaje || "Hubo un inconveniente al cargar el comprobante.",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="border-t border-neutral-100 dark:border-neutral-800 pt-6 mt-6 space-y-4">
    <div>
      <h4 class="text-sm font-bold text-neutral-900 dark:text-white">
        Sube tu comprobante de pago de transferencia
      </h4>
      <p class="text-xs text-neutral-400 mt-0.5">
        Por favor, transfiere a la cuenta bancaria de destino correspondiente y sube aquí la imagen del voucher de la transferencia (máximo 5MB, JPG o PNG).
      </p>
    </div>

    <div class="space-y-3">
      <div
        v-if="!voucherPreview"
        class="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl p-6 text-center hover:border-primary/50 transition-colors relative"
      >
        <input
          type="file"
          accept="image/jpeg,image/png"
          class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          @change="onVoucherSelected"
        >
        <div class="space-y-1">
          <UIcon name="i-lucide-upload-cloud" class="size-8 text-neutral-400 mx-auto" />
          <p class="text-xs font-bold text-neutral-600 dark:text-neutral-300">
            Selecciona una imagen o arrástrala aquí
          </p>
          <p class="text-[10px] text-neutral-400">Formatos aceptados: JPG, PNG</p>
        </div>
      </div>

      <!-- Vista previa del comprobante seleccionado -->
      <div
        v-else
        class="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-3"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold truncate text-neutral-700 dark:text-neutral-300">
            {{ voucherFile?.name }}
          </span>
          <UButton icon="i-lucide-trash" color="error" variant="ghost" size="xs" class="cursor-pointer" @click="removeVoucher" />
        </div>
        <div class="aspect-video w-full max-h-48 rounded-lg overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center">
          <img :src="voucherPreview" alt="Vista previa del comprobante" class="max-h-full object-contain">
        </div>
        <UButton
          label="Enviar Comprobante y Registrar Pago"
          color="success"
          class="w-full font-bold justify-center cursor-pointer"
          icon="i-lucide-check"
          :loading="loading || props.uploadingVoucher"
          @click="uploadVoucher"
        />
      </div>
    </div>
  </div>
</template>
