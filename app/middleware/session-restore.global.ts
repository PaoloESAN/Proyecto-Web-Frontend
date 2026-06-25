import type { UserProfileResponse } from "~/types";

export default defineNuxtRouteMiddleware(async (to) => {
  const token = useCookie("auth_token");
  const authStore = useAuthStore();

  // Si hay token guardado pero el estado de Pinia se borró (por F5/recargar)
  if (token.value && !authStore.usuario) {
    try {
      const api = useApi();
      const profile = await api<UserProfileResponse>("/api/users/profile");

      // Restauramos la información del usuario en Pinia
      authStore.usuario = {
        usuarioId: profile.usuarioId,
        nombres: profile.nombres,
        apellidos: profile.apellidos,
        correo: profile.correo,
        rol: profile.rol as "Usuario" | "Administrador",
        esVerificado: profile.esVerificado,
        fotoPerfilUrl: profile.fotoPerfilUrl,
      };
    } catch (error) {
      // Si el token es inválido o expiró, limpiamos la sesión
      authStore.logout();
    }
  }
});
