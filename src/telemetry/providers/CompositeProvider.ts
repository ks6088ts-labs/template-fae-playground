import type { ReactNode } from 'react'

import type {
  TelemetryMeasurements,
  TelemetryProperties,
  TelemetryService,
} from '../TelemetryService'

type CompositeTelemetryProviderOptions = {
  providers: TelemetryService[]
}

export class CompositeTelemetryProvider implements TelemetryService {
  private readonly providers: TelemetryService[]

  constructor(options: CompositeTelemetryProviderOptions) {
    this.providers = options.providers
  }

  async initialize(): Promise<void> {
    await Promise.all(
      this.providers.map(async (provider) => provider.initialize()),
    )
  }

  trackEvent(
    name: string,
    properties?: TelemetryProperties,
    measurements?: TelemetryMeasurements,
  ): void {
    this.providers.forEach((provider) => {
      provider.trackEvent(name, properties, measurements)
    })
  }

  trackException(error: Error, properties?: TelemetryProperties): void {
    this.providers.forEach((provider) => {
      provider.trackException(error, properties)
    })
  }

  trackPageView(name?: string, uri?: string): void {
    this.providers.forEach((provider) => {
      provider.trackPageView(name, uri)
    })
  }

  trackMetric(
    name: string,
    average: number,
    properties?: TelemetryProperties,
  ): void {
    this.providers.forEach((provider) => {
      provider.trackMetric(name, average, properties)
    })
  }

  setAuthenticatedUser(
    userId: string,
    accountId?: string,
    storeInCookie?: boolean,
  ): void {
    this.providers.forEach((provider) => {
      provider.setAuthenticatedUser(userId, accountId, storeInCookie)
    })
  }

  clearAuthenticatedUser(): void {
    this.providers.forEach((provider) => {
      provider.clearAuthenticatedUser()
    })
  }

  wrapWithErrorBoundary(children: ReactNode, fallback?: ReactNode): ReactNode {
    return this.providers.reduce(
      (wrappedChildren, provider) =>
        provider.wrapWithErrorBoundary(wrappedChildren, fallback),
      children,
    )
  }
}
