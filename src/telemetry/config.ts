const applicationInsightsConnectionString =
  import.meta.env.VITE_APPLICATIONINSIGHTS_CONNECTION_STRING?.trim() ?? ''

const otelExporterOtlpEndpoint =
  import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT?.trim() ?? ''

const otelServiceName = import.meta.env.VITE_OTEL_SERVICE_NAME?.trim() ?? ''

export const telemetryConfig = {
  applicationInsightsConnectionString,
  otelExporterOtlpEndpoint,
  otelServiceName,
}

export const isAppInsightsEnabled =
  telemetryConfig.applicationInsightsConnectionString.length > 0

export const isOtelEnabled = telemetryConfig.otelExporterOtlpEndpoint.length > 0

export const isTelemetryEnabled = isAppInsightsEnabled || isOtelEnabled
