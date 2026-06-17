# E2E Testing

This template ships **two** end-to-end test suites that complement each other. For why both exist, see [Tech Stack → Vitest / Playwright](./tech-stack.md#vitest-browser-mode).

| Suite | Runner | Target | Config | Tests |
| --- | --- | --- | --- | --- |
| Browser integration | Vitest (browser mode) | Components in a real Chromium | [vitest.e2e.config.ts](../vitest.e2e.config.ts) | `src/__tests__/e2e/**` |
| Smoke | Playwright | Production build via `vite preview` | [playwright.config.ts](../playwright.config.ts) | `playwright/app.spec.ts` |

## Running the tests

Install the Playwright browser bundle once, then run the suites:

```bash
pnpm exec playwright install chromium
pnpm e2e
# or run only the standalone Playwright smoke suite
pnpm exec playwright test
pnpm exec playwright show-report
```

The `pnpm e2e` script runs the Vitest browser suite followed by the Playwright smoke suite.

## Headless vs. headed

Both suites run **headless by default**. Set `E2E_HEADED=true` to watch the browser UI while the tests run:

```bash
E2E_HEADED=true pnpm e2e
# or use the Makefile target
make e2e E2E_HEADED=true
```

The `E2E_HEADED` environment variable is read by both [vitest.e2e.config.ts](../vitest.e2e.config.ts) and [playwright.config.ts](../playwright.config.ts), and the [Makefile](../Makefile) forwards it to the `e2e` target.

## CI

E2E tests run in CI via the `e2e-test` workflow ([.github/workflows/e2e-test.yaml](../.github/workflows/e2e-test.yaml)), which installs the Chromium bundle and runs `make ci-test-e2e` in headless mode.
