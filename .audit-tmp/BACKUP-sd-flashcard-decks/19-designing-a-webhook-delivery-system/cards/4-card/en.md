# question
<!-- @starci/seperator -->
A subscriber complains that they received `subscription.updated` before `subscription.created` for the same object, which broke their state machine. When do webhook consumers actually need ordered delivery, how would you provide it, and what does strict ordering cost you?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Ordering
## 1
<!-- @starci/seperator -->
Throughput
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Order only matters within a single entity (the same subscription, the same order), not globally, so provide per-key ordering rather than a global total order. Partition deliveries by a stable ordering key (for example the resource id) and process each key's events serially — one in-flight delivery per key, the next event for that key only dispatched after the previous one is acknowledged — while different keys still proceed in parallel. With retries this means a failed delivery for a key blocks subsequent events for that same key until it succeeds or is dead-lettered. An alternative that avoids serialization entirely is to attach a monotonic sequence number or version to each event and let consumers reorder or drop stale events themselves.
:::

:::muted
**Trade-off** — Strict per-key ordering is simple for consumers to reason about, but it converts an independent, parallelizable delivery into a serial chain per key, capping throughput for a hot key and meaning one stuck event head-of-line-blocks every later event for that resource. Sequence-number-plus-let-the-consumer-reorder keeps your delivery fully parallel and resilient, but pushes complexity onto every consumer, who must persist last-seen versions and handle out-of-order arrival. Most platforms choose at-least-once with no ordering guarantee plus version numbers, because guaranteeing order across an unreliable network with retries is expensive and many use cases tolerate reordering if events carry enough state.
:::

:::muted
**Pitfall & Failure mode** — Promising global ordering is a trap: retries, multiple workers, and network variability make true cross-entity order practically impossible without crippling serialization. Even per-key ordering fails subtly if your key choice is wrong (ordering by user id when the entity is an order id) so related events scatter across partitions. And per-key serialization creates a new failure mode where a single poison delivery permanently stalls all later events for that key — you need a dead-letter escape so the chain can advance, accepting that the consumer may then see a gap.
:::
<!-- @starci/seperator -->
