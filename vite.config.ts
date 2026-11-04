import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative assets work for any GitHub repository name and for local preview.
  base: './',
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
