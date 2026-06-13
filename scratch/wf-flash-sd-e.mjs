export const meta = {
  name: 'flashcards-sd-e',
  description: 'Write 4 new System Design "design a real system" flashcard decks (flash-sale, ride-hailing, search, webhook)',
  phases: [{ title: 'Write decks' }],
}

const SPEC = `You are writing an interview-prep flashcard deck for StarCi Academy System Design. Output is markdown files seeded into a DB. Match this EXACT format and depth. Do NOT read-then-overwrite, modify, or delete any existing file outside your target deck folder.

FILE FORMAT (every separator is the literal line  <!-- @starci/seperator -->  alone on its own line)

Deck meta en.md:
# title
<!-- @starci/seperator -->
THE TITLE
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
one to two sentence description
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
medium
<!-- @starci/seperator -->
# moduleRefs
## 0
<!-- @starci/seperator -->
module-display-id-one
<!-- @starci/seperator -->

Deck meta vi.md: identical structure, Vietnamese title and description, SAME difficulty and SAME moduleRefs.

Card en.md (one folder per card: cards/0-card/en.md ... cards/7-card/en.md):
# question
<!-- @starci/seperator -->
the scenario-driven interview question
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
one of: junior | middle | senior | staff
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Tag1
## 1
<!-- @starci/seperator -->
Tag2
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — three to six substantial sentences
:::

:::muted
**Trade-off** — three to six substantial sentences
:::

:::muted
**Pitfall & Failure mode** — three to six substantial sentences
:::
<!-- @starci/seperator -->

Card vi.md: identical structure; question and answer in Vietnamese WITH full diacritics; level and tags IDENTICAL to en.md (keep the English tag strings); the three bold labels in vi.md are exactly: **Giải pháp**, **Trade-off**, **Cạm bẫy & Failure-mode**.

QUALITY BAR: this is a "design a real system" deck — questions should walk through designing/operating the named system (a requirement, a bottleneck, a trade-off, a failure). Never a bare "What is X?". Each of the three answer blocks must be genuinely substantial and technically correct. Vietnamese must be natural and fully accented; do not force-translate technical terms.`

function buildPrompt(deck) {
  return `${SPEC}

## TARGET
Create NEW deck folder (relative to repo root): ${deck.path}
- Deck title (en): "${deck.titleEn}"
- Deck title (vi): "${deck.titleVi}"
- difficulty: medium
- moduleRefs (use these exact displayIds, in this order): ${deck.refs.join(', ')}
Write the deck meta en.md and vi.md, then 8 cards in cards/0-card ... cards/7-card (each en.md + vi.md).

## THE 8 TOPICS (one card each; vary level across junior/middle/senior/staff, roughly 1 junior, 2-3 middle, 3-4 senior, 1 staff)
${deck.topics}

## VALIDATE BEFORE FINISHING (run this bash and fix anything reported)
bash -c 'd="${deck.path}"; for f in "$d"/cards/*/en.md "$d"/cards/*/vi.md; do n=$(grep -cE "^# (question|level|tags|answer)$" "$f"); [ "$n" -ne 4 ] && echo "BAD $f ($n/4)"; done; echo "files: $(find "$d" -type f | wc -l) (expect 18)"'
Fix any BAD file or a count != 18. Report final file count and level distribution.`
}

