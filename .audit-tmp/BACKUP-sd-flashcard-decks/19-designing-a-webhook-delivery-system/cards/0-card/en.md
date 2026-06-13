# question
<!-- @starci/seperator -->
You are building a webhook system that must deliver each platform event (for example `order.paid`) to many third-party HTTP endpoints you do not own or control. Why is "just call the subscriber's URL inline when the event happens" the wrong design, and what is the core architecture that fixes it?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
junior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Webhooks
## 1
<!-- @starci/seperator -->
Async Delivery
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Decouple producing the event from delivering it. When an event happens, the producing service writes a delivery record (event id, subscriber, payload, status) and enqueues a delivery job, then returns immediately; a separate pool of delivery workers picks up jobs and makes the outbound HTTP call. This way the user-facing transaction does not wait on a slow or unreachable third party, and the queue becomes the durable buffer that lets you retry, scale, and observe delivery independently of the original request. The persisted delivery record is the source of truth for "did this event reach the subscriber yet?".
:::

:::muted
**Trade-off** — Calling inline is simpler and gives the producer an immediate success/failure signal, but it couples your latency and availability to endpoints you cannot control: one subscriber timing out at 30 seconds stalls your checkout. The async design adds moving parts (a queue, workers, a delivery store) and makes delivery eventually-consistent rather than synchronous, so the producer can no longer assume the webhook was received. That eventual-consistency is the price you pay for isolating your core path from untrusted, unpredictable external endpoints.
:::

:::muted
**Pitfall & Failure mode** — The classic failure is doing the HTTP call inside the same database transaction or request handler that created the event: a hung subscriber holds the transaction open, exhausts the connection pool, and cascades into a full outage. The other trap is fire-and-forget with no persisted record — if the worker crashes mid-delivery you have no way to know the event was lost. Always persist the intent to deliver before attempting it (the transactional-outbox idea) so a crash never silently drops an event.
:::
<!-- @starci/seperator -->
