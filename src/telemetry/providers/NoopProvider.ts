import type { ReactNode } from 'react'

import type {
  TelemetryMeasurements,
  TelemetryProperties,
  TelemetryService,
} from '../TelemetryService'

export class NoopTelemetryProvider implements TelemetryService {
  initialize(): void {}

  trackEvent(
    name: string,
    properties?: TelemetryProperties,
    measurements?: TelemetryMeasurements,
  ): void {
    void name
    void properties
    void measurements
  }

  trackException(error: Error, properties?: TelemetryProperties): void {
    void error
    void properties
  }

  trackPageView(name?: string, uri?: string): void {
    void name
    void uri
  }

  trackMetric(
    name: string,
    average: number,
    properties?: TelemetryProperties,
  ): void {
    void name
    void average
    void properties
  }

  setAuthenticatedUser(
    userId: string,
    accountId?: string,
    storeInCookie?: boolean,
  ): void {
    void userId
    void accountId
    void storeInCookie
  }

  clearAuthenticatedUser(): void {}

  wrapWithErrorBoundary(children: ReactNode): ReactNode {
    return children
  }
}
