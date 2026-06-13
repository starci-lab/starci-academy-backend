# question
<!-- @starci/seperator -->
Your inventory service can safely handle about 5,000 checkout attempts per second, but the flash sale will throw a million concurrent users at it. Design an admission-control layer (virtual waiting room plus token bucket) that ensures the backend is never stampeded.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Admission Control
## 1
<!-- @starci/seperator -->
Rate Limiting
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Put a gate in front of the buy path so the inventory service only ever sees traffic it can absorb. A virtual waiting room admits users at a controlled rate: on arrival each user gets a signed queue token and a position, the client polls or holds a connection, and a dispatcher releases a steady stream — say 5,000 per second — into the actual checkout. Behind the gate, enforce a token bucket per node (and globally in Redis) so even admitted requests are smoothed to the service's safe rate, shedding or 429-ing anything above it. Because real inventory is only 1,000 units, you can even stop admitting once roughly that many people have entered checkout, turning the waiting room into a coarse early sell-out signal that protects the backend from pointless load.
:::

:::muted
**Trade-off** — A waiting room trades immediacy for stability: users wait in a queue and the experience feels less instant, but the backend stays healthy and conversions that do happen are reliable. Token-bucket throttling trades some admitted-but-rejected requests (429s) for a hard ceiling that protects the hot inventory row. You also choose where to enforce the gate — at the CDN/edge is cheapest and stops load earliest, but a distributed counter (Redis) gives a precise global rate at the cost of a coordination round-trip; many systems do coarse edge admission plus a precise Redis token bucket just before the inventory call.
:::

:::muted
**Pitfall & Failure mode** — The biggest pitfall is making the waiting room itself the bottleneck: if every queued client polls every second, a million users generate a million RPS of polling, so use long-lived connections, exponential backoff with jitter, or a signed "return at time T" token to spread the load. Per-node-only rate limits fail to bound global traffic — twenty nodes each allowing 5,000/s admit 100,000/s, so you need a shared limiter for the true ceiling. Finally, a naive queue can be gamed: if the token is not signed and bound to a user, bots forge positions and jump the line, so tokens must be authenticated, single-use, and time-boxed.
:::
<!-- @starci/seperator -->
