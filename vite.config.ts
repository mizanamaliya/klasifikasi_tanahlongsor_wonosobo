// vite.config.ts — tambah proxy ke Flask app.py saat development lokal
// Saat pakai Google Colab+ngrok, komentari bagian proxy dan isi COLAB_URL di src/api/predict.ts

import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // ── Proxy ke Flask (app.py) saat dev lokal ──────────────────────────────
  // Semua request /predict dari frontend akan diteruskan ke Flask di port 5000
  // Sehingga tidak perlu COLAB_URL / ngrok saat run di mesin sendiri
  server: {
    proxy: {
      '/predict': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
