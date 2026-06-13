# question
<!-- @starci/seperator -->
Design the end-to-end webhook delivery platform that powers a product like Stripe's: events flow from internal services to thousands of external subscribers. Walk through ingestion, fan-out, the delivery pipeline with retries and DLQ, and the observability subscribers need to trust it. What are the key scaling and reliability decisions?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
staff
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Architecture
## 1
<!-- @starci/seperator -->
Observability
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Ingestion: internal services publish domain events to a durable log (Kafka or an outbox-backed topic) so event production is decoupled and never lost. Fan-out: a router looks up active subscriptions matching each event type, and for every (event, subscriber) pair it writes a persisted delivery record (`pending`) and enqueues a delivery job — this is where one event becomes N deliveries. Delivery pipeline: a horizontally scalable worker pool pulls jobs, signs each request with the subscriber's secret and a stable delivery id, applies per-subscriber rate limits and concurrency caps with a circuit breaker, makes the HTTP call with a tight timeout, and on failure reschedules with exponential backoff plus jitter until the attempt cap, then moves it to a DLQ. Observability: per-subscriber dashboards of success rate, latency, and recent failures, a deliveries API with full attempt history, signed-payload inspection, alerts, and a self-service replay tool over the DLQ.
:::

:::muted
**Trade-off** — Persisting every delivery and its attempt history gives you exact accountability and replay, but at fan-out scale (one event to thousands of subscribers) that write amplification dominates your storage and database load, pushing you toward partitioned/sharded delivery stores and aggressive retention. Pull-based workers off a queue scale elastically and isolate failures, but require careful per-subscriber fairness so a hot or slow subscriber cannot monopolize the pool. You also choose your central guarantee: at-least-once with idempotency keys is the pragmatic default; exactly-once or strict ordering is far more expensive and usually offered only as an opt-in per-key mode.
:::

:::muted
**Pitfall & Failure mode** — At platform scale the dangerous failures are systemic: a poison event or a misconfigured subscriber can saturate shared workers (head-of-line blocking) and degrade everyone, so isolation, breakers, and tight timeouts are non-negotiable. A retry storm after a broad outage can self-DoS your own infrastructure and the recovering subscribers unless retries carry jitter and respect per-subscriber rate limits. Secret and signing-key management is a security footgun — leaked or unrotated secrets let attackers forge events. And without first-class observability, subscribers cannot tell a dropped event from a slow one, so trust erodes; the deliveries API, signature docs, and replay are as much a part of the product as the delivery itself.
:::
<!-- @starci/seperator -->
