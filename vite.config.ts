import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Use relative asset paths by default so the build can be served from any
  // location (a static file server, FastAPI, a CDN sub-directory, etc.).
  // For GitHub Pages project sites, override with VITE_BASE, e.g.
  //   VITE_BASE=/template-typescript-react/ pnpm build
  base: process.env.VITE_BASE ?? './',
  plugins: [react()],
})
