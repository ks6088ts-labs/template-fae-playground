import type { PropsWithChildren, ReactNode } from 'react'

import type { TelemetryService } from '../TelemetryService'
import { TelemetryContext } from './context'

type TelemetryProviderProps = PropsWithChildren<{
  telemetry: TelemetryService
  errorFallback?: ReactNode
}>

export function TelemetryProvider({
  telemetry,
  errorFallback,
  children,
}: TelemetryProviderProps) {
  return (
    <TelemetryContext.Provider value={telemetry}>
      {telemetry.wrapWithErrorBoundary(children, errorFallback)}
    </TelemetryContext.Provider>
  )
}
