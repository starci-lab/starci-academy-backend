# question
<!-- @starci/seperator -->
Anxious users frantically double-click "Buy", and flaky mobile networks make the client auto-retry the same checkout request. Some buyers end up with two orders for a one-per-customer item. Design an idempotent checkout so a retried or duplicated request never creates a second order.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Idempotency
## 1
<!-- @starci/seperator -->
Checkout
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Require an idempotency key on the checkout request: the client generates a unique key per buy intent (for example a UUID tied to the page load, not regenerated on retry) and sends it with every attempt. The server stores that key with a unique constraint — `INSERT ... ON CONFLICT DO NOTHING` on an `idempotency_keys` table, or `SET key value NX` in Redis — so the first request claims the key and does the real work, while any concurrent or later request carrying the same key is recognized and returns the stored result instead of executing again. Crucially the decrement and the order creation happen under that same key, so a retry sees the already-created order rather than reserving a second unit.
:::

:::muted
**Trade-off** — Idempotency adds a write and a lookup on the hot path and requires somewhere durable to remember keys, which costs latency and storage; you must also decide a retention window, since keeping keys forever is wasteful but expiring them too early lets a late retry slip through as a fresh order. You trade a little complexity for exactly-once-effect semantics on top of an at-least-once delivery world. There is also a choice between returning the cached response immediately versus blocking the duplicate until the in-flight original finishes — blocking is correct but needs care to avoid deadlocks and long holds.
:::

:::muted
**Pitfall & Failure mode** — The most common bug is generating the idempotency key per request instead of per intent, so each retry carries a new key and the protection does nothing. Another is making the key check and the order insert two separate non-atomic steps, which reintroduces a race where two duplicates both pass the check; the claim and the work must be one transaction or guarded by the same unique constraint. Teams also forget to cache and replay the original response, so a duplicate that arrives after success gets an error or a confusing "already bought" instead of the original confirmation, and clients then retry even harder. Finally, relying on a one-per-customer DB rule alone without idempotency still lets concurrent duplicates slip through before the row exists to conflict on.
:::
<!-- @starci/seperator -->
