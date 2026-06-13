export const meta = {
  name: 'flashcards2-devops-b',
  description: 'Write 2 new DevOps flashcard decks into .gitrefs/data: observability-and-monitoring, sre-and-incident-response',
  phases: [{ title: 'Write decks' }],
}

const SPEC = `You are writing an interview-prep flashcard deck for StarCi Academy DevOps Mastery. Output is markdown files seeded into a DB. Match this EXACT format and depth. Do NOT read-then-overwrite, modify, or delete any existing file outside your target deck folder.

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

QUALITY BAR: questions must be concrete and scenario-driven (a symptom, a trade-off, a design choice) — never a bare "What is X?". Each of the three answer blocks must be genuinely substantial and technically correct. Vietnamese must be natural and fully accented; do not force-translate technical terms (keep metric, trace, SLO, error budget, postmortem, etc.).`

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
    label: 'devops8-observability',
    path: '.gitrefs/data/courses/2-devops-mastery/flashcard-decks/8-observability-and-monitoring',
    titleEn: 'Observability & Monitoring',
    titleVi: 'Observability & Monitoring',
    refs: ['linux-fundamentals'],
    topics: `0. Metrics vs logs vs traces — the three pillars, what each answers, and when to reach for which. (middle)
1. Prometheus — the pull model, metric types (counter/gauge/histogram), and cardinality blowup. (senior)
2. Dashboards that matter — the RED (rate/errors/duration) and USE (utilization/saturation/errors) methods. (middle)
3. SLI / SLO / error budgets — defining a good SLI and burn-rate alerting instead of static thresholds. (senior)
4. Structured logging — JSON logs, correlation ids, and centralized aggregation. (middle)
5. Alerting philosophy — page on user-facing symptoms not internal causes, and fighting alert fatigue. (middle)
6. Distributed tracing — spans, context propagation across services, and sampling. (senior)
7. Designing observability for a large fleet on a budget — controlling cardinality, retention, and sampling cost. (staff)`,
  },
  {
    label: 'devops9-sre',
    path: '.gitrefs/data/courses/2-devops-mastery/flashcard-decks/9-sre-and-incident-response',
    titleEn: 'SRE & Incident Response',
    titleVi: 'SRE & Xử Lý Sự Cố',
    refs: ['linux-fundamentals'],
    topics: `0. What SRE actually is — toil, error budgets, and treating reliability as a feature with a budget. (junior)
1. The incident lifecycle — detect, triage, mitigate, resolve, and the roles during an incident. (middle)
2. Blameless postmortems — why blame kills learning, and writing action items that actually land. (middle)
3. Reducing MTTR — runbooks, good alerting, and on-call rotation that doesn't burn people out. (senior)
4. Capacity planning and load testing — finding the breaking point before real traffic does. (senior)
5. Graceful degradation and kill-switches — shedding load and disabling features under overload. (senior)
6. Chaos engineering — proving resilience by deliberately injecting failure in controlled experiments. (middle)
7. Designing the reliability program for a growing org — SLOs, error budgets, and systematic toil reduction. (staff)`,
  },
]

phase('Write decks')
const results = await parallel(decks.map((d) => () => agent(buildPrompt(d), { label: d.label, phase: 'Write decks' })))
return results
