import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'

const telemetryMocks = vi.hoisted(() => {
  const telemetry = {
    initialize: vi.fn(),
    trackEvent: vi.fn(),
    trackException: vi.fn(),
    trackPageView: vi.fn(),
    trackMetric: vi.fn(),
    setAuthenticatedUser: vi.fn(),
    clearAuthenticatedUser: vi.fn(),
    wrapWithErrorBoundary: vi.fn((children: ReactNode) => children),
  }

  return {
    createTelemetry: vi.fn(async () => telemetry),
    telemetry,
  }
})

vi.mock('../../telemetry/createTelemetry', () => ({
  createTelemetry: telemetryMocks.createTelemetry,
}))

describe('App bootstrap', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    vi.resetModules()
    telemetryMocks.createTelemetry.mockClear()
    Object.values(telemetryMocks.telemetry).forEach((mock) => {
      mock.mockClear()
    })
  })

  it('renders dashboard and tracks start action', async () => {
    await import('../../main.tsx')

    await vi.waitFor(() => {
      expect(telemetryMocks.createTelemetry).toHaveBeenCalledTimes(1)
      expect(telemetryMocks.telemetry.initialize).toHaveBeenCalledTimes(1)
    })

    await expect
      .element(
        page.getByRole('heading', { name: 'スマホセンサーダッシュボード' }),
      )
      .toBeInTheDocument()

    await expect
      .element(page.getByRole('button', { name: 'CSV ダウンロード' }))
      .toBeDisabled()

    await page.getByRole('button', { name: 'センサー開始' }).click()

    expect(telemetryMocks.telemetry.trackEvent).toHaveBeenCalledWith(
      'sensor_session_started',
      { component: 'App' },
      undefined,
    )
  })
})
