[![test](https://github.com/ks6088ts-labs/template-fae-playground/actions/workflows/test.yaml/badge.svg?branch=main)](https://github.com/ks6088ts-labs/template-fae-playground/actions/workflows/test.yaml?query=branch%3Amain)
[![e2e-test](https://github.com/ks6088ts-labs/template-fae-playground/actions/workflows/e2e-test.yaml/badge.svg?branch=main)](https://github.com/ks6088ts-labs/template-fae-playground/actions/workflows/e2e-test.yaml?query=branch%3Amain)
[![docker](https://github.com/ks6088ts-labs/template-fae-playground/actions/workflows/docker.yaml/badge.svg?branch=main)](https://github.com/ks6088ts-labs/template-fae-playground/actions/workflows/docker.yaml?query=branch%3Amain)
[![ghcr](https://github.com/ks6088ts-labs/template-fae-playground/actions/workflows/ghcr-release.yaml/badge.svg)](https://github.com/ks6088ts-labs/template-fae-playground/actions/workflows/ghcr-release.yaml)
[![docker-release](https://github.com/ks6088ts-labs/template-fae-playground/actions/workflows/docker-release.yaml/badge.svg)](https://github.com/ks6088ts-labs/template-fae-playground/actions/workflows/docker-release.yaml)
[![github-pages](https://github.com/ks6088ts-labs/template-fae-playground/actions/workflows/github-pages.yaml/badge.svg?branch=main)](https://github.com/ks6088ts-labs/template-fae-playground/actions/workflows/github-pages.yaml?query=branch%3Amain)
[![release](https://github.com/ks6088ts-labs/template-fae-playground/actions/workflows/release.yaml/badge.svg)](https://github.com/ks6088ts-labs/template-fae-playground/actions/workflows/release.yaml)
[![GitHub release](https://img.shields.io/github/v/release/ks6088ts-labs/template-fae-playground?logo=github&label=release)](https://github.com/ks6088ts-labs/template-fae-playground/releases/latest)
[![Docker Hub](https://img.shields.io/docker/v/ks6088ts-labs/template-fae-playground?logo=docker&label=Docker%20Hub&sort=semver)](https://hub.docker.com/r/ks6088ts-labs/template-fae-playground)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)
![Biome](https://img.shields.io/badge/Biome-60A5FA?logo=biome&logoColor=white)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-425CC7?logo=opentelemetry&logoColor=white)

# React + TypeScript + Vite

A starter template for building React single-page apps with TypeScript and Vite — including Biome-based linting/formatting, a two-tier E2E test setup, optional frontend telemetry, and CI/CD to GitHub Pages.

**Live demo:** <https://ks6088ts.github.io/template-fae-playground/>

## Features

- ⚡️ **Vite** dev server with HMR and optimized production builds
- ⚛️ **React 19** + **TypeScript**
- 🧹 **Biome** for linting and formatting (plus `actionlint` for workflows)
- 🧪 **Vitest** (browser mode) + **Playwright** E2E suites
- 📊 Optional **OpenTelemetry** / **Application Insights** frontend telemetry
- 🐳 Local **Grafana LGTM** observability stack via Docker Compose
- 🚀 **GitHub Actions** CI/CD with **GitHub Pages** deployment

## Tech stack

| Technology | Role |
| --- | --- |
| [TypeScript](https://www.typescriptlang.org/) | Static typing |
| [React 19](https://react.dev/) | UI library |
| [Vite](https://vite.dev/) | Build tool & dev server |
| [pnpm](https://pnpm.io/) | Package manager |
| [Biome](https://biomejs.dev/) | Linting and formatting |
| [Vitest](https://vitest.dev/) (browser mode) | Component / integration tests |
| [Playwright](https://playwright.dev/) | E2E smoke tests |
| [OpenTelemetry](https://opentelemetry.io/) / [Application Insights](https://learn.microsoft.com/azure/azure-monitor/app/app-insights-overview) | Optional telemetry |
| [Docker Compose](https://docs.docker.com/compose/) + [Grafana LGTM](https://github.com/grafana/docker-otel-lgtm) | Local observability |
| [GitHub Actions](https://docs.github.com/actions) / [GitHub Pages](https://pages.github.com/) | CI/CD & hosting |

See [docs/tech-stack.md](docs/tech-stack.md) for an overview of each technology, its purpose, and the rationale for adoption.

## Quick start

Prerequisites: [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/installation).

```bash
# Install dependencies
pnpm install

# Start the dev server (http://localhost:5173)
pnpm dev

# Build for production
pnpm build

# Preview the production build
pnpm preview

# Lint
pnpm lint

# Format
pnpm format
```

A `Makefile` wraps common workflows — run `make help` to list targets (e.g. `make ci-test`, `make e2e`, `make ci-test-e2e`).

## Docker

Build and run the production nginx image locally:

```bash
# Build the production image
make docker-build

# Run the container (http://localhost:8080)
make docker-run
```

You can also start the same image with Docker Compose:

```bash
docker compose -f docker/compose.yaml up --build web
```

For Docker-focused CI checks, run:

```bash
make ci-test-docker
```

### Published images

Pushing a `v*` tag keeps the existing release asset flow and also publishes multi-arch (`linux/amd64`, `linux/arm64`) images to both registries:

| Registry | Image | Workflow |
| --- | --- | --- |
| GitHub Container Registry | `ghcr.io/ks6088ts-labs/template-fae-playground` | [ghcr-release.yaml](.github/workflows/ghcr-release.yaml) |
| Docker Hub | `ks6088ts-labs/template-fae-playground` | [docker-release.yaml](.github/workflows/docker-release.yaml) |

```bash
# Pull and run from GitHub Container Registry
docker run --rm -p 8080:80 ghcr.io/ks6088ts-labs/template-fae-playground:latest

# Pull and run from Docker Hub
docker run --rm -p 8080:80 ks6088ts-labs/template-fae-playground:latest
```

The Docker Hub workflow requires two repository secrets: `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` (a Docker Hub access token).

## Testing

Two E2E suites run headless by default — Vitest browser mode and Playwright:

```bash
pnpm exec playwright install chromium
pnpm e2e
```

Set `E2E_HEADED=true` to watch the browser UI. See [docs/e2e-testing.md](docs/e2e-testing.md) for details.

## Telemetry

Frontend telemetry is optional and opt-in via environment variables, supporting Application Insights and OpenTelemetry with a local Grafana stack. It is a no-op when unconfigured. See [docs/telemetry.md](docs/telemetry.md).

## Documentation

- [Tech Stack](docs/tech-stack.md) — adopted technologies, purpose, and rationale
- [Frontend Telemetry](docs/telemetry.md) — Application Insights / OpenTelemetry setup
- [E2E Testing](docs/e2e-testing.md) — Vitest browser & Playwright suites
- [Using Biome](docs/biome.md) — linting, formatting, and customization

## Project structure

```text
src/                 # React app source
  telemetry/         # Telemetry providers, config, and React bindings
  __tests__/e2e/     # Vitest browser E2E tests
playwright/          # Playwright smoke tests
docker/              # OTel Collector + Grafana LGTM stack
  Dockerfile        # Production nginx image for built SPA assets
docs/                # Detailed documentation
.github/workflows/   # CI/CD pipelines
```
