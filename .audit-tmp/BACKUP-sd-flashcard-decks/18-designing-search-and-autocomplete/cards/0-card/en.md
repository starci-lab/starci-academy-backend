# question
<!-- @starci/seperator -->
You are designing the search box for a catalog of 50 million products. A user types "wireless headphones" and expects relevant results back in well under 100ms. Why can't you just run a `SELECT ... WHERE name LIKE '%wireless headphones%'` against the products table, and what is the core problem a search system has to solve instead?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
junior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Search Basics
## 1
<!-- @starci/seperator -->
Latency
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — A `LIKE '%...%'` query forces a full table scan because the leading wildcard makes any B-tree index on `name` unusable, so the database reads all 50 million rows for every query — that is hundreds of milliseconds to seconds, and it gets worse under load. The core problem search solves is mapping a free-text query to a ranked set of relevant documents in tens of milliseconds, which requires three things `LIKE` cannot do: tokenizing and normalizing text (lowercasing, stemming, stripping punctuation), pre-computing a data structure that maps words to the documents containing them, and scoring matches by relevance rather than returning them in arbitrary order. The standard answer is to build an inverted index offline and query that structure instead of the raw table. This turns "scan everything and substring-match" into "look up two terms and intersect their posting lists", which is orders of magnitude faster.
:::

:::muted
**Trade-off** — Search trades write-time and storage cost for read-time speed: you maintain a second copy of the data (the index) that must be kept in sync with the source of truth, and every document update triggers re-indexing work. You also trade exactness for relevance — search returns documents ranked by a fuzzy notion of "how well they match", not the precise boolean filter SQL gives you, so results are approximate and tuned rather than deterministic. For a catalog this is the right trade because users want the best matches, not every row that literally contains a substring.
:::

:::muted
**Pitfall & Failure mode** — The classic mistake is treating search as "just add a full-text index to Postgres and move on", which works at small scale but silently degrades as the corpus and query volume grow, and offers little control over tokenization, ranking, typo tolerance, and autocomplete. Another failure is forgetting that the index is a derived store: if the indexing pipeline lags or breaks, users see stale or missing products even though the database is correct, and these bugs are hard to spot because both systems individually look healthy. Always treat the index as eventually consistent with the database and monitor indexing lag explicitly.
:::
<!-- @starci/seperator -->
