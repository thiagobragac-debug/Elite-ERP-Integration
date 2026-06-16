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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Configuração de cache otimizada
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutos
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
              },
            },
          },
        ],
      },
      manifest: {
        name: "Tauze ERP - Sistema de Gestão Agropecuária",
        short_name: "Tauze ERP",
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
  build: {
    // Otimizações de build
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false, // Desabilitar em produção
    rollupOptions: {
      output: {
        // Manual chunks para melhor caching
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', 'framer-motion'],
          'vendor-data': ['@tanstack/react-query', '@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
          'vendor-maps': ['leaflet', 'react-leaflet'],
        },
      },
    },
    chunkSizeWarningLimit: 600, // Avisar se chunks > 600KB
  },
  server: {
    host: true,
    port: 5173,
    // Hot reload otimizado
    hmr: {
      overlay: true,
    },
  },
  // Remove console.log em produção
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
})
