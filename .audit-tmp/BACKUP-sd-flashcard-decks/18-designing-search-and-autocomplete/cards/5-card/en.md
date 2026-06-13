# question
<!-- @starci/seperator -->
The index no longer fits on one machine and query volume is climbing. Design how you shard and replicate the inverted index. Explain the scatter-gather query path, how you correctly merge ranked results across shards, and why global scoring is the subtle hard part.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Sharding
## 1
<!-- @starci/seperator -->
Scatter-Gather
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Shard the index by document (each shard owns a subset of documents and holds a complete inverted index over just those docs), which is the standard choice because it keeps each shard self-contained and scales with corpus size. A coordinator receives the query, scatters it to all shards (or all shard replicas), each shard retrieves and scores its own top-K locally, and the coordinator gathers the per-shard top-K lists and merges them into a global top-K — typically a k-way merge of sorted lists. Replicate each shard across several nodes for availability and read throughput, routing each query to one replica per shard and load-balancing across them. To scale reads you add replicas; to scale corpus you add shards. The fan-out means total latency is bounded by the slowest shard, so you size shards so each finishes its local search well within budget.
:::

:::muted
**Trade-off** — Document sharding makes indexing and storage trivially parallel but makes every query a fan-out to all shards, so tail latency is governed by the slowest replica and adding shards increases the chance any one is slow (the tail-amplification problem). The alternative, term sharding (each shard owns certain terms), avoids fan-out for single-term queries but makes multi-term intersection require cross-shard data movement and creates hot shards for popular terms, so it's rarely used. Replication trades storage and write amplification (every replica must be updated) for read scalability and fault tolerance. More shards mean more parallelism but also more coordination overhead and a higher fixed per-query fan-out cost.
:::

:::muted
**Pitfall & Failure mode** — The subtle correctness trap is global scoring: BM25 and IDF depend on corpus-wide term statistics (document frequency), but each shard only sees its own documents, so locally computed IDF differs per shard and naively merging local scores produces inconsistent global ranking — you need distributed term statistics or a two-pass approach to make scores comparable. The classic operational failure is the slow-shard / straggler: one degraded replica makes every query slow, mitigated with hedged requests, per-shard timeouts, and replica health checks. Under-fetching is another trap — if each shard returns only its top-K but the true global top-K is skewed onto one shard, you must request enough per shard to guarantee correctness. Finally, uneven document distribution creates hot shards, so shard by a balanced key, not by something correlated with query traffic.
:::
<!-- @starci/seperator -->
