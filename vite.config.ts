import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Bootyology is served from a GitHub Pages *project* site at
// https://<username>.github.io/Bootyology/ , so assets must be
// requested from the /Bootyology/ sub-path. If you later move the
// app to a custom domain or to Netlify (served at the root),
// change `base` back to '/'.
export default defineConfig({
  base: '/Bootyology/',
  plugins: [react()],
  build: {
    // App is comfortably small for a personal SPA; lift the noisy
    // 500 kB warning rather than over-engineer code-splitting.
    chunkSizeWarningLimit: 900,
  },
})
