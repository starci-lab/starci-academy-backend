export const meta = {
  name: 'flashcards2-sd',
  description: 'Write 2 new System Design flashcard decks into .gitrefs/data: designing-a-web-crawler, distributed-coordination-and-consensus',
  phases: [{ title: 'Write decks' }],
}

const SPEC = `You are writing an interview-prep flashcard deck for StarCi Academy System Design. Output is markdown files seeded into a DB. Match this EXACT format and depth. Do NOT read-then-overwrite, modify, or delete any existing file outside your target deck folder.

IMPORTANT: write files under .gitrefs/data (the real content git source), NOT .mount (which is a detachable cache).

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

QUALITY BAR: questions must be concrete and scenario-driven (a symptom, a trade-off, a design choice) — never a bare "What is X?". Each of the three answer blocks must be genuinely substantial and technically correct. Vietnamese must be natural and fully accented; do not force-translate technical terms (keep crawler, frontier, consensus, quorum, leader election, etc.).`

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
    label: 'sd20-crawler',
    path: '.gitrefs/data/courses/1-system-design-mastery/flashcard-decks/20-designing-a-web-crawler',
    titleEn: 'Designing a Web Crawler',
    titleVi: 'Thiết Kế Web Crawler',
    refs: ['high-performance-web-crawler-search-engine'],
    topics: `0. The core problem — fetch billions of pages politely without endlessly re-fetching the same ones. (junior)
1. The URL frontier — prioritization, dedup with a bloom filter, and per-domain politeness queues. (senior)
2. Politeness — honoring robots.txt, per-host rate limiting, and crawl-delay. (middle)
3. Duplicate and near-duplicate detection — content hashing, shingling, and simhash. (senior)
4. Distributed crawling — partitioning the URL space across workers and coordinating them. (senior)
5. Freshness — recrawl scheduling and change detection so the index does not go stale. (middle)
6. Crawler traps — infinite calendars, session-id URLs, and malicious infinite spaces. (middle)
7. Designing the end-to-end crawler at web scale — frontier, fetchers, parser, dedup, storage, and indexer. (staff)`,
  },
  {
    label: 'sd21-coordination',
    path: '.gitrefs/data/courses/1-system-design-mastery/flashcard-decks/21-distributed-coordination-and-consensus',
    titleEn: 'Distributed Coordination & Consensus',
    titleVi: 'Phối Hợp Phân Tán & Consensus',
    refs: ['distributed-locks-and-leader-election'],
    topics: `0. Why coordination is hard — no global clock, partial failure, and messages that get lost or delayed. (junior)
1. Distributed locks — Redis Redlock vs a lease, and why you need a fencing token to be safe. (senior)
2. Leader election — why systems need a single leader, split-brain, and how it goes wrong. (senior)
3. Consensus (Raft / Paxos) — quorum, why an odd number of nodes, and what the leader guarantees. (senior)
4. ZooKeeper / etcd — what coordination primitives they provide and when to reach for them. (middle)
5. Idempotency under coordination failure — surviving a lock holder that dies mid-operation. (middle)
6. Clock skew and ordering — why wall clocks lie, and logical/Lamport clocks for event ordering. (middle)
7. Designing a distributed lock / scheduler service at scale — availability, fencing, and failover. (staff)`,
  },
]

phase('Write decks')
const results = await parallel(decks.map((d) => () => agent(buildPrompt(d), { label: d.label, phase: 'Write decks' })))
return results
