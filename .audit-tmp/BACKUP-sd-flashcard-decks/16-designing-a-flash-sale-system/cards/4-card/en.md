# question
<!-- @starci/seperator -->
Every request in the sale reads and writes the exact same product and the exact same stock counter, so one cache shard and one counter become a single melting hot key while the rest of your cluster sits idle. How do you mitigate the hot-key problem for both reads and writes?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Hot Key
## 1
<!-- @starci/seperator -->
Sharding
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Split the problem into the read hot key and the write hot key. For reads, the product detail is nearly static, so serve it from the CDN and from per-node local in-memory caches with a short TTL, so the vast majority of reads never touch the shared cache shard at all; you can also replicate the key to several nodes or append a small random suffix to fan reads across shards. For writes, shard the single counter into N sub-counters (for 1,000 units, ten buckets of 100), route each decrement to one bucket by hashing the user, and treat the sale as sold out when all buckets reach zero — this spreads contention across N keys and N times the throughput. A common refinement is local in-memory aggregation: each app node holds a small reserved slice of stock granted in batches from the central counter, serves decrements locally, and only goes back to the source when its slice runs low.
:::

:::muted
**Trade-off** — Splitting the counter trades exactness of the global view for write throughput: at any instant no single place knows the precise remaining total, and you can sell slightly unevenly across buckets, so you accept approximate accounting plus a reconciliation step. Local in-memory aggregation is even faster but widens the window where a node holds reserved-but-unsold stock, which can leave the last few units stranded on a node while users elsewhere see sold out. Replicating the read key improves read fan-out but multiplies invalidation work and risks brief inconsistency when the product changes mid-sale.
:::

:::muted
**Pitfall & Failure mode** — The signature failure is silent: monitoring shows the cluster at 10% CPU while one node or shard is pinned at 100% and tail latency explodes, because aggregate metrics hide the single hot key. With bucketed counters, a poor hash or skewed routing drains some buckets while others stay full, so the sale reports sold out with stock still reservable — you must rebalance or let drained requests fall through to non-empty buckets. Local slices can strand inventory at the end of the sale (units reserved on a node that no longer gets traffic), so you need a timed flush-back of unsold reservations. And stampeding cache misses are deadly here: if the hot read key expires at the peak, thousands of requests simultaneously regenerate it against the database unless you use request coalescing or a never-expire-with-async-refresh strategy.
:::
<!-- @starci/seperator -->
