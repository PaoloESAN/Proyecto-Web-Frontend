// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/ui", "@pinia/nuxt", "@nuxt/eslint"],
  eslint: {
    config: {
      typescript: true,
    },
  },
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    public: {
      apiBase: "http://localhost:5132",
    },
  },
});