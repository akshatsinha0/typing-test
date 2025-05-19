import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      'styled-components': 'styled-components/dist/styled-components.browser.esm.js'
    }
  },
  optimizeDeps: {
    include: ['styled-components'],
  }
})