const decks = [
  {
    label: 'sd16-flash-sale',
    path: '.mount/data/courses/1-system-design-mastery/flashcard-decks/16-designing-a-flash-sale-system',
    titleEn: 'Designing a Flash-Sale System',
    titleVi: 'Thiết Kế Hệ Thống Flash-Sale',
    refs: ['ecommerce-flash-sale-system'],
    topics: `0. The core challenge of a flash sale — a huge synchronized traffic spike on a tiny, limited inventory. (junior)
1. Preventing oversell — atomic stock decrement (Redis/DB), and why a naive read-then-write oversells under concurrency. (senior)
2. Admission control — queueing/throttling users (virtual waiting room, token bucket) so the backend is never stampeded. (senior)
3. Idempotent checkout — making "buy" safe against double-clicks and client retries with an idempotency key. (middle)
4. Hot-key problem — one product is read/written by everyone; caching, sharding the counter, and local in-memory aggregation. (senior)
5. Payment + reservation flow — holding stock during payment, timeouts, and releasing unpaid reservations. (middle)
6. Caching the product/landing page — serving a mostly-static page from CDN while the buy endpoint stays consistent. (middle)
7. Designing the end-to-end flash sale at scale — queue, inventory service, payment, and graceful degradation under overload. (staff)`,
  },
  {
    label: 'sd17-ride-hailing',
    path: '.mount/data/courses/1-system-design-mastery/flashcard-decks/17-designing-a-ride-hailing-system',
    titleEn: 'Designing a Ride-Hailing System',
    titleVi: 'Thiết Kế Hệ Thống Gọi Xe',
    refs: ['ride-hailing-system'],
    topics: `0. The core problem — match nearby drivers to riders in real time as both move. (junior)
1. Geospatial indexing — geohash / quadtree / S2 cells, and how a "drivers near me" query actually runs. (senior)
2. Driver location updates — handling millions of frequent GPS pings without melting the database. (senior)
3. The matching algorithm — nearest vs ETA-optimal, avoiding double-assigning one driver, and dispatch race conditions. (senior)
4. Surge pricing — computing demand/supply imbalance per area and applying it consistently to a trip quote. (middle)
5. Trip state machine — requested → accepted → in-progress → completed, and surviving an app/network drop mid-trip. (middle)
6. ETA and routing — precompute vs on-demand, and caching map/route data at scale. (middle)
7. Designing the end-to-end system — location ingestion, matching, pricing, trip lifecycle, and regional sharding. (staff)`,
  },
  {
    label: 'sd18-search-autocomplete',
    path: '.mount/data/courses/1-system-design-mastery/flashcard-decks/18-designing-search-and-autocomplete',
    titleEn: 'Designing Search & Autocomplete',
    titleVi: 'Thiết Kế Search & Autocomplete',
    refs: ['distributed-search-autocomplete-system'],
    topics: `0. The core problem — return relevant results for a free-text query in tens of milliseconds. (junior)
1. The inverted index — how it maps terms to documents and why it makes full-text search fast. (middle)
2. Autocomplete — trie vs prefix-indexed n-grams, ranking suggestions by popularity, and sub-50ms latency. (senior)
3. Ranking — TF-IDF/BM25 vs learned ranking, and combining relevance with business signals. (senior)
4. Typo tolerance and fuzzy matching — edit distance, and the precision/latency cost of fuzziness. (middle)
5. Sharding and replicating the index — scatter-gather across shards and merging ranked results. (senior)
6. Keeping the index fresh — near-real-time indexing vs batch, and the read/write trade-off. (middle)
7. Designing the end-to-end search system — ingestion, indexing, query, ranking, and autocomplete at scale. (staff)`,
  },
  {
    label: 'sd19-webhook-delivery',
    path: '.mount/data/courses/1-system-design-mastery/flashcard-decks/19-designing-a-webhook-delivery-system',
    titleEn: 'Designing a Webhook Delivery System',
    titleVi: 'Thiết Kế Hệ Thống Gửi Webhook',
    refs: ['webhook-delivery-system'],
    topics: `0. The core problem — reliably deliver an event to many third-party HTTP endpoints you do not control. (junior)
1. At-least-once delivery with retries — exponential backoff + jitter, and capping attempts before a dead-letter. (senior)
2. Idempotency and signing — delivery ids + HMAC signatures so consumers can dedupe and verify authenticity. (middle)
3. Isolating slow/failing subscribers — per-endpoint queues/concurrency so one bad consumer cannot block others. (senior)
4. Ordering — when consumers need ordered events, and the cost of strict ordering vs throughput. (senior)
5. Dead-letter handling and replay — surfacing permanently-failed deliveries and letting subscribers replay. (middle)
6. Rate limiting per subscriber — respecting a consumer endpoint's capacity to avoid hammering it. (middle)
7. Designing the end-to-end webhook platform — ingestion, fan-out, retries, DLQ, and subscriber observability. (staff)`,
  },
]

phase('Write decks')
const results = await parallel(decks.map((d) => () => agent(buildPrompt(d), { label: d.label, phase: 'Write decks' })))
return results
