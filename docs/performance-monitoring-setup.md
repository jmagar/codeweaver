# Performance & Monitoring Setup Guide

**Version:** 1.0  
**Date:** January 2025

## 1. Overview

This document outlines the setup for performance monitoring and observability in the CodeWeaver project. Our strategy is centered around the **OpenTelemetry** standard, with **Prometheus** for metrics collection and **Grafana** for visualization. This provides a holistic view of application health, performance, and AI-specific behaviors.

## 2. Core Components

- **OpenTelemetry**: The backbone for generating and collecting traces, metrics, and logs in a standardized way.
- **Prometheus**: A time-series database used to store all numerical metrics scraped from our application and infrastructure.
- **Grafana**: A visualization platform to create dashboards for our Prometheus data and Jaeger traces.
- **Jaeger**: Used for distributed tracing to visualize the entire lifecycle of a request as it travels through our microservices.

## 3. Logging Strategy

A structured logging approach is crucial for effective monitoring and debugging. We will use a library like `pino` for structured, low-overhead logging.

### 3.1. Log Levels
- **`debug`**: Verbose information for local development (e.g., detailed tRPC inputs/outputs).
- **`info`**: Standard operational messages (e.g., server started, user logged in).
- **`warn`**: Potentially harmful situations (e.g., API key nearing expiration, high memory usage).
- **`error`**: Runtime errors or unexpected conditions (e.g., database connection failed, unhandled exception).

### 3.2. Structured Logs
All logs should be in JSON format and include a consistent context.

**Example Log Entry:**
```json
{
  "level": "info",
  "time": 1672531200000,
  "pid": 1234,
  "hostname": "server-1",
  "reqId": "req-abc-123",
  "userId": "user-xyz-789",
  "trpcPath": "chat.sendMessage",
  "msg": "AI response generated successfully"
}
```
This structure allows for easy filtering and searching in log management systems.

### 3.3. Logging AI Interactions
Special care must be taken when logging AI interactions to balance debuggability with cost and privacy.
- **Log Metadata, Not Payloads**: Log metadata about the AI request (model used, response time, token count) instead of the full prompt and response, which can be large and contain sensitive data.
- **Log Truncated Payloads in Dev**: In development, we can log truncated prompts/responses to aid debugging.
- **Error Logging**: Always log the full error when an AI API call fails.

## 4. Performance Monitoring for Streaming

Monitoring real-time streaming from the AI SDK v5 is critical for user experience. We will track several key metrics.

### 4.1. Time to First Token (TTFT)
This measures how quickly the user starts seeing a response. A low TTFT is essential for a "fast" perceived performance.
- **Implementation**: The client will record the time from when a request is sent to when the first stream chunk is received and report this metric.

### 4.2. Inter-Token Latency
This measures the delay between subsequent tokens. High latency here can make the stream feel "stuttery".
- **Implementation**: The client will calculate the average and P95 inter-token latency for each stream and report it.

### 4.3. Total Generation Time
The full time from request to the final `[DONE]` signal in the stream.

## 5. OpenTelemetry Implementation

We will use the `@opentelemetry/sdk-node` to automatically instrument our application.

### 5.1. Initialization
A central file will initialize the OpenTelemetry SDK.

**`packages/lib/telemetry.ts`**
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'codeweaver-app',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.JAEGER_ENDPOINT, // e.g., 'http://jaeger:4318/v1/traces'
  }),
  metricReader: new PrometheusExporter({
    port: 9464, // Default Prometheus scrape port
  }),
  instrumentations: [getNodeAutoInstrumentations({
    // Disable certain instrumentations if they are too noisy
    '@opentelemetry/instrumentation-fs': {
      enabled: false,
    },
  })],
});

sdk.start();
```
This file is imported once in the application's entry point.

### 5.2. Custom Metrics
We'll define custom metrics for AI-specific monitoring.

**`packages/lib/ai/metrics.ts`**
```typescript
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('codeweaver-ai');

export const aiRequestDuration = meter.createHistogram('ai.request.duration', {
  description: 'Duration of AI provider requests',
  unit: 'ms',
});

export const tokenUsageCounter = meter.createCounter('ai.tokens.usage', {
  description: 'Count of input and output tokens',
});

export const cacheHitCounter = meter.createCounter('ai.cache.hits', {
  description: 'Counts cache hits and misses',
});

export function recordTokenUsage(model: string, inputTokens: number, outputTokens: number) {
  tokenUsageCounter.add(inputTokens, { model, direction: 'input' });
  tokenUsageCounter.add(outputTokens, { model, direction: 'output' });
}
```
This allows us to track costs and model performance granularly.

## 6. Dashboard Setup (Grafana)

We will set up Grafana dashboards to visualize the data collected by Prometheus.

### Key Dashboards
1.  **Application Overview**:
    - Request Rate (RPS), Error Rate, Latency (P95, P99).
    - CPU and Memory usage per service.
    - Database connection pool status.
2.  **AI Performance Dashboard**:
    - AI Provider Latency (P95) by model.
    - AI Provider Error Rate by model.
    - Token Usage (input vs. output) over time.
    - Cache Hit/Miss Ratio.
3.  **Real-time Streaming Dashboard**:
    - Average Time to First Token (TTFT).
    - P95 Inter-Token Latency.
    - Active WebSocket/Subscription connections.

This setup provides deep insights into both the application's health and the performance of its core AI features, enabling us to quickly identify bottlenecks and improve the user experience. 