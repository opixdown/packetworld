/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: './'` makes the build work from any sub-path (GitHub Pages project
// sites, local file previews). Routing uses a hash router for the same reason.
// See docs/decisions/0011-hash-router-for-static-hosting.md
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
