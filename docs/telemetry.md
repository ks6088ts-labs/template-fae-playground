# Frontend Telemetry

This template supports **optional** frontend telemetry with [Application Insights](https://learn.microsoft.com/azure/azure-monitor/app/app-insights-overview) and [OpenTelemetry](https://opentelemetry.io/) (OTLP/HTTP).

For the rationale behind these choices, see [Tech Stack → OpenTelemetry / Application Insights](./tech-stack.md#opentelemetry).

## How it works

Telemetry is **opt-in** and driven entirely by environment variables:

- If **one** provider is configured, telemetry is sent to that provider.
- If **both** providers are configured, telemetry is sent to both (via a composite provider).
- If **no** provider is configured, telemetry is fully disabled (a no-op provider is used), so there is zero runtime cost.

The provider abstraction lives in `src/telemetry/`:

- `config.ts` — reads and validates environment variables.
- `TelemetryService.ts` — the provider-agnostic interface used by the app.
- `providers/` — `AppInsightsProvider`, `OtelProvider`, `CompositeProvider`, and `NoopProvider`.
- `react/` — React context, hooks (e.g. `useTrackEvent`), and the `TelemetryProvider` component.

## Configuration

1. Copy `.env.template` to `.env.local`.
2. Configure one or both providers in `.env.local`:
   - `VITE_APPLICATIONINSIGHTS_CONNECTION_STRING` — for Application Insights.
   - `VITE_OTEL_EXPORTER_OTLP_ENDPOINT` — for an OpenTelemetry Collector (example: `http://localhost:4318`).
   - `VITE_OTEL_SERVICE_NAME` — optional, defaults to `template-fae-playground`.
3. Run `pnpm dev` or `pnpm build`.

## Local OpenTelemetry visualization (Collector + Grafana LGTM)

1. Start the local observability stack:

   ```bash
   docker compose -f docker/compose.yaml up
   ```

2. Configure `.env.local`:

   ```bash
   VITE_OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
   VITE_OTEL_SERVICE_NAME=template-fae-playground
   ```

3. Start the app (`pnpm dev`) and interact with the UI.
4. Open Grafana at `http://localhost:3000`.

The default collector config allows CORS from `http://localhost:5173` so browser OTLP/HTTP exports work in Vite dev mode.

## Pre-provisioned Grafana dashboard

A ready-to-use dashboard, **Frontend Telemetry (template-fae-playground)**, is automatically imported into Grafana on startup (it is also set as the Grafana home dashboard). It visualizes the app's spans using Tempo span metrics and the raw traces:

- Span rate, error rate, p95 latency, and total span count.
- Span rate by name (`counter_button_clicked`, `document_load`, `page_view`, ...).
- Span latency percentiles (p50/p95/p99) and error span rate by name.
- Top spans by count and a list of recent traces (Tempo).

Use the `Service` variable at the top to filter by `service.name` (defaults to all services).

The dashboard is provisioned by mounting these files into the `lgtm` container (see [docker/compose.yaml](../docker/compose.yaml)):

- [docker/grafana/provisioning/dashboards.yaml](../docker/grafana/provisioning/dashboards.yaml) — dashboard provider config.
- [docker/grafana/dashboards/](../docker/grafana/dashboards/) — dashboard JSON files.

The OpenTelemetry Collector config is organized under a dedicated directory:

- [docker/otel-collector/config.yaml](../docker/otel-collector/config.yaml) — Collector receiver/exporter/pipeline config.

To add your own dashboard, drop another `*.json` file into [docker/grafana/dashboards/](../docker/grafana/dashboards/) and restart the stack.
