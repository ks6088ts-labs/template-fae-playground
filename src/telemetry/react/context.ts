import { createContext, useContext } from 'react'
import { NoopTelemetryProvider } from '../providers/NoopProvider'
import type { TelemetryService } from '../TelemetryService'

export const TelemetryContext = createContext<TelemetryService>(
  new NoopTelemetryProvider(),
)

export function useTelemetry(): TelemetryService {
  return useContext(TelemetryContext)
}
