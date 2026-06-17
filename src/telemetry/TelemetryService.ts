import type { ReactNode } from 'react'

export type TelemetryProperties = Record<string, string>
export type TelemetryMeasurements = Record<string, number>

export interface TelemetryService {
  initialize(): void | Promise<void>
  trackEvent(
    name: string,
    properties?: TelemetryProperties,
    measurements?: TelemetryMeasurements,
  ): void
  trackException(error: Error, properties?: TelemetryProperties): void
  trackPageView(name?: string, uri?: string): void
  trackMetric(
    name: string,
    average: number,
    properties?: TelemetryProperties,
  ): void
  setAuthenticatedUser(
    userId: string,
    accountId?: string,
    storeInCookie?: boolean,
  ): void
  clearAuthenticatedUser(): void
  wrapWithErrorBoundary(children: ReactNode, fallback?: ReactNode): ReactNode
}
