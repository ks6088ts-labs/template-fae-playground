import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { CompositeTelemetryProvider } from '../../telemetry/providers/CompositeProvider'

function createProviderMock() {
  return {
    initialize: vi.fn(),
    trackEvent: vi.fn(),
    trackException: vi.fn(),
    trackPageView: vi.fn(),
    trackMetric: vi.fn(),
    setAuthenticatedUser: vi.fn(),
    clearAuthenticatedUser: vi.fn(),
    wrapWithErrorBoundary: vi.fn((children: ReactNode) => children),
  }
}

describe('CompositeTelemetryProvider', () => {
  it('fans out initialize and trackEvent calls to every provider', async () => {
    const firstProvider = createProviderMock()
    const secondProvider = createProviderMock()
    const provider = new CompositeTelemetryProvider({
      providers: [firstProvider, secondProvider],
    })

    await provider.initialize()
    provider.trackEvent(
      'counter_button_clicked',
      { component: 'App' },
      { nextCount: 1 },
    )

    expect(firstProvider.initialize).toHaveBeenCalledTimes(1)
    expect(secondProvider.initialize).toHaveBeenCalledTimes(1)
    expect(firstProvider.trackEvent).toHaveBeenCalledWith(
      'counter_button_clicked',
      { component: 'App' },
      { nextCount: 1 },
    )
    expect(secondProvider.trackEvent).toHaveBeenCalledWith(
      'counter_button_clicked',
      { component: 'App' },
      { nextCount: 1 },
    )
  })
})
