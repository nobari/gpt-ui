import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  define: {
    // Add process.env polyfill
    'process.env': {},
    'process.browser': true,
    'process.version': '"v16.0.0"',
    process: {
      env: {},
      browser: true,
      version: '"v16.0.0"',
    },
  },
})
