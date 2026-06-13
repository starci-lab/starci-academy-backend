# question
<!-- @starci/seperator -->
A million online drivers each send a GPS ping every 4 seconds — roughly 250k writes per second of constantly-changing location data. How do you ingest and store this without melting your database, while still keeping the matching index fresh enough to dispatch?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
LocationIngestion
## 1
<!-- @starci/seperator -->
Scalability
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Treat the current location as hot, ephemeral state, not durable relational rows. Drivers hold a persistent connection (WebSocket/gRPC stream) to a location-gateway tier; each ping updates an in-memory or Redis geo-index (`GEOADD` into per-cell sorted sets) that the matcher reads directly, so the "latest position" is an overwrite, not an append. The high-frequency stream is also published to a log like Kafka, partitioned by driver or by geo-cell, where it can be consumed asynchronously for trip telemetry, analytics, and a durable history written in batches to a columnar/time-series store. This splits the firehose into a tiny fast path (current position for matching) and a buffered slow path (history), so the dispatch-critical store only ever holds one row per driver.
:::

:::muted
**Trade-off** — Higher ping frequency means fresher matches and smoother map animation but multiplies write load, bandwidth, and battery drain, so most systems use adaptive cadence — ping faster when moving or on an active trip, slower when idle. Keeping current location only in Redis/memory gives microsecond reads but means a node failure loses positions until drivers re-ping (acceptable, since they re-ping within seconds); persisting every ping synchronously would be durable but cannot keep up at 250k/s. You also trade consistency for throughput: the matcher reads a location that is up to one ping-interval stale, which is fine because a few seconds of staleness barely changes who is "nearby."
:::

:::muted
**Pitfall & Failure mode** — The number-one mistake is `UPDATE drivers SET lat=?, lng=? WHERE id=?` on a primary SQL database for every ping; the write amplification, index updates, and lock contention will saturate it well before city scale. Other failure modes: unbounded Kafka lag on the history consumer silently growing until disks fill; sticky connections piling onto a few gateway nodes so one hotspot region overwhelms a single box; and trusting client timestamps, which lets a buggy or malicious app inject out-of-order or future-dated pings — you must reject stale/implausible updates (speed-gating) and key freshness off server receipt time, not device time.
:::
<!-- @starci/seperator -->
