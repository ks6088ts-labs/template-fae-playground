import { useCallback } from 'react'

import type {
  TelemetryMeasurements,
  TelemetryProperties,
} from '../TelemetryService'
import { useTelemetry } from './context'

export function useTrackEvent() {
  const telemetry = useTelemetry()

  return useCallback(
    (
      name: string,
      properties?: TelemetryProperties,
      measurements?: TelemetryMeasurements,
    ) => {
      telemetry.trackEvent(name, properties, measurements)
    },
    [telemetry],
  )
}

export function useTrackMetric() {
  const telemetry = useTelemetry()

  return useCallback(
    (name: string, average: number, properties?: TelemetryProperties) => {
      telemetry.trackMetric(name, average, properties)
    },
    [telemetry],
  )
}
