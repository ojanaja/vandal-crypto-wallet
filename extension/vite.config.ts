import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        serviceWorker: resolve(__dirname, 'src/background/index.ts'),
        contentScript: resolve(__dirname, 'src/content/index.ts'),
        inpage: resolve(__dirname, 'src/content/inpage.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'serviceWorker') {
            return 'service-worker.js';
          }
          if (chunkInfo.name === 'contentScript') {
            return 'content-script.js';
          }
          if (chunkInfo.name === 'inpage') {
            return 'inpage.js';
          }
          return 'assets/[name]-[hash].js';
        },
      }
    }
  }
})
