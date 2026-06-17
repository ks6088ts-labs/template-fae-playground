# Tech Stack

This document explains **what** each technology in this template is, **why** it was adopted, and the **trade-offs** behind the decision. The goal is to make the rationale explicit so you can confidently keep, replace, or remove any piece for your own project.

## Overview

| Layer | Technology | Role |
| --- | --- | --- |
| Language | [TypeScript](#typescript) | Static typing for application and config code |
| UI library | [React 19](#react-19) | Declarative component-based UI |
| Build tool | [Vite](#vite) | Dev server (HMR) and production bundler |
| Package manager | [pnpm](#pnpm) | Fast, disk-efficient dependency management |
| Linting / formatting | [Biome](#biome) | Static analysis and code formatting |
| Unit / browser tests | [Vitest (browser mode)](#vitest-browser-mode) | Component and integration tests in a real browser |
| E2E tests | [Playwright](#playwright) | End-to-end smoke tests against the built app |
| Observability | [OpenTelemetry](#opentelemetry) / [Application Insights](#application-insights) | Optional frontend telemetry |
| Local observability | [Docker Compose + Grafana LGTM](#docker-compose--grafana-lgtm) | Local trace/metric visualization |
| CI/CD | [GitHub Actions](#github-actions) | Lint, build, test, and deploy automation |
| Hosting | [GitHub Pages](#github-pages) | Static site deployment for the demo app |

---

## TypeScript

- **What:** A typed superset of JavaScript that compiles to plain JS.
- **Why adopted:** Type safety catches a large class of bugs at author-time, improves editor autocomplete/refactoring, and serves as living documentation for component props and the telemetry API surface.
- **Trade-offs:** Adds a compile step and a learning curve, but the maintainability gains are decisive for anything beyond a throwaway prototype.
- **Where:** `tsconfig*.json`, all `*.ts` / `*.tsx` source files.

## React 19

- **What:** A library for building user interfaces from composable components.
- **Why adopted:** Large ecosystem, strong tooling, and a familiar mental model. React 19 ships modern features and works seamlessly with Vite's fast refresh.
- **Notes on the React Compiler:** It is intentionally **not** enabled here because of its impact on dev and build performance. To opt in, see the [official installation guide](https://react.dev/learn/react-compiler/installation).
- **Where:** `src/App.tsx`, `src/main.tsx`.

## Vite

- **What:** A build tool that provides a fast dev server with Hot Module Replacement (HMR) and an optimized production build powered by Rollup.
- **Why adopted:** Near-instant startup and HMR via native ES modules, minimal configuration, and first-class TypeScript/JSX support. It replaces heavier bundler setups (e.g. webpack) for most front-end apps.
- **Plugin choice:** This template uses [`@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) (Oxc-based). An alternative is [`@vitejs/plugin-react-swc`](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) (SWC-based) — both provide Fast Refresh; pick whichever fits your performance needs.
- **Where:** [vite.config.ts](../vite.config.ts). The `base` path is set for GitHub Pages project-site hosting.

## pnpm

- **What:** A package manager that stores dependencies in a content-addressable store and links them into `node_modules`.
- **Why adopted:** Faster installs and significantly lower disk usage than npm/yarn, plus a strict `node_modules` layout that prevents accidental reliance on undeclared (phantom) dependencies.
- **Where:** [package.json](../package.json), `pnpm-lock.yaml`. CI pins the pnpm version for reproducible installs.

## Biome

- **What:** A fast formatter and linter for JavaScript/TypeScript and related web files.
- **Why adopted:** Consolidates linting and formatting into one tool, keeps the code style consistent, and speeds up both local checks and CI. Combined with `actionlint`, both app code and CI workflows are linted.
- **Customizing it:** See [Using Biome](./biome.md) for formatter, linter, and override examples.
- **Where:** [biome.json](../biome.json), [package.json](../package.json).

## Vitest (browser mode)

- **What:** A Vite-native test runner. Here it runs in **browser mode** via `@vitest/browser-playwright`, executing tests in a real Chromium instance.
- **Why adopted:** Reuses the Vite config and transform pipeline, so tests run with the same module resolution as the app. Browser mode exercises real DOM/browser APIs instead of a JSDOM approximation — important for telemetry and rendering behavior.
- **Where:** [vitest.e2e.config.ts](../vitest.e2e.config.ts), `src/__tests__/e2e/**`. See [E2E testing](./e2e-testing.md).

## Playwright

- **What:** A browser automation framework for end-to-end testing.
- **Why adopted:** Provides a fast, reliable smoke test against the **production build** served by `vite preview`, validating the real deployment artifact (not just dev-mode behavior). It complements the Vitest browser suite.
- **Where:** [playwright.config.ts](../playwright.config.ts), `playwright/app.spec.ts`. See [E2E testing](./e2e-testing.md).

## OpenTelemetry

- **What:** A vendor-neutral standard and SDK for traces, metrics, and logs. This template exports over OTLP/HTTP.
- **Why adopted:** Avoids vendor lock-in — the same instrumentation can target any OTLP-compatible backend (Grafana Tempo, Jaeger, vendors, etc.). Telemetry is **opt-in** and becomes a no-op when unconfigured, so it never affects builds that don't need it.
- **Where:** `src/telemetry/providers/OtelProvider.ts`. See [Telemetry](./telemetry.md).

## Application Insights

- **What:** Azure Monitor's application performance monitoring service, integrated through `@microsoft/applicationinsights-web` and its React plugin.
- **Why adopted:** Offers a turnkey hosted option for teams already on Azure, including page views, exceptions, and an error boundary. Like OTel, it is opt-in via configuration.
- **Where:** `src/telemetry/providers/AppInsightsProvider.ts`. See [Telemetry](./telemetry.md).

> Both providers can run simultaneously through a composite provider. When neither is configured, a no-op provider is used. See [Telemetry](./telemetry.md) for the architecture.

## Docker Compose + Grafana LGTM

- **What:** A local observability stack — an OpenTelemetry Collector plus the `grafana/otel-lgtm` image (Loki, Grafana, Tempo, Mimir/Prometheus).
- **Why adopted:** Lets you visualize the app's traces and metrics locally without provisioning cloud infrastructure. A dashboard is auto-provisioned on startup for instant feedback.
- **Where:** [docker/compose.yaml](../docker/compose.yaml), [docker/otel-collector/config.yaml](../docker/otel-collector/config.yaml), [docker/grafana/](../docker/grafana/). See [Telemetry](./telemetry.md).

## GitHub Actions

- **What:** GitHub's CI/CD automation platform.
- **Why adopted:** Native to the repository host, with three focused workflows: `test` (lint + build), `e2e-test` (browser/Playwright suites), and `github-pages` (deploy). Each is reflected by a status badge in the README.
- **Where:** [.github/workflows/](../.github/workflows/).

## GitHub Pages

- **What:** Static-site hosting served directly from the repository.
- **Why adopted:** Zero-cost, zero-infrastructure hosting for the demo build, which makes the template immediately viewable. The Vite `base` path is configured to match the project-site URL.
- **Where:** `.github/workflows/github-pages.yaml`, `base` in [vite.config.ts](../vite.config.ts).
