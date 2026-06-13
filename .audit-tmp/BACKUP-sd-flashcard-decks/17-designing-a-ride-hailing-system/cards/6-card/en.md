# question
<!-- @starci/seperator -->
Every match candidate needs an ETA, every active trip needs a route, and the map renders for millions of users — that's a huge volume of routing work. How do you design ETA/routing: precompute versus on-demand, and how do you cache map and route data at scale?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
ETA
## 1
<!-- @starci/seperator -->
Caching
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Split the road network into tiles/regions and precompute the slow, stable parts offline — contraction-hierarchy or partitioned shortest-path structures over a graph whose edge weights are travel-time, refreshed periodically and updated with live traffic. At request time you only run a cheap query against these prebuilt structures rather than a cold Dijkstra over the whole map. For matching, you do not need exact routes for every candidate: estimate ETA cheaply (haversine adjusted by a road-factor, or a coarse zone-to-zone travel-time matrix) to rank candidates, and compute a precise route only for the chosen driver and the active trip. Cache aggressively at multiple layers — immutable map tiles on a CDN, popular origin/destination ETAs and zone-pair times in Redis with short TTLs, and per-trip routes recomputed only when the driver deviates.
:::

:::muted
**Trade-off** — Precomputation gives millisecond reads but goes stale as traffic shifts, so you trade freshness for speed and must re-run or patch the structures on a cadence; fully on-demand routing is always current but too slow and expensive to do per candidate at match time. Coarse ETA estimates are cheap and scale to every candidate but are less accurate, while exact routing is accurate but reserved for the few requests that justify it. Caching ETAs with a long TTL maximizes hit rate but serves outdated times during incidents; short TTLs stay fresh but raise compute load, so the TTL is tuned by how volatile traffic is in that area.
:::

:::muted
**Pitfall & Failure mode** — Running a full graph search per candidate at dispatch is the classic blow-up: latency spikes and the routing tier becomes the bottleneck under load. Serving stale cached ETAs through a sudden incident (a crash closing a highway) routes drivers into jams and quotes wrong arrival times, eroding trust — you need live-traffic invalidation, not just time-based expiry. A thundering herd on a popular route after cache eviction can hammer the routing service; use request coalescing or stale-while-revalidate. And conflating straight-line distance with ETA for ranking picks geometrically-near but road-far drivers, so the candidate cut may use distance but the final rank must use a time estimate.
:::
<!-- @starci/seperator -->
