"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var sdk_node_1 = require("@opentelemetry/sdk-node");
var exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
var exporter_prometheus_1 = require("@opentelemetry/exporter-prometheus");
var auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
var resources_1 = require("@opentelemetry/resources");
var semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
// Initialize OpenTelemetry SDK once per process
var sdk = new sdk_node_1.NodeSDK({
    resource: new resources_1.Resource((_a = {},
        _a[semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME] = 'codeweaver-app',
        _a[semantic_conventions_1.SemanticResourceAttributes.SERVICE_VERSION] = '1.0.0',
        _a)),
    traceExporter: new exporter_trace_otlp_http_1.OTLPTraceExporter({
        url: process.env.JAEGER_ENDPOINT, // e.g., 'http://localhost:4318/v1/traces'
    }),
    metricReader: new exporter_prometheus_1.PrometheusExporter({
        port: 9464,
    }),
    instrumentations: [
        (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)({
            '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
    ],
});
sdk.start().catch(function (err) {
    console.error('Failed to start OpenTelemetry SDK', err);
});
