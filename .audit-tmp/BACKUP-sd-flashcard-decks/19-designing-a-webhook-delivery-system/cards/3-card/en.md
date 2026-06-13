# question
<!-- @starci/seperator -->
One subscriber's endpoint starts taking 25 seconds per request and timing out. Suddenly deliveries to all your other healthy subscribers slow to a crawl too. Why does this happen with a single shared worker pool, and how do you isolate subscribers so one bad consumer cannot block the others?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Isolation
## 1
<!-- @starci/seperator -->
Concurrency
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Partition the work so a slow subscriber consumes only its own share of capacity. Instead of one global FIFO queue feeding a shared worker pool, give each subscriber (or endpoint) its own logical queue and a per-subscriber concurrency cap, so deliveries are scheduled fairly across subscribers rather than first-come-first-served. Add a circuit breaker per endpoint: after N consecutive failures, open the breaker and stop sending to that endpoint for a cooldown, draining its backlog slowly via half-open probes instead of burning workers on a dead host. The goal is that the blast radius of any one misbehaving consumer is bounded to that consumer's lane.
:::

:::muted
**Trade-off** — Strict per-subscriber queues and concurrency caps give strong isolation and fairness but cost more resources and coordination: thousands of subscribers mean thousands of queues or partitions to manage, and capacity reserved for an idle subscriber is capacity a busy one cannot borrow. A single shared pool is operationally trivial and uses capacity efficiently under normal conditions, but it provides no isolation, so head-of-line blocking by one slow endpoint degrades everyone. Many systems compromise with a bounded number of shared worker shards plus per-subscriber concurrency limits and breakers, trading perfect isolation for manageable cardinality.
:::

:::muted
**Pitfall & Failure mode** — The headline failure is head-of-line blocking: a shared pool fills with workers stuck on one timing-out endpoint, and healthy deliveries starve behind them. A subtle trap is setting outbound HTTP timeouts too high, which lets each stuck request hold a worker far longer than necessary — aggressive, sane timeouts are a prerequisite for isolation. Another is forgetting the circuit breaker, so even with per-subscriber lanes you keep paying full timeout cost on every retry to a host that is clearly down instead of backing off fast and freeing capacity.
:::
<!-- @starci/seperator -->
