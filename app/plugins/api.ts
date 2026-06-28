export default defineNuxtPlugin(() => {
  const token = useCookie("auth_token");
  const toast = useToast();
  const config = useRuntimeConfig();

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      if (token.value) {
        let headers = options.headers;
        if (!headers) {
          headers = {};
          options.headers = headers;
        }
        if (headers instanceof Headers) {
          headers.set("Authorization", `Bearer ${token.value}`);
        } else if (Array.isArray(headers)) {
          headers.push(["Authorization", `Bearer ${token.value}`]);
        } else {
          (headers as Record<string, string>)["Authorization"] = `Bearer ${token.value}`;
        }
      }
    },
    onResponseError({ response, options }) {
      const opts = options as { ignoreGlobalErrors?: boolean };
      if (opts.ignoreGlobalErrors) return;

      if (response.status === 401) {
        const authStore = useAuthStore();
        authStore.logout();

        const route = useRoute();
        if (route.path !== "/login") {
          toast.add({
            title: "Sesión expirada",
            description: "Por favor, inicia sesión de nuevo.",
            color: "error",
          });
          navigateTo("/login");
        }
      } else if (response.status === 403) {
        toast.add({
          title: "Acceso Denegado",
          description: "No tienes permisos para realizar esta acción.",
          color: "error",
        });
      } else if (response.status === 500) {
        toast.add({
          title: "Error Crítico",
          description: "Ocurrió un error en el servidor. Inténtalo más tarde.",
          color: "error",
        });
      }
    },
  });

  return {
    provide: {
      api,
    },
  };
});
