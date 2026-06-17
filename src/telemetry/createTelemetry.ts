import {
  isAppInsightsEnabled,
  isOtelEnabled,
  isTelemetryEnabled,
  telemetryConfig,
} from './config'
import { CompositeTelemetryProvider } from './providers/CompositeProvider'
import { NoopTelemetryProvider } from './providers/NoopProvider'
import type { TelemetryService } from './TelemetryService'

export async function createTelemetry(): Promise<TelemetryService> {
  if (!isTelemetryEnabled) {
    return new NoopTelemetryProvider()
  }

  const providers: TelemetryService[] = []

  if (isAppInsightsEnabled) {
    const { AppInsightsTelemetryProvider } = await import(
      './providers/AppInsightsProvider'
    )

    providers.push(
      new AppInsightsTelemetryProvider({
        connectionString: telemetryConfig.applicationInsightsConnectionString,
      }),
    )
  }

  if (isOtelEnabled) {
    const { OtelTelemetryProvider } = await import('./providers/OtelProvider')

    providers.push(
      new OtelTelemetryProvider({
        endpoint: telemetryConfig.otelExporterOtlpEndpoint,
        serviceName: telemetryConfig.otelServiceName,
      }),
    )
  }

  if (providers.length === 1) {
    return providers[0]
  }

  return new CompositeTelemetryProvider({ providers })
}
