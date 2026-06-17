import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Use relative asset paths by default so the build can be served from any
  // location (a static file server, FastAPI, a CDN sub-directory, etc.).
  // For GitHub Pages project sites, override with VITE_BASE, e.g.
  //   VITE_BASE=/template-fae-playground/ pnpm build
  base: process.env.VITE_BASE ?? './',
  plugins: [react()],
  build: {
    // three.js core is an inherently large 3D library (~0.9 MB) that lives in
    // its own dedicated `three-vendor` chunk. Raise the threshold above it so
    // the warning still catches genuinely unexpected chunk growth elsewhere.
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      // Some third-party dependencies (e.g. @microsoft/applicationinsights-*)
      // ship misplaced `/* #__PURE__ */` annotations that Rolldown cannot
      // interpret. They are harmless and unfixable on our side, so silence the
      // resulting INVALID_ANNOTATION warnings to keep the build output clean.
      onLog(level, log, handler) {
        if (log.code === 'INVALID_ANNOTATION') {
          return
        }
        handler(level, log)
      },
      output: {
        // Split heavy third-party libraries into dedicated chunks so the entry
        // chunk stays small and rarely-changing vendor code is cached on its
        // own.
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 30,
            },
            {
              name: 'three-vendor',
              test: /node_modules[\\/](three|@react-three)[\\/]/,
              priority: 20,
            },
            {
              name: 'recharts-vendor',
              test: /node_modules[\\/]recharts[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
})
