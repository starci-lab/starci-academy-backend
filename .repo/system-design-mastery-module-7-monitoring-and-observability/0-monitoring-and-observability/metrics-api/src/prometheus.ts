/**
 * Prometheus (`prom-client`) setup: shared registry and demo HTTP counter/histogram.
 */
import {
    Counter, Histogram, Registry, collectDefaultMetrics 
} from "prom-client"

export const registry = new Registry()

collectDefaultMetrics({
    register: registry 
})

export const httpRequestsTotal = new Counter({
    name: "http_requests_total",
    help: "Total HTTP requests",
    labelNames: ["method",
        "route",
        "status_code"] as const,
    registers: [registry],
})

/**
 * Latency histogram (seconds) — buckets suited for `histogram_quantile` when scraped.
 */
export const httpRequestDurationSeconds = new Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request latency in seconds",
    labelNames: ["method",
        "route"] as const,
    buckets: [0.005,
        0.01,
        0.025,
        0.05,
        0.1,
        0.25,
        0.5,
        1,
        2.5,
        5],
    registers: [registry],
})
