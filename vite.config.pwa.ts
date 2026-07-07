/**
 * Ache Fácil - SaaS para Listas de Compras com GPS
 * 
 * Este é o arquivo de configuração principal do PWA.
 * Ele define como o aplicativo funciona como uma Progressive Web App.
 * 
 * Funcionalidades PWA:
 * - Instalação como app nativo
 * - Funciona offline
 * - Sincronização em background
 * - Notificações push
 * - Ícones para diferentes resoluções
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      
      manifest: {
        name: 'Ache Fácil',
        short_name: 'Ache Fácil',
        description: 'Listas de compras inteligentes com GPS, voz e ofertas do dia',
        theme_color: '#1a8917',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'logo-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'logo-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      
      devOptions: {
        enabled: process.env.SW_DEV === 'true',
        navigateFallback: 'index.html',
        suppressWarnings: true
      }
    })
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      }
    }
  }
})
