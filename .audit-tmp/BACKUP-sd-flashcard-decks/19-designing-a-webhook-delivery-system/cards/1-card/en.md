# question
<!-- @starci/seperator -->
A subscriber's endpoint returns 503 intermittently and sometimes times out. Design the retry policy for at-least-once delivery: how do you schedule retries, why add jitter, and how do you decide when to stop retrying and dead-letter the delivery?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Retries
## 1
<!-- @starci/seperator -->
Backoff
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Retry with exponential backoff: delay grows geometrically (for example 10s, 30s, 2m, 10m, 1h…) so a struggling endpoint gets increasing breathing room instead of being hammered. Add randomized jitter to each delay so that thousands of deliveries that failed at the same instant do not all retry at the same instant and create a synchronized thundering herd. Treat 5xx, timeouts, and connection errors as retryable; treat 4xx (except 429) as terminal because retrying a malformed or unauthorized request will never succeed. Cap the number of attempts (or a total time budget like 24 hours), and when the cap is hit move the delivery to a dead-letter queue and mark the subscriber's delivery as permanently failed.
:::

:::muted
**Trade-off** — Aggressive retries with short backoff maximize the chance a transient blip is recovered quickly, but they amplify load on an already-sick endpoint and can keep your workers busy on hopeless deliveries. Long backoff and a generous attempt budget improve eventual success and survive multi-hour outages, but they increase end-to-end delivery latency and grow the backlog of in-flight retries you must store and track. The attempt cap is the knob that bounds worst-case resource cost: too low and you give up on recoverable outages, too high and a permanently-dead subscriber wastes capacity for days.
:::

:::muted
**Pitfall & Failure mode** — At-least-once plus retries guarantees you will sometimes deliver the same event more than once (the subscriber received it but its 200 response was lost), so duplicates are not a bug to eliminate but a contract to document — consumers must dedupe. A common mistake is retrying non-idempotent or non-retryable responses, hammering an endpoint that returns 400 forever. Another is unbounded retries with no dead-letter, which silently fills the queue and starves healthy deliveries; always cap attempts and surface the dead-lettered ones so an operator or the subscriber can act.
:::
<!-- @starci/seperator -->
