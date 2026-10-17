import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // forward /api/* to FastAPI so the browser never makes a cross-origin call
    proxy: { '/api': 'http://localhost:8000' },
  },
  build: {
    rollupOptions: {
      output: {
        // libraries change far less often than app code: separate files stay cached across deploys
        manualChunks(id) {
          if (id.includes('node_modules/echarts') || id.includes('node_modules/zrender')) return 'echarts'
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
          if (id.includes('node_modules/@tanstack')) return 'tanstack'
        },
      },
    },
    // the charting library is one deliberate ~560 KB chunk (only the chart types in use are bundled)
    chunkSizeWarningLimit: 600,
  },
})
