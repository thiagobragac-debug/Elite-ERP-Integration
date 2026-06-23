import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import type { PluginOption } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      devOptions: {
        enabled: false, // Enable in dev to test SW behavior
        type: 'module',
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
      },
      
      manifest: {
        name: "Tauze ERP - Sistema de Gestão Agropecuária",
        short_name: "Tauze ERP",
        description: "Sistema de Gestão SaaS Agropecuária com suporte offline",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#05080f",
        theme_color: "#27a376",
        orientation: "any",
        
        // Comprehensive icon set for all platforms
        // NOTE: Create pwa-192x192.png and pwa-512x512.png icons for full PWA support
        // See docs/PWA_ASSETS_TODO.md for detailed instructions
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        
        // Enhanced PWA features
        categories: ["business", "productivity", "agriculture"],
        shortcuts: [
          {
            name: "Dashboard",
            short_name: "Dashboard",
            description: "Visualizar dashboard executivo",
            url: "/",
            icons: [{ src: "favicon.svg", sizes: "any", type: "image/svg+xml" }]
          },
          {
            name: "Animais",
            short_name: "Animais",
            description: "Gerenciar rebanho",
            url: "/pecuaria/animais",
            icons: [{ src: "favicon.svg", sizes: "any", type: "image/svg+xml" }]
          },
          {
            name: "Financeiro",
            short_name: "Financeiro",
            description: "Contas a pagar e receber",
            url: "/financeiro/contas-pagar",
            icons: [{ src: "favicon.svg", sizes: "any", type: "image/svg+xml" }]
          }
        ],
      },
    }),
    // Bundle analyzer - only when ANALYZE=true environment variable is set
    ...(process.env.ANALYZE ? [visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'sunburst', 'treemap', 'network'
    }) as PluginOption] : []),
    
    // Sentry integration for release tracking and source maps
    // Only enabled in production builds with source maps
    ...(process.env.VITE_SENTRY_AUTH_TOKEN ? [sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
      
      // Upload source maps to Sentry
      sourcemaps: {
        assets: './dist/**',
        ignore: ['node_modules/**'],
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
      
      // Release configuration
      release: {
        name: process.env.VITE_SENTRY_RELEASE || process.env.GITHUB_SHA || 'development',
        deploy: {
          env: process.env.VITE_ENVIRONMENT || 'production',
        },
      },
      
      // Disable during development
      disable: !process.env.CI,
    }) as PluginOption] : [])
  ],
  build: {
    // Otimizações de build
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    // Enable source maps for production to support Sentry error tracking
    sourcemap: process.env.CI ? true : false,
    rollupOptions: {
      output: {
        // Manual chunks para melhor caching
        manualChunks: (id: string) => {
          // Vendor chunks - separate by library group
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            
            // Heavy libraries
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'vendor-maps';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            
            // Other UI libraries
            if (id.includes('framer-motion')) {
              return 'vendor-animation';
            }
            if (id.includes('@sentry')) {
              return 'vendor-sentry';
            }
            
            // Remaining vendor code
            return 'vendor-misc';
          }
          
          // Page-based splitting for major modules
          if (id.includes('src/pages/Pecuaria')) {
            return 'pages-pecuaria';
          }
          if (id.includes('src/pages/Finance')) {
            return 'pages-finance';
          }
          if (id.includes('src/pages/Inventory')) {
            return 'pages-inventory';
          }
          if (id.includes('src/pages/Fleet')) {
            return 'pages-fleet';
          }
          if (id.includes('src/pages/Purchasing')) {
            return 'pages-purchasing';
          }
          if (id.includes('src/pages/Sales')) {
            return 'pages-sales';
          }
          if (id.includes('src/pages/Market')) {
            return 'pages-market';
          }
          if (id.includes('src/pages/Reports')) {
            return 'pages-reports';
          }
          if (id.includes('src/pages/Admin')) {
            return 'pages-admin';
          }
          // Report handlers em chunk próprio — 60KB+ de lógica de dados
          if (id.includes('src/hooks/report-handlers')) {
            return 'report-handlers';
          }
          // Utilitários compartilhados
          if (id.includes('src/utils/report-utils')) {
            return 'report-utils';
          }
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
})
