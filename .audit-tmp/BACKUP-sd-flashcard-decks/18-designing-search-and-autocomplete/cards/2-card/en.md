# question
<!-- @starci/seperator -->
Design the autocomplete that fires on every keystroke as the user types in the search box. It must return the top suggestions in under 50ms, ranked by popularity, for millions of users. Compare a trie against prefix-indexed n-grams, and explain how you get popularity-ranked suggestions back that fast.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Autocomplete
## 1
<!-- @starci/seperator -->
Trie
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Build a prefix structure over the set of popular queries, not over the document corpus, so autocomplete searches "what have people typed" rather than "what products exist". A trie maps each prefix to its descendants; the key optimization is to precompute and cache, at each node, the top-K completions by popularity (a small sorted list or a heap snapshot), so on a keystroke you walk to the prefix node in O(prefix length) and read the cached top-K directly — no subtree traversal at query time. The alternative, prefix-indexed n-grams, stores edge n-grams (or completion strings keyed by prefix) in an inverted index or a search engine's completion suggester, which is easier to shard, update, and integrate with existing infrastructure but uses more memory and gives less precise prefix semantics. Either way you serve suggestions from memory, debounce keystrokes client-side, and keep the hot prefixes cached so the median request never touches disk, which is how you hold p99 under 50ms.
:::

:::muted
**Trade-off** — The trie with cached top-K is blazing fast to read but rigid to update: recomputing a node's top-K when a query's popularity changes ripples up every ancestor, so it favors periodic batch rebuilds over real-time freshness, and an in-memory trie for a large query set is RAM-hungry and must be sharded by prefix. N-gram / suggester indexes update more incrementally and reuse your search cluster, trading some latency and memory bloat for operational simplicity and easier fuzzy/middle-of-string matching. You also trade coverage for speed: caching only the top-K per node means rare long-tail completions may be dropped, which is usually acceptable because users want popular suggestions.
:::

:::muted
**Pitfall & Failure mode** — The most common failure is unbounded fan-out at short prefixes: a single-letter prefix has millions of descendants, so without precomputed top-K you traverse a huge subtree per keystroke and blow the latency budget. Forgetting client-side debouncing hammers the backend with a request per character, multiplying load tenfold. Staleness is another trap — if popularity updates lag, you keep suggesting yesterday's trends or, worse, suggestions for queries that now return nothing. Finally, autocomplete must respect safety and personalization filters (no offensive or out-of-stock suggestions, locale-aware results); bolting these on at query time can quietly push you back over the 50ms ceiling if not baked into the cached lists.
:::
<!-- @starci/seperator -->
