import {
  type Attributes,
  type Histogram,
  metrics,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics'
import {
  BatchSpanProcessor,
  WebTracerProvider,
} from '@opentelemetry/sdk-trace-web'
import type { ReactNode } from 'react'

import type {
  TelemetryMeasurements,
  TelemetryProperties,
  TelemetryService,
} from '../TelemetryService'

type OtelTelemetryProviderOptions = {
  endpoint: string
  serviceName: string
}

const DEFAULT_SERVICE_NAME = 'template-fae-playground'

export class OtelTelemetryProvider implements TelemetryService {
  private readonly endpoint: string
  private readonly serviceName: string
  private userAttributes: Attributes = {}
  private meter = metrics.getMeter('noop')
  private tracer = trace.getTracer('noop')
  private initialized = false
  private readonly metricInstruments = new Map<string, Histogram>()

  constructor(options: OtelTelemetryProviderOptions) {
    this.endpoint = options.endpoint.replace(/\/$/, '')
    this.serviceName = options.serviceName || DEFAULT_SERVICE_NAME
  }

  initialize(): void {
    if (this.initialized) {
      return
    }

    const resource = resourceFromAttributes({
      'service.name': this.serviceName,
    })

    const tracerProvider = new WebTracerProvider({
      resource,
      spanProcessors: [
        new BatchSpanProcessor(
          new OTLPTraceExporter({ url: `${this.endpoint}/v1/traces` }),
        ),
      ],
    })
    tracerProvider.register()

    const meterProvider = new MeterProvider({
      resource,
      readers: [
        new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({
            url: `${this.endpoint}/v1/metrics`,
          }),
        }),
      ],
    })
    metrics.setGlobalMeterProvider(meterProvider)

    this.tracer = trace.getTracer(this.serviceName)
    this.meter = metrics.getMeter(this.serviceName)
    this.initialized = true

    this.trackPageView('document_load', window.location.href)
  }

  trackEvent(
    name: string,
    properties?: TelemetryProperties,
    measurements?: TelemetryMeasurements,
  ): void {
    const span = this.tracer.startSpan(name, {
      attributes: this.toAttributes(properties, measurements),
    })
    span.end()
  }

  trackException(error: Error, properties?: TelemetryProperties): void {
    const activeSpan = trace.getActiveSpan()
    if (activeSpan) {
      activeSpan.recordException(error)
      activeSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      })
      return
    }

    const span = this.tracer.startSpan('trackException', {
      attributes: this.toAttributes(properties),
    })
    span.recordException(error)
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
    span.end()
  }

  trackPageView(name?: string, uri?: string): void {
    const span = this.tracer.startSpan(name || 'page_view', {
      attributes: this.toAttributes({
        ...(name ? { 'page.name': name } : {}),
        ...(uri ? { 'page.uri': uri } : {}),
      }),
    })
    span.end()
  }

  trackMetric(
    name: string,
    average: number,
    properties?: TelemetryProperties,
  ): void {
    const histogram = this.getOrCreateHistogram(name)
    histogram.record(average, this.toAttributes(properties))
  }

  setAuthenticatedUser(
    userId: string,
    accountId?: string,
    storeInCookie?: boolean,
  ): void {
    void storeInCookie
    this.userAttributes = {
      ...this.userAttributes,
      'enduser.id': userId,
      ...(accountId ? { 'enduser.account.id': accountId } : {}),
    }
  }

  clearAuthenticatedUser(): void {
    this.userAttributes = {}
  }

  wrapWithErrorBoundary(children: ReactNode): ReactNode {
    return children
  }

  private getOrCreateHistogram(name: string) {
    const existing = this.metricInstruments.get(name)
    if (existing) {
      return existing
    }

    const histogram = this.meter.createHistogram(name)
    this.metricInstruments.set(name, histogram)
    return histogram
  }

  private toAttributes(
    properties?: TelemetryProperties,
    measurements?: TelemetryMeasurements,
  ): Attributes {
    return {
      ...this.userAttributes,
      ...properties,
      ...measurements,
    }
  }
}
