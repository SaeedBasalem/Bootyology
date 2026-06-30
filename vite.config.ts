import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Bootyology is served from a GitHub Pages *project* site at
// https://<username>.github.io/Bootyology/ , so assets must be
// requested from the /Bootyology/ sub-path. If you later move the
// app to a custom domain or to Netlify (served at the root),
// change `base` back to '/'.
export default defineConfig({
  base: '/Bootyology/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Bootyology · Ranking Studio',
        short_name: 'Bootyology',
        description: 'A private, on-device studio for ranking and tracking your favourite models across themed rounds.',
        theme_color: '#140d0b',
        background_color: '#140d0b',
        display: 'standalone',
        start_url: '/Bootyology/',
        scope: '/Bootyology/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        // Cache all app assets for offline use
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Network-first for API calls, cache-first for assets
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    // App is comfortably small for a personal SPA; lift the noisy
    // 500 kB warning rather than over-engineer code-splitting.
    chunkSizeWarningLimit: 900,
  },
})
