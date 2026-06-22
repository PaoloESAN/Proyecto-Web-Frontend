import { defineStore } from "pinia";
import { ref, computed } from "vue";

interface Usuario {
  usuarioId: number;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: "Usuario" | "Administrador";
  esVerificado: boolean;
  fotoPerfilUrl: string | null;
}

export const useAuthStore = defineStore("auth", () => {
  const token = useCookie<string | null>("auth_token");
  const usuario = ref<Usuario | null>(null);

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => usuario.value?.rol === "Administrador");

  const avatarUrl = computed(() => {
    if (!usuario.value?.fotoPerfilUrl) return null;
    if (usuario.value.fotoPerfilUrl.startsWith("http") || usuario.value.fotoPerfilUrl.startsWith("data:")) {
      return usuario.value.fotoPerfilUrl;
    }
    const config = useRuntimeConfig();
    return `${config.public.apiBase}${usuario.value.fotoPerfilUrl}`;
  });

  function login(
    nuevoToken: string,
    expiracion: string,
    datosUsuario: Usuario,
  ) {
    // Crear y guardar la cookie con su fecha de expiración
    const tokenCookie = useCookie("auth_token", {
      expires: new Date(expiracion),
    });
    tokenCookie.value = nuevoToken;

    // Actualizar el estado local
    token.value = nuevoToken;
    usuario.value = datosUsuario;
  }

  function logout() {
    token.value = null;
    usuario.value = null;

    const cookie = useCookie("auth_token");
    cookie.value = null;
  }

  return {
    token,
    usuario,
    avatarUrl,
    isAuthenticated,
    isAdmin,
    login,
    logout,
  };
});
