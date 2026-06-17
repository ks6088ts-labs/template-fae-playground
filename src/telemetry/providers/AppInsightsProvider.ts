import {
  AppInsightsErrorBoundary,
  ReactPlugin,
} from '@microsoft/applicationinsights-react-js'
import { ApplicationInsights } from '@microsoft/applicationinsights-web'
import type { ComponentType, ReactNode } from 'react'
import { createElement, Fragment } from 'react'

import type {
  TelemetryMeasurements,
  TelemetryProperties,
  TelemetryService,
} from '../TelemetryService'

type AppInsightsProviderOptions = {
  connectionString: string
}

const DefaultErrorComponent = () => null

export class AppInsightsTelemetryProvider implements TelemetryService {
  private readonly reactPlugin = new ReactPlugin()
  private appInsights: ApplicationInsights | null = null
  private readonly connectionString: string

  constructor(options: AppInsightsProviderOptions) {
    this.connectionString = options.connectionString
  }

  initialize(): void {
    if (this.appInsights) {
      return
    }

    const appInsights = new ApplicationInsights({
      config: {
        connectionString: this.connectionString,
        extensions: [this.reactPlugin],
        enableAutoRouteTracking: true,
      },
    })

    appInsights.loadAppInsights()
    this.appInsights = appInsights
    this.trackPageView()
  }

  trackEvent(
    name: string,
    properties?: TelemetryProperties,
    measurements?: TelemetryMeasurements,
  ): void {
    this.appInsights?.trackEvent({ name, properties, measurements })
  }

  trackException(error: Error, properties?: TelemetryProperties): void {
    this.appInsights?.trackException({ exception: error, properties })
  }

  trackPageView(name?: string, uri?: string): void {
    this.appInsights?.trackPageView({ name, uri })
  }

  trackMetric(
    name: string,
    average: number,
    properties?: TelemetryProperties,
  ): void {
    this.appInsights?.trackMetric({ name, average }, properties)
  }

  setAuthenticatedUser(
    userId: string,
    accountId?: string,
    storeInCookie?: boolean,
  ): void {
    this.appInsights?.setAuthenticatedUserContext(
      userId,
      accountId,
      storeInCookie,
    )
  }

  clearAuthenticatedUser(): void {
    this.appInsights?.clearAuthenticatedUserContext()
  }

  wrapWithErrorBoundary(children: ReactNode, fallback?: ReactNode): ReactNode {
    if (!this.appInsights) {
      return children
    }

    const onError: ComponentType = fallback
      ? () => createElement(Fragment, null, fallback)
      : DefaultErrorComponent

    return createElement(AppInsightsErrorBoundary, {
      appInsights: this.reactPlugin,
      onError,
      children,
    })
  }
}
