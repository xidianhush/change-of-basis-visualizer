import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'scheduler'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          mathjs: ['mathjs'],
          katex: ['katex', 'react-katex'],
        },
      },
    },
  },
})
