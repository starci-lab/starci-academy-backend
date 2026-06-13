# question
<!-- @starci/seperator -->
When a seller updates a product price or marks it out of stock, how quickly should that show up in search, and how do you keep the index fresh? Compare near-real-time indexing against batch rebuilds, and explain the read/write trade-off that makes "instant freshness" expensive.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Index Freshness
## 1
<!-- @starci/seperator -->
NRT Indexing
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Drive indexing from a change stream: product updates emit events (CDC from the database or an application event bus), an indexing pipeline consumes them, re-analyzes the affected documents, and writes them into the index. For near-real-time freshness, engines write incoming documents into small in-memory segments that become searchable within a second or two via a periodic "refresh", while the durable on-disk segments are merged in the background; this is how Lucene-based systems (Elasticsearch, Solr) offer sub-second visibility. Because inverted-index segments are immutable, an update is implemented as delete-plus-insert: the old document is tombstoned and a new segment holds the new version. You pick a freshness SLA per use case — out-of-stock should propagate in seconds (a stale "in stock" result is a bad experience), while a full reindex after a mapping change can run as a periodic batch.
:::

:::muted
**Trade-off** — This is the core read/write tension: the inverted index is optimized for fast reads, so every write costs analysis, segment creation, and eventual merging, and pushing freshness toward real-time multiplies that write and merge overhead, consuming CPU and I/O that competes with query serving. Frequent refreshes create many tiny segments that slow queries until merged, while infrequent refreshes save resources but increase staleness. Batch rebuilds are throughput-efficient and produce clean, well-compacted segments (great for read latency) but leave the index minutes-to-hours stale. So you trade write cost and operational complexity for freshness, and you can tune the refresh interval and merge policy to sit anywhere on that curve.
:::

:::muted
**Pitfall & Failure mode** — The dominant failure is indexing lag: if the pipeline falls behind (a backlog in the change stream, a slow consumer, or a merge storm), search silently serves stale data while the database is correct, so you must monitor end-to-end indexing latency, not just queue depth. Refreshing too aggressively triggers segment-count explosion and merge thrash that tank query latency — a classic self-inflicted outage. Update-as-delete-plus-insert accumulates tombstones, bloating the index until merges reclaim them, so heavy update workloads need a merge policy that keeps deleted-doc ratios in check. Finally, ordering and idempotency matter: out-of-order events can resurrect a deleted document, so version each document and drop stale updates.
:::
<!-- @starci/seperator -->
