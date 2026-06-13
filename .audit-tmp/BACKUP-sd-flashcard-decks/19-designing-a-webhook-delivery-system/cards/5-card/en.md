# question
<!-- @starci/seperator -->
A subscriber was down for six hours during a deploy and exhausted the retry budget on thousands of deliveries, so those events are now permanently failed. Design dead-letter handling and a replay mechanism so the subscriber can recover those missed events once they are healthy again.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Dead Letter
## 1
<!-- @starci/seperator -->
Replay
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — When a delivery exhausts its retries, do not discard it: move it to a dead-letter store that keeps the full delivery (event id, payload, subscriber, attempt history, last error) and mark the delivery record `failed` so it is queryable. Surface these failures to the subscriber through a dashboard and a list/get API, and emit an alert or daily digest so failures are visible rather than silent. Provide a replay operation — by single delivery id, by time range, or by event type — that re-enqueues the original deliveries through the normal pipeline, reusing the original delivery id so it is still deduplicable. Replay should be idempotent on the consumer side and rate-limited so a mass replay does not overwhelm the freshly-recovered endpoint.
:::

:::muted
**Trade-off** — Keeping a rich, queryable dead-letter store with full payloads enables self-service replay and great debuggability, but it grows storage and may retain sensitive payloads long after the event, raising retention and compliance concerns. Automatic replay (auto-retry the whole DLQ when the breaker closes) is convenient but risks re-delivering events the subscriber no longer wants or stampeding them; manual, operator- or subscriber-triggered replay is safer but slower and needs good tooling. Reusing the original delivery id keeps dedupe working but means a consumer with a short id-retention window may treat a replayed event as brand new.
:::

:::muted
**Pitfall & Failure mode** — The biggest failure is a silent dead-letter: events expire into a queue nobody watches, and the subscriber discovers data loss days later. Replaying without rate limiting recreates the original outage by hammering the just-recovered endpoint with the entire backlog at once. Replaying out of order can break consumers that depend on per-entity sequence, so replay should preserve ordering keys or send version numbers. Finally, replaying with a fresh delivery id defeats dedupe and causes the subscriber to double-process — always replay with the original id.
:::
<!-- @starci/seperator -->
