<script setup lang="ts">
import * as signalR from "@microsoft/signalr";
import type { MensajeChatResponse } from "~/types";

const props = defineProps<{
  transactionId: number;
}>();

const api = useApi();
const toast = useToast();
const authStore = useAuthStore();

const messages = ref<MensajeChatResponse[]>([]);
const newMessage = ref("");
const sendingMessage = ref(false);
const chatContainer = ref<HTMLElement | null>(null);
const signalrState = ref<
  "disconnected" | "connecting" | "connected" | "reconnecting"
>("disconnected");
let connection: signalR.HubConnection | null = null;

function scrollChatToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
}

async function fetchMessages() {
  try {
    const response = await api<MensajeChatResponse[]>(
      `/api/transacciones/${props.transactionId}/messages`
    );
    messages.value = response;
    nextTick(scrollChatToBottom);
  } catch (err) {
    console.error("Error al cargar los mensajes del chat:", err);
  }
}

function connectSignalR() {
  const config = useRuntimeConfig();
  signalrState.value = "connecting";

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${config.public.apiBase}/api/chat`, {
      accessTokenFactory: () => {
        const token = useCookie("auth_token").value;
        return token || "";
      },
    })
    .withAutomaticReconnect()
    .build();

  connection.on("ReceiveMessage", (message: MensajeChatResponse) => {
    if (!messages.value.some((m) => m.mensajeId === message.mensajeId)) {
      messages.value.push(message);
      nextTick(scrollChatToBottom);
    }
  });

  connection.onreconnecting((err) => {
    console.warn("[SignalR CLIENT] Conexión reconectando...", err);
    signalrState.value = "reconnecting";
  });

  connection.onreconnected(() => {
    signalrState.value = "connected";
    connection
      ?.invoke("JoinRoom", String(props.transactionId))
      .then(() =>
        console.log(`[SignalR CLIENT] Re-unido a la sala ${props.transactionId}`)
      )
      .catch((err) =>
        console.error("[SignalR CLIENT] Error al re-unirse a la sala:", err)
      );
  });

  connection.onclose(() => {
    signalrState.value = "disconnected";
  });

  connection
    .start()
    .then(async () => {
      signalrState.value = "connected";
      await connection?.invoke("JoinRoom", String(props.transactionId));
    })
    .catch((err) => {
      signalrState.value = "disconnected";
      console.error(
        "[SignalR CLIENT] Error fatal al iniciar conexión SignalR:",
        err
      );
    });
}

function disconnectSignalR() {
  if (connection) {
    connection
      .stop()
      .then(() => {
        console.log("[SignalR CLIENT] Desconectado con éxito");
      })
      .catch(console.error);
    connection = null;
  }
}

async function sendChatMessage() {
  if (!newMessage.value.trim() || sendingMessage.value) return;
  const content = newMessage.value.trim();
  newMessage.value = "";
  sendingMessage.value = true;

  try {
    if (connection && signalrState.value === "connected") {
      await connection.invoke("SendMessage", String(props.transactionId), content);
    } else {
      toast.add({
        title: "Chat sin conexión",
        description: "Reconectando con el chat en tiempo real...",
        color: "warning",
      });
      connectSignalR();
    }
  } catch (err) {
    console.error("[SignalR CLIENT] Error al enviar mensaje:", err);
    toast.add({
      title: "Error de envío",
      description: "No se pudo enviar el mensaje. Inténtalo de nuevo.",
      color: "error",
    });
  } finally {
    sendingMessage.value = false;
  }
}

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

onMounted(() => {
  fetchMessages();
  connectSignalR();
});

onBeforeUnmount(() => {
  disconnectSignalR();
});

// Expose refresh chat method if needed
defineExpose({
  fetchMessages,
});
</script>

<template>
  <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-120">
    <!-- Chat Header -->
    <div class="px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-messages-square" class="text-primary size-5" />
        <span class="text-sm font-bold">Chat de la Transacción</span>
      </div>

      <!-- SignalR Connection Status Indicator -->
      <div class="flex items-center">
        <span
          v-if="signalrState === 'connected'"
          class="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold"
        >
          <span class="size-2 bg-emerald-500 rounded-full animate-pulse" />
          Conectado
        </span>
        <span
          v-else-if="signalrState === 'connecting' || signalrState === 'reconnecting'"
          class="inline-flex items-center gap-1 text-[10px] text-amber-500 font-bold animate-pulse"
        >
          <span class="size-2 bg-amber-500 rounded-full" />
          Conectando
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1 text-[10px] text-neutral-400 font-bold"
        >
          <span class="size-2 bg-neutral-400 rounded-full" />
          Desconectado
        </span>
      </div>
    </div>

    <!-- Messages Area -->
    <div
      ref="chatContainer"
      class="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/30 dark:bg-neutral-900/10"
    >
      <div v-if="messages.length === 0" class="text-center py-12 text-neutral-400 text-xs">
        <UIcon name="i-lucide-messages-square" class="size-8 text-neutral-300 dark:text-neutral-800 mx-auto mb-2" />
        No hay mensajes aún en esta sala.<br >¡Saluda a tu contraparte!
      </div>

      <div v-for="msg in messages" :key="msg.mensajeId" class="w-full mb-2">
        <!-- Mensaje de Sistema de Cuenta Bancaria -->
        <div
          v-if="msg.contenido.startsWith('[AUTOMATICO-CUENTA]')"
          class="mx-auto max-w-md my-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50 text-center text-xs text-neutral-500"
        >
          <div class="font-bold flex items-center justify-center gap-1 mb-1 text-neutral-700 dark:text-neutral-300">
            <UIcon name="i-lucide-landmark" class="size-3.5 text-primary" />
            Cuenta Bancaria de Contraparte
          </div>
          <span>{{ msg.contenido.replace("[AUTOMATICO-CUENTA] ", "") }}</span>
        </div>

        <!-- Mensaje de Chat Normal -->
        <div
          v-else
          class="flex flex-col max-w-[80%]"
          :class="[
            msg.remitenteId === authStore.usuario?.usuarioId ? 'ml-auto items-end' : 'mr-auto items-start'
          ]"
        >
          <!-- Bubble -->
          <div
            class="px-3.5 py-2.5 rounded-2xl text-sm wrap-break-word shadow-xs"
            :class="[
              msg.remitenteId === authStore.usuario?.usuarioId
                ? 'bg-primary text-white rounded-br-none'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-bl-none'
            ]"
          >
            {{ msg.contenido }}
          </div>
          <!-- Time -->
          <span class="text-[9px] text-neutral-400 mt-1 px-1 font-mono">
            {{ formatDate(msg.fechaEnvio) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Message Input Form -->
    <form
      class="p-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2"
      @submit.prevent="sendChatMessage"
    >
      <UInput
        v-model="newMessage"
        placeholder="Escribe un mensaje..."
        class="flex-1"
        autocomplete="off"
        :disabled="sendingMessage || signalrState !== 'connected'"
      />
      <UButton
        type="submit"
        icon="i-lucide-send-horizontal"
        color="primary"
        class="cursor-pointer"
        :disabled="!newMessage.trim() || sendingMessage || signalrState !== 'connected'"
        :loading="sendingMessage"
      />
    </form>
  </div>
</template>

<style scoped>
/* Scrollbar estilos discretos para el chat */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--ui-neutral-300);
  border-radius: 4px;
}
.dark ::-webkit-scrollbar-thumb {
  background: var(--ui-neutral-700);
}
</style>
