# question
<!-- @starci/seperator -->
Put it all together: design the end-to-end ride-hailing platform — location ingestion, matching, pricing, and trip lifecycle — running across many cities on several continents. How do you decompose the services and shard by region so the whole thing scales and stays available?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
staff
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Architecture
## 1
<!-- @starci/seperator -->
Sharding
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Decompose by capability: a location-ingestion tier (persistent connections feeding a Redis/in-memory geo-index plus a Kafka stream for history), a matching/dispatch service that reads the index and atomically claims drivers, a pricing service publishing surge per zone, a trip service owning the durable state machine and billing, and supporting routing/ETA, notification, and payment services. Shard the entire stack by geography — a ride is intrinsically local, so a driver and rider in the same city only ever touch that region's cells, matcher, and trip store. Run region-pinned cells routed by a geo-aware gateway, so each region is an almost-independent unit with its own location index, dispatch, and database, and cross-region traffic is rare (long airport trips, account/global config). Glue regions with a global service mesh for identity, payments, and config, and stream events (trip completed, payment captured) onto a backbone for analytics and fraud asynchronously.
:::

:::muted
**Trade-off** — Regional sharding gives natural horizontal scale, data locality, fault isolation, and low latency (the request never leaves the city), but it complicates the rare cross-boundary case and requires routing logic plus rebalancing as cities grow or split. Keeping the matching hot path in Redis/memory per region maximizes speed but trades durability — you accept that a node loss drops live location state that drivers quickly repopulate, while the trip/billing store stays strongly consistent and durable. You also choose per-region strong consistency for dispatch and trip state (no double-assignment, exact billing) against eventual consistency for the global plane (analytics, heat maps, cross-region profile sync), keeping the strict guarantees where money and safety live and relaxing them where staleness is harmless.
:::

:::muted
**Pitfall & Failure mode** — The big failure is a single global database or matcher becoming a chokepoint and a blast radius — one region's spike or outage taking down everyone — which regional isolation specifically prevents, so a flat non-sharded design will not survive multi-continent scale. Boundary cells between regions can drop or double-handle drivers near the seam unless ownership is explicit. Hotspots (airports, concerts, New Year's Eve) overload a single region's dispatch and surge path, demanding autoscaling and backpressure. And global dependencies on the hot path — synchronous payment auth or a central config lookup before a match — couple every dispatch to a distant service; keep matching local and push payments, fraud, and analytics off to asynchronous flows so a remote dependency's latency or outage never blocks getting a rider into a car.
:::
<!-- @starci/seperator -->
