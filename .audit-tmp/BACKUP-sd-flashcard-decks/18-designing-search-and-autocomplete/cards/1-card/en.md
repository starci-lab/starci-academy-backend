# question
<!-- @starci/seperator -->
Walk me through the inverted index that powers your product search. A user queries "wireless noise cancelling". Concretely, what data structure do you build at index time, and step by step how does it turn that three-word query into a small candidate set in a few milliseconds instead of scanning the corpus?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Inverted Index
## 1
<!-- @starci/seperator -->
Posting Lists
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — At index time you analyze each document into normalized terms (tokenize, lowercase, stem, drop stopwords) and build a dictionary mapping every term to a posting list: the sorted set of document IDs that contain it, often with per-document positions and term frequencies. For "wireless noise cancelling" you look up three posting lists — `wireless`, `noise`, `cancel` (after stemming) — and intersect them by walking the sorted lists in parallel, advancing the cursor on the smallest ID, which is O(total postings) rather than O(corpus). Because lists are sorted, you can use skip pointers to leap over large gaps, so intersecting a rare term with a common one stays cheap. The intersection yields a small candidate set of documents containing all three terms, and the stored term frequencies and positions feed the relevance scorer that ranks those candidates. The whole lookup-and-merge touches only the postings for three terms, not 50 million rows, which is why it finishes in milliseconds.
:::

:::muted
**Trade-off** — The inverted index is fast to read but expensive to maintain and store: every document insert or update must re-analyze text and splice into many posting lists, so high write rates create indexing pressure and the index is always slightly behind the source. You also choose how much to store per posting — adding positions enables phrase queries but inflates index size, while storing term frequencies enables better scoring at the cost of more memory. Compression (delta-encoding the sorted doc IDs, variable-byte or PForDelta) shrinks the index dramatically but adds CPU work to decode during queries, trading memory for compute.
:::

:::muted
**Pitfall & Failure mode** — The biggest correctness pitfall is mismatched analysis between indexing and querying: if you stem or lowercase documents but not queries (or use different tokenizers), terms silently fail to match and results look broken with no error. Stopword and stemming choices also bite — dropping "not" or over-stemming can change meaning, and very common terms produce huge posting lists that dominate intersection cost. At scale, an unbounded posting list for a hot term (or a query of all common words) can blow up latency, so you need skip lists, early termination, and sometimes per-term caps; ignoring this lets one pathological query degrade the whole node.
:::
<!-- @starci/seperator -->
