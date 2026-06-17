import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createTelemetry } from './telemetry/createTelemetry'
import { NoopTelemetryProvider } from './telemetry/providers/NoopProvider'
import { TelemetryProvider } from './telemetry/react/TelemetryProvider'
import type { TelemetryService } from './telemetry/TelemetryService'

async function bootstrap() {
  let telemetry: TelemetryService
  try {
    telemetry = await createTelemetry()
    await telemetry.initialize()
  } catch {
    telemetry = new NoopTelemetryProvider()
  }

  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }

  createRoot(rootElement).render(
    <StrictMode>
      <TelemetryProvider telemetry={telemetry}>
        <App />
      </TelemetryProvider>
    </StrictMode>,
  )
}

void bootstrap()
