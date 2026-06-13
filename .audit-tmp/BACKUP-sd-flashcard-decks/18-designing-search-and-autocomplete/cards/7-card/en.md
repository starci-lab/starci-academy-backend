# question
<!-- @starci/seperator -->
Put it all together: design the end-to-end search platform for a large marketplace — ingestion, indexing, the query path, ranking, and autocomplete — serving tens of thousands of queries per second over hundreds of millions of documents. How do the pieces fit, where are the bottlenecks, and what do you trade off to keep it fast, fresh, and relevant at scale?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
staff
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
System Design
## 1
<!-- @starci/seperator -->
Architecture
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Split the system into a write path and a read path joined by the index. On the write path, document changes flow from the source of truth via CDC or an event bus into an indexing pipeline that normalizes, enriches, and analyzes documents, then writes them into a document-sharded, replicated inverted index with near-real-time refresh. On the read path, a query service analyzes the incoming query (tokenize, spell-correct, expand synonyms), a coordinator scatters it to all shards, each shard retrieves and cheaply scores candidates with BM25, and the coordinator gathers per-shard top-K and applies a heavier learned re-ranker that blends relevance with business signals over the small merged candidate set. Autocomplete is a separate, simpler service backed by an in-memory prefix structure of popular queries with cached top-K, refreshed from query logs on a schedule. Wrap it all with caching (popular-query result cache, autocomplete cache), aggressive timeouts, and a coordinator that returns partial results if a shard is slow. The guiding principle is cheap-and-wide retrieval first, expensive-and-narrow ranking second, with freshness driven asynchronously off the write path.
:::

:::muted
**Trade-off** — Every layer encodes a deliberate trade. The index is a derived, eventually-consistent store, so you accept staleness and a separate consistency surface in exchange for read speed. Document sharding buys parallel indexing and corpus scaling at the price of all-shard fan-out and tail latency. Two-stage ranking buys cheap high-recall retrieval plus precise re-ranking at the price of recall lost in stage one and a serving/training ML pipeline to maintain. Caching buys throughput and latency at the price of cache staleness and invalidation complexity. Near-real-time freshness buys quick visibility at the price of write/merge overhead competing with queries. The art is choosing per-component SLAs — freshness, p99 latency, relevance quality — and provisioning replicas and refresh intervals to hit them without overspending.
:::

:::muted
**Pitfall & Failure mode** — At this scale the failures are systemic. Tail latency dominates because fan-out means one slow replica slows every query, so you need hedged requests, per-shard timeouts, and partial-result tolerance. The indexing pipeline is a silent single point of staleness: lag or a poison message stalls freshness while everything looks healthy, so monitor end-to-end indexing latency and make the pipeline idempotent and replayable. Ranking degrades from feedback loops and training/serving skew, so A/B test changes and keep a relevance floor against business-signal over-tuning. Hot shards and hot queries (a viral product, a celebrity search) concentrate load, mitigated by balanced sharding plus result caching. And the two stores (database and index) drift, so build reconciliation and a clean full-reindex path you can run without downtime when the index is found to be wrong.
:::
<!-- @starci/seperator -->
