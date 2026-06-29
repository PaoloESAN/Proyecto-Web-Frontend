<script setup lang="ts">
import type {
  MetodoPagoResponse,
  OfertaCreateRequest,
  OfertaResponse,
  ExchangeConvertResponse,
} from "~/types";

definePageMeta({
  middleware: ["auth"],
  title: "Nueva Oferta",
  back: "/my-offers",
});

const toast = useToast();
const api = useApi();
const authStore = useAuthStore();

const metodosPago = ref<MetodoPagoResponse[]>([]);
const loadingAccounts = ref(true);
const submitting = ref(false);
const loadingQuote = ref(false);

const monedas = [
  { label: "USD - Dólar Estadounidense", value: "USD" },
  { label: "EUR - Euro", value: "EUR" },
  { label: "GBP - Libra Esterlina", value: "GBP" },
  { label: "MXN - Peso Mexicano", value: "MXN" },
  { label: "PEN - Sol Peruano", value: "PEN" },
];

const state = reactive({
  metodoPagoId: undefined as number | undefined,
  tipoOperacion: "Compra" as "Compra" | "Venta",
  monedaTengo: "",
  monedaRecibo: "",
  cantidad: undefined as number | undefined,
});

const quote = ref<{ rate: number; entregas: number; recibes: number } | null>(
  null
);

const metodosPagoItems = computed(() => {
  const monedaTengo = state.monedaTengo;
  const cuentasFiltradas = metodosPago.value.filter(
    (m) => !monedaTengo || m.tipoMoneda === monedaTengo
  );

  if (cuentasFiltradas.length === 0) {
    return [
      { label: "No tienes cuentas en esta moneda", value: null, disabled: true },
    ];
  }

  return cuentasFiltradas.map((m) => ({
    label: `${m.banco} (**** ${m.numeroCuenta.slice(-4)})`,
    suffix: m.tipoMoneda,
    value: m.metodoPagoId,
  }));
});

const previewEntrega = computed(() => quote.value?.entregas ?? 0);
const previewRecibe = computed(() => quote.value?.recibes ?? 0);

async function fetchMetodosPago() {
  loadingAccounts.value = true;
  try {
    metodosPago.value = await api<MetodoPagoResponse[]>(
      "/api/users/metodos-pago"
    );
  } catch {
    toast.add({
      title: "Error",
      description: "No se pudieron cargar tus cuentas",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    loadingAccounts.value = false;
  }
}

async function refreshQuote() {
  if (
    !state.monedaTengo ||
    !state.monedaRecibo ||
    !state.cantidad ||
    state.cantidad <= 0 ||
    state.monedaTengo === state.monedaRecibo
  ) {
    quote.value = null;
    return;
  }

  loadingQuote.value = true;
  try {
    if (state.tipoOperacion === "Compra") {
      const res = await api<ExchangeConvertResponse>(
        "/api/tipo-cambio/convert",
        {
          params: {
            from: state.monedaRecibo,
            to: state.monedaTengo,
            amount: state.cantidad,
          },
        }
      );
      quote.value = {
        rate: res.rate,
        entregas: Number(res.convertedAmount),
        recibes: Number(state.cantidad),
      };
    } else {
      const res = await api<ExchangeConvertResponse>(
        "/api/tipo-cambio/convert",
        {
          params: {
            from: state.monedaTengo,
            to: state.monedaRecibo,
            amount: state.cantidad,
          },
        }
      );
      quote.value = {
        rate: res.rate,
        entregas: Number(state.cantidad),
        recibes: Number(res.convertedAmount),
      };
    }
  } catch {
    quote.value = null;
  } finally {
    loadingQuote.value = false;
  }
}

watch(
  () => state.monedaTengo,
  () => {
    if (state.metodoPagoId) {
      const exists = metodosPago.value.some(
        (m) =>
          m.metodoPagoId === state.metodoPagoId &&
          m.tipoMoneda === state.monedaTengo
      );
      if (!exists) state.metodoPagoId = undefined;
    }
    refreshQuote();
  }
);
watch(() => state.monedaRecibo, refreshQuote);
watch(() => state.cantidad, refreshQuote);
watch(() => state.tipoOperacion, refreshQuote);

async function onSubmit(eventData: typeof state) {
  if (!authStore.usuario?.esVerificado) {
    toast.add({
      title: "Verificación requerida",
      description:
        "Debes verificar tu identidad en tu perfil antes de publicar una oferta.",
      color: "warning",
      icon: "i-lucide-shield-alert",
    });
    return;
  }

  submitting.value = true;
  try {
    const payload: OfertaCreateRequest = {
      metodoPagoId: eventData.metodoPagoId,
      tipoOperacion: eventData.tipoOperacion,
      monedaTengo: eventData.monedaTengo,
      monedaRecibo: eventData.monedaRecibo,
      cantidad: eventData.cantidad,
    };

    await api<OfertaResponse>("/api/ofertas", {
      method: "POST",
      body: payload,
    });

    toast.add({
      title: "Oferta publicada",
      description: "Tu oferta ya está disponible en el mercado",
      color: "success",
      icon: "i-lucide-circle-check",
    });
    await navigateTo("/my-offers");
  } catch {
    toast.add({
      title: "Error",
      description:
        "No se pudo crear la oferta. Verifica los datos e inténtalo de nuevo.",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    submitting.value = false;
  }
}

onMounted(fetchMetodosPago);
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
        <div class="p-8">
          <OffersNewForm
            v-model:state="state"
            :monedas="monedas"
            :loading-accounts="loadingAccounts"
            :submitting="submitting"
            :loading-quote="loadingQuote"
            :quote="quote"
            :metodos-pago-items="metodosPagoItems"
            :preview-entrega="previewEntrega"
            :preview-recibe="previewRecibe"
            @submit="onSubmit"
          />
        </div>
      </div>
    </main>
  </div>
</template>
