# question
<!-- @starci/seperator -->
Put it all together: design the end-to-end flash-sale system at scale — from the CDN edge through the waiting room, inventory service, and payment — and explain how each layer degrades gracefully so that overload sheds load instead of corrupting inventory or crashing the platform.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
staff
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
System Design
## 1
<!-- @starci/seperator -->
Graceful Degradation
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Layer the system so each tier absorbs what it can and protects the next. The CDN serves the static landing page and a briefly-cached, approximate stock indicator, so the vast majority of traffic terminates at the edge. A virtual waiting room admits authenticated, signed tokens into checkout at the inventory service's safe rate, with a global token bucket enforcing the ceiling, and stops admitting once roughly the available units have entered. The inventory service is the thin stateful core: it does an atomic decrement (Redis-backed counter, possibly sharded into buckets, with the database as the durable ledger) guarded by an idempotency key, creating a time-boxed reservation. Payment runs asynchronously; on success the reservation is confirmed into an order, and a sweeper releases expired reservations back to the pool. Stateless web/app tiers autoscale freely because the hard correctness constraint lives only in that small inventory path.
:::

:::muted
**Trade-off** — The architecture trades simplicity and a perfectly real-time feel for survivability and correctness: a waiting room, sharded counters, eventual reconciliation, and async payment all add moving parts and approximate views, but they bound load on the one place that must never be wrong. You favor shedding load early and cheaply over serving everyone, and approximate global counts over exact ones, accepting that "sold out" may show a moment before the last reservation confirms. You also choose async over synchronous payment to keep the hot path short, at the cost of a reservation/confirmation state machine and the timeout logic it demands. Each degradation step — serve cached stock, queue, throttle, shed with a friendly sold-out page — is a deliberate trade of richness for staying up.
:::

:::muted
**Pitfall & Failure mode** — The platform-level failure to avoid is correlated collapse: if losing traffic reaches the database, or the hot counter is a single key, or the waiting room polls hammer the origin, one hot point takes down the whole sale and risks the rest of the platform — so isolate the flash-sale path (separate pools, bulkheads, circuit breakers) so its overload cannot starve unrelated services. Graceful degradation must be explicit: when admission is full, return a fast, cacheable "sold out / try again" rather than a timeout, and never let a failure open the door to oversell. The most insidious bug is a correctness gap under degradation — for example releasing reservations and confirming payments racing during a partial outage — so every state transition (decrement, reserve, confirm, release) must be atomic and idempotent, and the durable ledger must be reconcilable after the storm to prove you sold exactly the units you had.
:::
<!-- @starci/seperator -->
