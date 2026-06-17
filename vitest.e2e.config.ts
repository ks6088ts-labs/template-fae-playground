import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

// Run browsers headless by default. Set E2E_HEADED=true to watch the browser UI.
const headless = process.env.E2E_HEADED !== 'true'

export default defineConfig({
  plugins: [react()],
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      headless,
      instances: [{ browser: 'chromium' }],
    },
    include: ['src/__tests__/e2e/**/*.spec.ts'],
  },
})
