import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@osac/api-contracts': resolve(__dirname, '../../libs/api-contracts/src/index.ts'),
      '@osac/ui-components': resolve(__dirname, '../../libs/ui-components/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../app-backend/public',
    emptyOutDir: true,
  },
})
