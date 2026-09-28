import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return
          if (id.includes('/three-stdlib/')) return 'vendor-three-stdlib'
          if (id.includes('/three/')) return 'vendor-three'
          if (id.includes('/@react-three/')) return 'vendor-r3f'
          if (id.includes('/framer-motion/')) return 'vendor-motion'
          if (id.includes('/lucide-react/')) return 'vendor-icons'
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'vendor-react'
        },
      },
    },
  },
})
