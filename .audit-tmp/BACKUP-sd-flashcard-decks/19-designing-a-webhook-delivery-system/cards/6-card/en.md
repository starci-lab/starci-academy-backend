# question
<!-- @starci/seperator -->
A burst of events produces 5,000 webhooks for one subscriber in a few seconds, but their endpoint can only handle about 50 requests per second and starts returning 429. How do you rate limit delivery per subscriber so you respect each consumer's capacity instead of hammering it?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Rate Limiting
## 1
<!-- @starci/seperator -->
Backpressure
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Cap the outbound send rate per subscriber, not just globally, using a token bucket keyed by subscriber id: each delivery consumes a token, the bucket refills at the subscriber's configured rate (default plus any contractually agreed limit), and workers block or defer when the bucket is empty. The queue naturally absorbs the burst as backpressure, smoothing 5,000 events into a steady stream the endpoint can digest. Treat a `429 Too Many Requests` from the consumer as a first-class signal: honor its `Retry-After` header and dynamically throttle down that subscriber's rate, rather than counting it as a normal failure. Make the per-subscriber limit configurable so high-capacity consumers are not artificially throttled.
:::

:::muted
**Trade-off** — Per-subscriber rate limiting protects fragile endpoints and is a good citizen, but it increases delivery latency for bursty events and adds state (a distributed token bucket, usually in Redis) that every worker must consult on the hot path. A purely reactive approach — send fast and only back off on 429 — needs no preconfigured limits and adapts automatically, but it guarantees you overshoot and hammer the endpoint before learning its ceiling, which is exactly what you are trying to avoid. Static configured limits are predictable but can be stale; adaptive limits track real capacity but are more complex and can oscillate.
:::

:::muted
**Pitfall & Failure mode** — A common mistake is enforcing only a global rate limit, which lets one subscriber's burst consume the shared budget and starve others, or conversely lets per-worker local limits sum to far more than the subscriber can handle because nothing coordinates across workers — the bucket must be shared/distributed. Ignoring `Retry-After` and blindly retrying a 429 turns rate limiting into a self-inflicted DoS. And rate limiting interacts with retries: if throttled deliveries pile up unboundedly you eventually breach the retry budget and dead-letter events that were only ever slow, so pair the limit with sane queue depth and backpressure.
:::
<!-- @starci/seperator -->
