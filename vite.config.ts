import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      manifest: {
        name: "Elite ERP Agropecuário",
        short_name: "Elite ERP",
        description: "Sistema de Gestão SaaS Agropecuária com suporte offline",
        start_url: "/",
        display: "standalone",
        background_color: "#05080f",
        theme_color: "#27a376",
        orientation: "any",
        icons: [
          {
            src: "favicon.ico",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon"
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173
  }
})
