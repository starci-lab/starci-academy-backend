# FE design gates and intent

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | C:/Repositories/ac/starci-academy-backend |
| Source | C:/Repositories/ac/starci-academy-backend |
| Project | starci-academy-fe — user-declared in the active workflow |
| Frontend | C:/Repositories/starci-academy-fe |
| Backend | C:/Repositories/ac/starci-academy-backend |
| Trust | C:/Repositories/ac/starci-academy-backend/.claude |
| Skills | C:/Repositories/ac/starci-academy-backend/.claude/skills |
| App | starci-academy-fe |
| Repo / branch | Source C:/Repositories/ac/starci-academy-backend (mtp); Trust C:/Repositories/ac/starci-academy-backend/.claude (main); Frontend C:/Repositories/starci-academy-fe (main) |
| Purpose | Plan one iterative FE design journey: multi-surface layout proposals, per-block proposals, whitelist-bound execution, professional searchable memory, and an intent shelf beside gates. |
| Workflow root | C:/Repositories/ac/starci-academy-backend/.workflows |
| Workflow | C:/Repositories/ac/starci-academy-backend/.workflows/upgrade/starci-academy-fe/fe-design-gates-and-intent.md |
| Language | vi |
| Phase | plan |
| Window | All current `starci-academy-fe` upgrade records plus the active founder corrections that supersede the one-shot layout handoff. |
| Touching | This workflow file only. Plan writes no Trust rule, skill, schema, source, preview or target frontend file. |

### OBJECTIVE

Replace the five-gate chain with one explicit journey:

```text
starci-fe-design-plan
  -> starci-fe-design-layout
       one or more target surfaces
       -> 3-4 layout candidates per target
       -> prompt / alter / reject rounds until selected
       -> layout whitelist
  -> starci-fe-design-block
       selected layout block inventory
       -> 3-4 render candidates per block
       -> prompt / alter / reject rounds until selected
       -> block whitelist
  -> starci-fe-design-execute
       principles -> patterns -> lints -> code -> proof
```

Only `layouts` and `blocks` are divergent choice gates. `principles`, `patterns`, and `lints` are a
linear executor over hashes already accepted by the founder. They may return an unresolved decision
to its owning gate; they may not silently redesign it.

### REFUSAL GROUPS

#### G1 — A design gate is an iterative proposal loop, not one recommendation

| Witness | Refusal |
|---|---|
| `business-to-layout-json-gate.md` REJECTED | “Một JSON duy nhất” was replaced by “3–4 full JSON candidates”. |
| `business-to-layout-json-gate.md` REJECTED | Treating design-plan as another rendering gate was replaced by making it the journey orchestrator. |
| Active founder correction 1 | “mỗi cái trò gửi thầy sẽ prompt liên tục để alter ấy, đến khi chốt rồi”. |
| Active founder correction 2 | “thầy chưa ưng, prompt tiếp,... ưng chọn 1 qua fe-block”. |

The rules at the time only described `recommendation.json` followed by one `decision.json` under
`layouts`; they did not model an immutable sequence of prompt/response rounds.

Proposed rule: **Every divergent unit is an append-only round loop. A round preserves the exact user
prompt, full candidate set, assistant response, delta from the previous round, verdict, hashes and
rejections. Only an explicit accepted verdict may enter a whitelist.**

Home: shared gate session schema, layouts/blocks gate schemas, design-layout/design-block PROCESS.

#### G2 — Layout owns a complete surface graph, including every extension it discovers

| Witness | Refusal |
|---|---|
| `business-to-layout-json-gate.md` REJECTED | Regions-only output was refused; Gate 1 must preserve the page's complete main/extends/block intent. |
| Active founder correction | “layouts có thể áp dụng cho modals, drawers, pages, layouts,...”. |
| Active founder correction | “làm page A thì extends vẫn có thể là modal B; trừ khi chủ đích làm modal B thì khác”. |

The current layout schema assumes a page-shaped business request and gives extensions only a brief,
so Modal B can be mentioned by Page A without ever receiving its own complete design.

Proposed rule: **Every layout request starts with one or more root `targetSurface` objects. Each
surface has a kind (`page`, `layout`, `modal`, `drawer`, `overlay`) and receives its own 3–4 candidate
set. `main` is that surface's internal primary distribution. Every `extends` entry is an edge to a
dependent surface. Once the parent candidate is accepted, each dependent surface is enqueued and
fully designed through the same layout loop. Gate 1 completes only when the entire reachable surface
graph has accepted layout hashes, or the founder explicitly rejects an edge and a new parent round
removes it.**

Home: layouts schema/INDEX, layout skill PROCESS and target/extension proof fixtures.

#### G3 — Block alternatives are independent, not page-wide combinations

| Witness | Refusal |
|---|---|
| `business-to-layout-json-gate.md` REJECTED | Gate 1 cannot leave anonymous regions for Gate 2 to invent; it must emit a block inventory. |
| `business-to-layout-json-gate.md` REJECTED | A block name alone was refused; status, usage, contract, data, render, states, placement and brief are required. |
| `business-to-layout-json-gate.md` REJECTED | “3–4 page-wide block combinations” was replaced by “3–4 proposals independently for every block”. |

The current blocks schema still receives a recommended whole layout and returns a whole-page
`BlockPlanSet`. That couples unrelated block choices and loses the required cardinality.

Proposed rule: **Gate 2 consumes only a whitelisted layout. One block input returns 3–4 render
candidates. A page input with `N` blocks returns `N` independent candidate sets, for `3–4 × N`
candidates. Each candidate specifies exactly what renders: title/description slots, render form,
list/item grammar, fields and order, data, states, actions, copy slots, responsive behavior,
contract decision, ownership and pure/connected split.**

Home: blocks schema/INDEX, a new proposal-per-block law, block skill PROCESS and cardinality proofs.

#### G4 — Selection is a hash-bound whitelist, and downstream is execution only

| Witness | Refusal |
|---|---|
| `business-to-layout-json-gate.md` REJECTED | `.worktrees/<project>/...` was refused in favor of decision evidence under Source `.workflows`. |
| `business-to-layout-json-gate.md` approved rule | Gate 2 may consume only the hash-selected candidate after `decision.json` exists. |
| Active founder correction | “layouts/blocks nào ưng thì vào whitelist”. |
| Active founder correction | “còn execute thì đơn giản là thi hành thôi”. |

Proposed rule: **A whitelist is a materialized view over append-only acceptance events. It references
candidate path, candidate SHA-256, decision path and accepted actor/time; it never copies an unbound
summary. Gates 3–5 accept only a bundle whose layout and every block hash are whitelisted. They emit
one result, never candidate arrays or recommendations.**

Home: shared session/whitelist schema, all five root schemas, design-execute PROCESS and end-to-end
tamper proofs.

#### G5 — Intent informs choices but never overrides contracts or autonomy

The founder requested a shelf beside `fe/gates/` for CTA, marketing, decoy and psychology, then
explicitly required replacing the name `mindset`. The planned name is `fe/intent/`: it names the
desired user outcome and evidence without implying a personal attitude or making manipulation the
organizing concept. This is an authorized architecture requirement, but the exact taxonomy has not
yet accumulated repeated rejection witnesses. The taxonomy is therefore proposed for Review rather
than presented as learned law.

External primary evidence sets the safety floor:

| Source | Plan consequence |
|---|---|
| FTC, `Bringing Dark Patterns to Light` | Refuse disguised advertising, buried terms/fees, obstructed cancellation and consent manipulation. |
| UK CMA, `Online Choice Architecture` discussion paper and evidence review | Treat ranking, defaults, scarcity, framing and asymmetric choice as interventions requiring disclosed intent and consumer-control review. |
| W3C WCAG 2.2, Link Purpose and Target Size | CTA purpose must be understandable from programmatic context; persuasion never excuses inaccessible or ambiguous controls. |

Sources:

- https://www.ftc.gov/reports/bringing-dark-patterns-light
- https://www.gov.uk/government/collections/online-choice-architecture
- https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum

Proposed boundary: **Intent explains which honest outcome should lead, for which audience state and
with what evidence. Gates materialize and validate the selected structure. Intent cannot invent
backend facts, contract ownership, prices, urgency, scarcity, endorsements or social proof.**

### TARGET-SURFACE MODEL

One input may contain one or several independent target surfaces:

```json
{
  "targets": [
    {
      "targetId": "page-a",
      "kind": "page",
      "business": {},
      "requestedOutcome": "..."
    },
    {
      "targetId": "modal-b",
      "kind": "modal",
      "business": {},
      "requestedOutcome": "..."
    }
  ]
}
```

Each root target receives an independent 3–4 candidate set. Two input pages produce at least 6–8
layout candidates. Accepted candidates may discover more modal/drawer/layout/overlay targets; those
nodes each receive another independent 3–4 set. The gate never combines them into 3–4
application-wide mega-candidates.

For a Page A candidate:

```json
{
  "business": {},
  "main": {
    "targetId": "page-a",
    "targetKind": "page",
    "distribution": "...",
    "blocks": []
  },
  "extends": [
    {
      "surfaceRef": "modal-b",
      "kind": "modal",
      "owner": "page-a",
      "trigger": "...",
      "mount": "...",
      "renderBrief": "...",
      "designStatus": "queued"
    }
  ]
}
```

After Page A's candidate is accepted, Modal B becomes the next layout target and receives its own
3–4 candidates. If the original prompt targets Modal B directly, the same process starts with Modal
B as a root instead of a discovered node. Origin changes; design depth does not.

The session records this graph in `surface-graph.json`. Stable `surfaceId` deduplicates the same Modal
B reached from multiple parents, while each edge keeps its own owner, trigger and mount. Cycles are
reported rather than recursively generating the same surface forever.

### ROUND AND SESSION STORAGE

Use two storage planes. `.worktrees/registries/` is the durable design-memory plane and must be a
real Git worktree backed by a dedicated registry branch; it is not an ignored disposable folder.
`.worktrees/sessions/` is the hot progress plane and may be rebuilt or pruned after a durable
checkpoint. `.workflows/**` remains the governance ledger required by `AGENTS.md`: Plan, Review and
Apply prose plus registry commit/hash receipts, not duplicate candidate payloads.

```text
.worktrees/
├── registries/                         # real registry Git worktree
│   ├── registry.json                   # schema generation and registry head
│   ├── objects/
│   │   └── sha256/<first-2>/<hash>.<json|md>
│   ├── layouts/
│   │   ├── queued/<project>/<surface-id>.ref.json
│   │   ├── rejected/<project>/<surface-id>/<candidate-id>.ref.json
│   │   ├── approved/<project>/<surface-id>.ref.json
│   │   └── map/
│   │       ├── surface-graph.json
│   │       ├── current-heads.json
│   │       ├── by-contract.json
│   │       └── lineage.json
│   ├── blocks/
│   │   ├── queued/<project>/<surface-id>/<block-id>.ref.json
│   │   ├── rejected/<project>/<surface-id>/<block-id>/<candidate-id>.ref.json
│   │   ├── approved/<project>/<surface-id>/<block-id>.ref.json
│   │   └── map/
│   │       ├── by-surface.json
│   │       ├── by-render-type.json
│   │       ├── by-contract.json
│   │       └── lineage.json
│   ├── decisions/<project>/<decision-id>.json
│   ├── rejections/<project>/<decision-id>.md
│   └── schemas/{artifact,event,ref,map}.schema.json
├── sessions/                            # progress only
│   └── <decision-id>/
│       ├── session.json
│       ├── events.jsonl
│       ├── checkpoint.json
│       ├── progress.md
│       └── scratch/{preview,memory-pack,execute}/
└── cache/                               # always rebuildable
    ├── registry.sqlite
    ├── previews/
    └── memory-packs/

.workflows/<kind>/<app>/<name>.md         # governance + registry commit/hash receipt only
```

`registries`, not `registrys`, is the canonical spelling. The three status folders and `map/` contain
small reference objects, never duplicate payloads. One ref records `unitId`, `objectHash`, `status`,
`sessionId`, `roundId`, `basedOnHash`, `decisionHash`, `reasonHash`, tags and timestamps. The immutable
JSON/Markdown bytes live once under `objects/`.

#### Object identity and deduplication

1. Canonicalize JSON with RFC 8785 JCS, then hash the UTF-8 bytes with SHA-256. Whitespace or property
   order cannot create a fake new candidate.
2. Prompt, response, candidate, verdict, rejection reason and accepted decision are all immutable
   objects. A round is an event group referencing their hashes, not a directory copying their bytes.
3. Markdown remains human-readable and content-addressed. A rejection ref points to both its machine
   JSON reason and human Markdown explanation.
4. Preview HTML, screenshots and memory packs are derived cache. Keep their hashes in the event; only
   persist the bytes when the founder reviewed them or regeneration is impossible.

This follows the same separation as a content-addressable object store: immutable objects are keyed
by content, while small refs name current meaning. Git itself documents this object/ref model, and
RFC 8785 supplies deterministic JSON bytes for reliable hashing.

#### Status and editing semantics

The registry exposes exactly the requested top-level views:

| View | Meaning |
|---|---|
| `queued` | The current head being explored or reopened; it may receive another prompt. |
| `rejected` | A candidate the founder refused, revoked or superseded, with a structured reason code preserving that distinction. |
| `approved` | The one accepted current head for a layout/block unit, bound to its decision hash. |
| `map` | Deterministic graph/index projections; never hand-edited source truth. |

Every alteration includes `basedOnHash`. If two agents alter the same unit from different heads, the
second write is a conflict instead of silently overwriting the first. A short lease keyed by
`unitId` prevents concurrent writers; readers never require the lease.

State transitions are append-only events:

```text
QUEUED -> CANDIDATES_CREATED -> FEEDBACK_RECEIVED
       -> APPROVED
       -> REJECTED
APPROVED -> REOPENED -> QUEUED
```

Reopening does not mutate or delete the prior approved object. The materialized approved ref moves
to the new head only after a new acceptance; the earlier head remains reachable through lineage and
its `superseded` rejection subtype.

Accepting a layout activates its `extends` edges. Newly reachable surfaces enter `layouts/queued`.
Accepting every reachable layout populates corresponding units in `blocks/queued`. Execute can start
only when graph traversal finds no queued required surface/block and every current head is approved.

#### Search index

`cache/registry.sqlite` is a rebuildable projection, not canonical storage. Recommended tables:

| Table | Search purpose |
|---|---|
| `artifacts` | hash, kind, schema, project, surface/block identity, timestamps and byte size |
| `events` | ordered prompt/response/alter/reject/approve/reopen history |
| `units` | current status and head hash for every layout/block unit |
| `edges` | surface dependency, layout-to-block, contract use and lineage graph |
| `decisions` | accepted/rejected actor, exact target hash and reason hash |
| `tags` | business capability, route, target kind, render type, contract and intent modules |
| `documents_fts` | FTS5 index over prompts, responses, titles, reasons and rejection prose |

SQLite FTS5 supports term, prefix, phrase, proximity, boolean and ranked searches over large document
sets. WAL mode permits readers to continue while one writer updates the derived index. Because the
database is cache, corruption or schema change is cleared by replaying registry refs and session
events rather than attempting binary-source recovery.

#### LLM memory packs

Never feed a whole transcript back to the model. Build one ephemeral `memory-pack.json` for the
active unit containing only:

1. the current queued head and exact latest founder prompt;
2. approved ancestor surfaces and the relevant layout/block map slice;
3. the selected contract-registry entries, not the full registry;
4. applicable intent modules;
5. the highest-ranked rejection reasons for the same target kind/business/contract;
6. unresolved questions and token-budget accounting;
7. hashes pointing back to every omitted full artifact.

Checkpoint after each founder response and after every state transition. Checkpoints store the last
event sequence, registry commit, open units and their head hashes, so resume is O(open units) rather
than replaying the complete history. Search uses structured filters first, FTS second; embeddings are
an optional rebuildable cache only after FTS relevance is measured insufficient.

#### Durability and promotion

1. Session writes go to `sessions/<decision-id>/events.jsonl` and scratch.
2. A registry transaction writes missing immutable objects, appends events, updates small refs/maps,
   validates schemas and commits the registry worktree atomically.
3. The workflow record stores the resulting registry commit and root manifest hash.
4. A session may be pruned only after its last event sequence is present in that durable registry
   commit and no open lease/queued unit depends on scratch bytes.
5. `registry.sqlite`, previews and memory packs are always disposable; approved/rejected refs,
   objects, decisions and lineage are not.

### GATE CONTRACTS

| Gate | Input | Output | Diverges? |
|---|---|---|---|
| layouts | 1..N target-surface briefs + source/intent context | 3–4 layout candidates per target per round | Yes |
| blocks | one whitelisted layout or one named block from it | 3–4 render candidates independently per block | Yes |
| principles | selected-page bundle whose layout and all block hashes are whitelisted | one markup/node/state plan + findings | No |
| patterns | the exact principles output | one source/change plan with contracts, files and split | No |
| lints | exact source/change plan and actual lint/audit results | one pass/fail verdict and proof | No |

Executor return protocol:

```json
{
  "status": "returned-to-owner",
  "ownerGate": "layouts | blocks",
  "targetId": "...",
  "blockId": null,
  "reason": "The accepted JSON does not settle ...",
  "inputHashes": []
}
```

Mechanical failures remain inside execute. A missing product decision returns to its owner and opens
a new round; execute may not fill the silence with a preference.

### BLOCK PROPOSAL MINIMUM

Every block candidate must make the eventual render reconstructible without choosing its visual
principles:

| Field | Required meaning |
|---|---|
| identity | target/page id, block id, candidate id and source layout hash |
| role | business situation and outcome owned by the block |
| render | render type, title, description and visible reading order |
| collection | list/grid/table status, item grammar, fields, ordering, repetition and resting count |
| data | served fields, viewer scope, request owner and cache identity questions |
| states | complete tree-changing states and the visible output of each |
| actions | action id, consequence, pending/error owner and permission boundary |
| copy | named copy slots; no hidden literal body |
| responsive | what changes and what must remain the same |
| ownership | file/tier proposal, pure-connected split and contract reuse/extend/new |
| deferred | only decisions genuinely owned by principles/patterns, never missing business anatomy |

### INTENT SHELF

Create `.claude/fe/intent/` beside `.claude/fe/gates/`. It is not Gate 0 and emits no approval of
its own. Layout and block rounds select relevant intent modules and record the resulting
`intent-context.json` hash.

Recommended initial modules:

| Module | Owns | Explicit refusal boundary |
|---|---|---|
| `call-to-action` | desired outcome, action hierarchy, label/consequence clarity | no ambiguous verb, false primary, inaccessible target or action without consequence |
| `value-framing` | honest marketing message, audience problem, value evidence and comparison frame | no invented benefit, buried total cost or disguised advertising |
| `choice-architecture` | ordering, defaults, comparison sets and the “chim mồi”/asymmetric-dominance case | no dominated fake offer, forced default, hidden alternative or manipulation of consent |
| `trust-and-proof` | testimonials, credentials, guarantees, counts and evidence placement | no fake social proof, unsupported badge or unverifiable claim |
| `urgency-and-scarcity` | real deadline/capacity and when it matters to the decision | no fake timer, fake stock, reset deadline or pressure unsupported by backend truth |
| `commitment-and-friction` | progressive commitment, form cost, cancellation/reversal and user autonomy | no obstruction, asymmetric cancellation, confirmshaming or unnecessary data demand |

“Marketing” and “psychology” are router terms in `intent/INDEX.md`, not catch-all modules. The whole
shelf is behavioral/product reasoning; actionable modules own narrow decisions that can be reviewed
and proved.

Each module follows the five-record shape (`INDEX.md`, `vi.md`, `example.md`, `audit.md`,
`changelog.md`) only after Review freezes its rule sentences and evidence. `intent.schema.json`
requires audience state, desired action, value frame, evidence, friction, ethical constraints,
applied modules and forbidden tactics.

### SKILL ORCHESTRATION

| Skill | Responsibility |
|---|---|
| `starci-fe-design-plan` | Open/resume the session, route the active target/block, display current whitelist and decide which specialized skill runs next. |
| `starci-fe-design-layout` | Run target-surface layout rounds and write layout acceptance/rejection events. |
| `starci-fe-design-block` | Run one or many independent block rounds and write block acceptance/rejection events. |
| `starci-fe-design-execute` | Verify whitelist hashes, run principles → patterns → lints, apply code and record proof; never generate alternatives. |

This is a named continuous capability and therefore conflicts with the current universal
Plan → Review → Apply skill shape. Review must freeze migration of the existing
`starci-fe-design-review` and `starci-fe-design-apply` entry points; Apply must not leave two active
owners for the same design execution.

### EXACT APPLY BOUNDARY

| Path | Planned action |
|---|---|
| `.claude/fe/gates/INDEX.md` | ADD journey, stage ownership, return protocol and links. |
| `.claude/fe/gates/session.schema.json` | ADD session, round, transcript, rejection, hash and whitelist definitions shared by all gates. |
| `.claude/fe/gates/registry.schema.json` | ADD content-addressed object/ref/event/map contracts, JCS hash rules and registry transaction shape. |
| `.claude/fe/gates/layouts/{INDEX.md,gate.schema.json}` | MODIFY for root/discovered surfaces, target kinds, recursive extends graph, round and whitelist references. |
| `.claude/fe/gates/layouts/laws/l12-business-to-block-brief/**` | MODIFY scope from page-only language to target-surface language. |
| `.claude/fe/gates/layouts/proofs/**` | ADD/UPDATE multi-root and Page A → Modal B recursive-design proofs. Preserve unrelated old proof evidence until cleanup is separately approved. |
| `.claude/fe/gates/blocks/{INDEX.md,gate.schema.json}` | MODIFY from whole-page plan set to independent block candidate sets. |
| `.claude/fe/gates/blocks/laws/b14-proposals-are-per-block/**` | ADD five records for independent 3–4 × N cardinality and whitelist handoff. |
| `.claude/fe/gates/blocks/proofs/**` | ADD one-block, whole-page and partial-whitelist proofs. |
| `.claude/fe/gates/principles/{INDEX.md,gate.schema.json}` | ADD INDEX, MODIFY schema into a linear whitelisted executor stage. |
| `.claude/fe/gates/patterns/{INDEX.md,gate.schema.json}` | ADD INDEX, MODIFY schema into a linear exact-input source materializer. |
| `.claude/fe/gates/lints/{INDEX.md,gate.schema.json}` | ADD INDEX, MODIFY schema into the final exact-input verdict/proof stage. |
| `.claude/fe/gates/principles/surface-in-surface/{INDEX.md,vi.md,example.md}` | MODIFY dead CTA-sense links to the accepted intent CTA owner. |
| `.claude/fe/gates/proofs/**` | ADD end-to-end session, hash tamper, return-to-owner and no-downstream-divergence proofs. |
| `.claude/fe/intent/{INDEX.md,intent.schema.json}` | ADD sibling shelf router and machine context. |
| `.claude/fe/intent/{call-to-action,value-framing,choice-architecture,trust-and-proof,urgency-and-scarcity,commitment-and-friction}/**` | ADD five records per Review-approved module. |
| `.claude/skills/starci-fe-design-plan/**` | MODIFY into the session orchestrator; remove dead `fe/creativity` dependencies. |
| `.claude/skills/starci-fe-design-{layout,block,execute}/**` | ADD specialized continuous skills and UI metadata. |
| `.claude/skills/starci-fe-design-{review,apply}/**` | Review must freeze REMOVE or redirect; no duplicate active owner may remain. |
| `.claude/scripts/fe-design-registry.mjs` and focused tests | ADD init, canonicalize/hash, event append, promote/reopen, map rebuild, FTS rebuild, memory-pack and integrity commands. |
| `.claude/skill-shape.md` | MODIFY with the named continuous FE design journey. |
| `.claude/sources/skills.test.mjs` and gate/session tests | MODIFY/ADD lifecycle, cardinality, immutability, hash and discoverability tests. |
| `<Source>/.gitignore` | MODIFY carefully to ignore `.worktrees/sessions/` and `.worktrees/cache/`; the linked registry worktree remains backed by its own branch. |
| `<Source>/.worktrees/registries/` | CREATE as a linked registry Git worktree during approved setup, not as an ordinary ignored directory. |

Law/archetype modules outside the named paths are evidence libraries and are not bulk-rewritten.
“Sửa toàn bộ gates” means every root contract participates in the new journey, not a mechanical
rewrite of hundreds of already-owned principle/pattern/lint laws.

### ACCEPTANCE PROOF

| Case | Required result |
|---|---|
| One page target | Exactly 3–4 layout candidates; no whitelist entry before explicit acceptance. |
| Two page targets | Two independent 3–4 candidate sets; no application-wide candidate coupling. |
| Page A with Modal B extension | Accepting Page A enqueues Modal B; Modal B receives its own 3–4 layout candidates and cannot be skipped before execute. |
| Modal B as root target | Modal B follows the same layout/block depth; only its origin differs from a discovered surface. |
| Shared Modal B | Two parents may point to one stable Modal B node while keeping two distinct trigger/mount edges. |
| Surface cycle | A drawer reopening its parent modal produces a cycle finding, not infinite target generation. |
| Five-block selected layout | Five independent block sets totaling 15–20 candidates. |
| Partial block acceptance | Accepted blocks stay whitelisted; only unresolved blocks continue new rounds. |
| Alteration | Previous round bytes/hashes remain unchanged; new prompt, response, candidates and delta are appended. |
| Rejection | Exact prompt appears in `rejections.jsonl` and the human `REJECTIONS.md`, referencing candidate hash. |
| Canonical identity | Two JSON files differing only in whitespace/property order produce the same RFC 8785 + SHA-256 object id. |
| Registry views | `queued`, `rejected`, `approved`, and `map` contain refs/projections only; no duplicate candidate payload. |
| Stale alter | An event whose `basedOnHash` is not the current head is refused as a conflict. |
| Crash recovery | Replay stops at the last complete event/registry commit and does not expose a half-promoted approval. |
| Search | Structured filters plus FTS find prompts/rejections by project, surface, block, contract, render type and reason text. |
| Index rebuild | Deleting `registry.sqlite` and rebuilding from objects/refs/events yields the same heads, edges and search document count. |
| Memory pack | Active-context pack contains current head, approved ancestors, relevant intent/contracts/rejections and hashes, but no unrelated transcript. |
| Safe prune | Session scratch cannot be pruned until its last sequence is included in a durable registry commit receipt. |
| Whitelist tamper | Executor refuses a candidate whose bytes no longer match the accepted hash. |
| Gates 3–5 | Schemas contain no candidate/recommended fields and produce one exact result. |
| Missing decision during execute | Executor writes `returned-to-owner` and opens no silent preference. |
| Intent ethics | Fake scarcity/social proof, buried price and obstructed cancellation fixtures fail; truthful evidence-backed framing passes. |
| End-to-end | Selected layout + selected blocks → principles → patterns → lints → code proof with every input/output hash connected. |
| Trust tests | Task-local schema/proof tests pass; existing unrelated dirty-tree failures are reported, not absorbed. |

### RISKS

| Risk | Control |
|---|---|
| Candidate count explodes for many pages/blocks/rounds. | Candidate sets stay independent; manifest records retention state, but accepted/referenced rounds are never deleted automatically. |
| Recursive extensions cause unbounded generation. | Only accepted parent candidates activate edges; stable surface ids deduplicate nodes and cycle detection stops recursion. |
| Whitelist becomes a mutable approval file. | Append-only acceptance/revocation events are truth; JSON whitelist files are rebuildable views. |
| Intent becomes a dark-pattern cookbook. | Evidence and forbidden-tactic fields are required; deceptive fixtures fail; backend truth outranks persuasion. |
| Execute starts redesigning to satisfy lint. | Return-to-owner protocol separates mechanical repair from missing product decisions. |
| Existing layouts changes are uncommitted. | Apply captures a Trust baseline and edits only reviewed paths without reset/format of unrelated work. |
| Existing Design Review/Apply conflict with the continuous journey. | Review chooses removal or redirect and freezes migration before Apply. |
| `.worktrees` is treated as disposable by cleanup scripts or developers. | Registry is a real linked Git worktree with a durable branch and workflow commit receipt; only sessions/cache are disposable. |
| SQLite becomes an opaque binary source of truth. | DB is ignored and rebuilt from tracked immutable objects, refs and events; integrity test proves equivalence. |
| Full transcript exhausts LLM context and worsens retrieval. | Per-unit memory packs use graph slice + structured filters + FTS-ranked rejection evidence under an explicit token budget. |

### OUTPUTS

| Concept | Planned result |
|---|---|
| Iterative design session | Every prompt/response/alter/reject/accept is an immutable, hash-bound round. |
| Surface-aware layouts | 3–4 candidates for every root or discovered page/layout/modal/drawer/overlay node until the accepted surface graph is complete. |
| Independent block design | 3–4 detailed render candidates per block, preserving 3–4 × N cardinality. |
| Whitelist boundary | Only explicitly accepted layout/block hashes reach execute. |
| Linear executor | Principles, patterns and lints materialize one accepted design without alternatives. |
| Intent shelf | A sibling FE shelf for honest CTA, framing, choice architecture, trust, urgency and friction decisions. |
| Professional registry | Content-addressed layout/block memory with queued/rejected/approved/map ref views, searchable FTS index and resumable event checkpoints. |

### CHANGES

| Path | Change |
|---|---|
| `.workflows/upgrade/starci-academy-fe/fe-design-gates-and-intent.md` | Added this Plan only; no Trust or target source changed. |

### NEED APPROVALS

| Decision for Review | Recommended direction |
|---|---|
| Existing `starci-fe-design-review` and `starci-fe-design-apply` after continuous journey lands | Retire them after parity tests; do not leave redirecting aliases indefinitely. |
| Initial intent module set | Approve the six narrow modules above; keep “marketing” and “psychology” as router terms rather than catch-all folders. |
| Durable `.worktrees/registries` implementation | Use a real linked Git worktree and dedicated registry branch; do not trust an ignored directory as the only copy. |
| Replacement name for `mindset` | Use `intent`; it describes desired outcome/evidence without the breadth of `strategy` or manipulative tone of `persuasion`. |

### WARNINGS

| Warning | Impact |
|---|---|
| Trust is heavily dirty in unrelated BE/common/source/skill paths, and the just-applied layouts work is also uncommitted. | Review and Apply must path-limit every diff and preserve all unrelated changes. |
| Current blocks/principles/patterns/lints schemas still encode the old recommended-chain model. | The journey is not executable until all root schemas change together. |
| Current `starci-fe-design-plan` links to missing `fe/creativity/**`. | The new intent/gate dependencies must replace, not duplicate, that dead ownership. |
| Specific intent laws do not yet have repeated founder-refusal witnesses. | Review must freeze them from primary evidence and explicit founder intent; unproved claims remain proposed, not historical canon. |
| Source `.gitignore` is already modified outside this Plan. | Review must inspect and merge the two narrow `.worktrees/sessions`/`cache` entries without replacing unrelated user edits. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| One-shot `recommendation.json` followed immediately by selection | Append prompt/alter/reject rounds until explicit acceptance | Founder clarified that every assistant proposal can receive further prompts before it is settled. |
| Layout means page only | Layout targets page, layout, modal, drawer or overlay | Founder explicitly expanded the subject of `fe-layout`. |
| Leave Modal B as only a brief inside Page A | Accept Page A, enqueue Modal B, then fully design Modal B through layout and block rounds | Founder requires every surfaced extension to enter the design process. |
| Three to four whole-page block combinations | Three to four candidates independently for every block | Whole-page combinations couple unrelated choices and lose the required 3–4 × N alternatives. |
| Gates 3–5 generate more creative directions | Execute exactly one whitelisted design | Founder said execute is simply execution. |
| Generic `marketing/` and `psychology/` dumping-ground modules | Narrow decision owners with a router vocabulary | Broad folders cannot state who owns CTA, decoy, trust, scarcity or friction and will overlap every gate. |
| Treat “chim mồi” as permission to manipulate | Choice architecture with autonomy and evidence constraints | False/dominated offers, hidden alternatives and buried costs are deceptive, not design evidence. |
| Name the new shelf `mindset` | Name it `intent` | Intent names the user outcome and evidence being designed; mindset is vague and person-centered. |
| Store complete JSON under each queued/rejected/approved folder | Store one immutable object and small status refs | Copying payloads multiplies memory, breaks lineage and makes status transitions file moves. |
| Make `.worktrees/registries` an ordinary ignored folder | Make it a real linked Git worktree with a durable registry branch | Approved/rejected institutional memory must survive workspace cleanup. |
| Make SQLite the registry source of truth | Treat SQLite/FTS as rebuildable cache | A binary database is poor review evidence and difficult to merge; immutable JSON/MD and events remain inspectable. |
| Feed the complete transcript back into every LLM call | Build a unit-scoped memory pack | Full history wastes tokens and makes irrelevant old decisions outrank the current head. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge target/extends semantics, round schema, whitelist events and executor return protocol | `starci-fe-upgrade-review` freezes field-level contracts and proof fixtures. |
| Freeze old Design Review/Apply migration | Review selects remove or redirect and names exact test/metadata deltas. |
| Freeze each intent rule sentence and evidence | Review checks primary sources, existing rejection evidence and StarCi business truth. |
| Freeze registry branch, ref/event schemas, transaction order and retention | Review runs crash/conflict/search thought experiments and names exact CLI commands/tests. |
| Apply all five root gates, intent and skills | Only after one approved Review revision and a confirmed write boundary. |

## review

### CONTEXT

| Field | Value |
|---|---|
| Workdir | C:/Repositories/ac/starci-academy-backend |
| Source | C:/Repositories/ac/starci-academy-backend |
| Project | starci-academy-fe |
| Frontend | C:/Repositories/starci-academy-fe |
| Backend | C:/Repositories/ac/starci-academy-backend |
| Trust | C:/Repositories/ac/starci-academy-backend/.claude |
| Skills | C:/Repositories/ac/starci-academy-backend/.claude/skills |
| App | starci-academy-fe |
| Repo / branch | Source mtp; Trust main; Frontend main; registry codex/fe-design-registry |
| Purpose | Freeze the continuous layout -> block -> execute journey and its durable decision memory. |
| Workflow root | C:/Repositories/ac/starci-academy-backend/.workflows |
| Workflow | C:/Repositories/ac/starci-academy-backend/.workflows/upgrade/starci-academy-fe/fe-design-gates-and-intent.md |
| Language | vi |
| Phase | review |
| Window | The Plan above plus the founder approval “ok xúc hết đi”. |
| Touching | Exactly the paths in `EXACT APPLY BOUNDARY`; no production FE source and no unrelated dirty file. |

### APPROVED REVISION

`fe-design-gates-intent-registry-r1` is approved for Apply.

| Group | Review verdict | Frozen rule |
|---|---|---|
| G1 | APPROVED | Layout and block are append-only prompt/response rounds; only explicit acceptance changes a whitelist ref. |
| G2 | APPROVED | Every root or discovered page/layout/modal/drawer/overlay is a surface node with its own 3-4 layout candidates. |
| G3 | APPROVED | Block divergence is independent: `N` blocks produce `N` sets and 3-4 x N candidates. |
| G4 | APPROVED | Accepted hashes, not filenames or summaries, authorize the linear principles -> patterns -> lints executor. |
| G5 | APPROVED | `intent` guides honest outcomes but cannot fabricate facts, urgency, scarcity, proof, prices or consent. |

### FROZEN CONTRACT

| Contract | Required shape |
|---|---|
| Session | `sessionId`, project, roots, active unit, monotonically increasing events, checkpoint and registry receipt. |
| Round | exact prompt hash, response hash, 3-4 candidate hashes, previous/based-on hash, delta, verdict and rejection hashes. |
| Layout input | one or more target surfaces; each has stable id, kind, business input, requested outcome, contracts and intent refs. |
| Layout candidate | `business`, `main` distribution/CSS/block inventory, `extends` dependency edges and evidence. |
| Block input | one accepted layout hash plus one or all block briefs from that layout. |
| Block candidate | identity, role, render grammar, title/description/list/fields, data, states, actions, responsive rules, contract and ownership/split. |
| Whitelist | a rebuildable approved ref bound to object hash, decision hash, actor/time and lineage; payload is never copied into status views. |
| Executor | one exact result per stage, or `returned-to-owner`; candidate/recommended arrays are forbidden downstream. |

Accepted parent `extends` edges enqueue dependent surfaces. Stable ids deduplicate shared surfaces; cycle
edges become findings. Execute is unavailable while any required reachable layout or block is queued.
An alteration with a stale `basedOnHash` is a conflict and never overwrites the current head.

### STORAGE AND TRANSACTION

The durable registry is a locked linked Git worktree at `.worktrees/registries`, backed by
`codex/fe-design-registry`. JSON object identity is RFC 8785-compatible canonical JSON encoded as
UTF-8 and SHA-256. Promotion order is: validate -> write missing objects -> append event -> update
refs/maps -> integrity check -> registry commit -> workflow receipt. A failed step leaves no approved
ref. `sessions` and `cache` are ignored and disposable only after a durable checkpoint. SQLite/FTS,
previews and memory packs are derived caches.

### INTENT TAXONOMY

The approved owner modules are `call-to-action`, `value-framing`, `choice-architecture`,
`trust-and-proof`, `urgency-and-scarcity`, and `commitment-and-friction`. “Marketing”, “psychology”
and “chim mồi” are router vocabulary only. Each module carries five records. Fake scarcity, fake
proof, buried cost, ambiguous CTA, confirmshaming and obstructed cancellation are hard refusals.

### SKILL MIGRATION

`starci-fe-design-plan` is the sole journey orchestrator. New continuous workers are
`starci-fe-design-layout`, `starci-fe-design-block`, and `starci-fe-design-execute`. Existing
`starci-fe-design-review` and `starci-fe-design-apply` keep only compatibility routing and shared
proof references for one migration window; they cannot write proposals or production source and
must route immediately to the new owner. This prevents two active owners without breaking current
consolidate/lint/fidelity references.

### TEST BOUNDARY

Apply must prove JSON-schema validity, one/multi/discovered-surface cardinality, per-block 3-4 x N,
immutable rounds, canonical-hash equality, stale-head refusal, approved-ref integrity,
return-to-owner, no downstream divergence, registry index rebuild, memory-pack slicing, skill
discoverability and scoped diff hygiene. Existing unrelated dirty-tree failures remain warnings.

### OUTPUTS

| Output | Verdict |
|---|---|
| Revision | `fe-design-gates-intent-registry-r1` approved |
| Write boundary | Confirmed by founder; proceed to Apply |
| Legacy entry points | Compatibility routers only; no ownership |
| Registry | Linked worktree + dedicated branch approved |

### CHANGES

| Path | Change |
|---|---|
| `.workflows/upgrade/starci-academy-fe/fe-design-gates-and-intent.md` | Appended this Review; Trust remains untouched by Review. |

### NEED APPROVALS

None. The founder approved all recommended directions with “ok xúc hết đi”.

### WARNINGS

| Warning | Control |
|---|---|
| Trust and Source are already dirty. | Apply is path-limited and never resets, formats or stages unrelated files. |
| Several skills link to proof references under the old review folder. | Preserve those references while converting only the old entry points into routers. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Delete legacy skill folders immediately | Keep non-owning compatibility routers for one migration window | Existing unrelated skills/tests consume their reference documents. |
| Copy payloads between status folders | Content-addressed object plus refs | Preserves identity and memory efficiency. |
| Let execution resolve design ambiguity | Return to the owning layout/block unit | Founder choice remains explicit and hash-bound. |

### OWED

| Owed | Cleared by |
|---|---|
| Implement the approved revision | Apply below with command/test evidence and registry receipt. |

## review revision 2

Approved revision: `fe-design-gates-intent-registry-r2`

Founder correction supersedes the migration-window decision in Review 1:

| Area | Frozen revision |
|---|---|
| FE design | Remove old preview/review/apply ownership. Keep only `design-plan -> design-layout -> design-block -> design-execute`; JSON rounds are the review surface. |
| FE fidelity | Remove `starci-fe-fidelity-start`, `-end` and `-finality`; settled FE work routes through the accepted design JSON and execute. |
| Backend feature | Reduce to `starci-be-feature-plan -> starci-be-feature-approve`. Approve performs the explicit approval loop and, after approval, the bounded implementation/proof. |
| Shared proof references | Move state/live-flow references from the removed Design Review skill into neutral `fe/references/` and update consumers. |
| Global skill shape | Replace the universal three-phase assumption with explicit capability journeys and update discoverability/lifecycle tests. |

Expanded Touching is limited to `.claude/INDEX.md`, `.claude/skill-shape.md`, the named FE/BE skill
folders, direct reference consumers and their focused tests. No other audit/data/consolidate/lint/
upgrade capability is removed in this Apply.

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `fe-design-gates-intent-registry-r2` |
| FE legacy lifecycle | Removed, including fidelity |
| Backend coding lifecycle | Two steps: Plan then Approve |

### CHANGES

| Path | Change |
|---|---|
| `.workflows/upgrade/starci-academy-fe/fe-design-gates-and-intent.md` | Appended founder correction before Trust writes. |

### NEED APPROVALS

None; the founder explicitly ordered the removals and the two-step backend lifecycle.

### WARNINGS

| Warning | Impact |
|---|---|
| Historical workflows may name removed skills. | History remains untouched; current router/index/tests stop advertising them. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Compatibility window for FE Design Review/Apply | Remove them now | Founder explicitly said to remove the preview/approve lifecycle. |
| Fidelity as a separate FE capability | Accepted JSON plus Design Execute | Founder explicitly said “bỏ fidelity”. |
| Backend Plan/Review/Apply | Backend Plan/Approve | Founder says two skills are sufficient. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply revision 2 | Contract, skill, registry and test implementation below. |

## apply

Applied revision: `fe-design-gates-intent-registry-r2`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | C:/Repositories/ac/starci-academy-backend |
| Source | C:/Repositories/ac/starci-academy-backend |
| Project | starci-academy-fe |
| Frontend | C:/Repositories/starci-academy-fe |
| Backend | C:/Repositories/ac/starci-academy-backend |
| Trust | C:/Repositories/ac/starci-academy-backend/.claude |
| Skills | C:/Repositories/ac/starci-academy-backend/.claude/skills |
| App | starci-academy-fe |
| Repo / branch | Source mtp; Trust main; Frontend main; registry codex/fe-design-registry |
| Purpose | Apply the five-gate JSON journey, intent shelf, durable registry and simplified skill lifecycle. |
| Workflow root | C:/Repositories/ac/starci-academy-backend/.workflows |
| Workflow | C:/Repositories/ac/starci-academy-backend/.workflows/upgrade/starci-academy-fe/fe-design-gates-and-intent.md |
| Language | vi |
| Phase | apply |
| Touching | Reviewed Trust gates/intent/skills/scripts/tests, Source .gitignore and linked registry worktree only. |

Registry commit: `00e1b7e84ad57aa2765b15e34f0ff24f7ae94698`
Trust commit: `9dc6155c25b322501c3bf79617e63c8910be372a` (pushed `origin/main`)

### PROOF

| Proof | Result |
|---|---|
| JSON Schema metaschema | 8 schemas valid under Draft 2020-12 |
| Focused gate/registry/live-flow/workflow tests | 24/24 passed |
| Focused skill lifecycle/discoverability tests | 7/7 passed |
| Registry integrity | `ok: true`, zero refs because no real design session has been opened |
| Registry worktree | locked on `codex/fe-design-registry`; initial commit recorded above |
| Full Trust test | New task tests pass; unrelated BE duplicate rules, deleted/moved dirty canon links and one pre-existing audit-skill heading still fail |
| Gate health | Layouts/blocks/principles have no broken links; pre-existing patterns guesses and six lints links remain debt |
| Diff hygiene | scoped `git diff --check` passed; only CRLF conversion warnings |

### OUTPUTS

| Concept | Result |
|---|---|
| FE design journey | `design-plan -> layout -> block -> execute`, with JSON rounds as the review surface |
| Layout gate | 3–4 candidates independently for every root/discovered surface and explicit dependency graph |
| Block gate | 3–4 detailed candidates independently per block; partial acceptance is preserved |
| Linear executor | Principles, Patterns and Lints consume exact hashes and never diverge |
| Gate goals | Every gate now has `GOAL.md`; Principles refuses hallucinated contracts/states |
| Intent | Six narrow evidence-bound modules with deceptive-pattern refusals |
| Registry | Durable linked worktree, immutable JCS/SHA-256 objects, refs/maps, FTS and memory packs |
| Skills | Removed FE Review/Apply/Fidelity; backend reduced to Feature Plan/Approve |

### CHANGES

| Tree | Details |
|---|---|
| `.claude/fe/gates/**` | Rebuilt root contracts, goals, laws and proof fixtures for the continuous journey. |
| `.claude/fe/intent/**` | Added router, schema and six five-record intent modules. |
| `.claude/skills/starci-fe-design-*` | Kept Plan as orchestrator; added Layout/Block/Execute; removed old Review/Apply and preview server. |
| `.claude/skills/starci-fe-fidelity-*` | Removed all three fidelity skills. |
| `.claude/skills/starci-be-feature-*` | Replaced Review/Apply with one approval-gated `starci-be-feature-approve`. |
| `.claude/scripts/fe-design-registry.mjs` | Added canonical object, ref, integrity, FTS and memory-pack tooling. |
| `.claude/sources/*design*`, workflow/skill tests | Added focused regression coverage and new journey validation. |
| `<Source>/.gitignore` | Ignored local `.worktrees` mount while the registry remains versioned on its own branch. |
| `<Source>/.worktrees/registries` | Created and committed locked linked registry worktree. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Founder already approved Apply and requested Trust main push. |

### WARNINGS

| Warning | Impact |
|---|---|
| Source and Trust still contain unrelated dirty changes not staged by this Apply. | They remain local and will not enter the scoped Trust commit. |
| Full Trust suite has unrelated pre-existing failures. | Task-local journey/registry/schema tests are green; repository debt is not silently claimed fixed. |
| Registry SQLite uses Node's experimental `node:sqlite`. | SQLite is rebuildable cache; canonical JSON/Markdown objects remain durable. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| HTML preview + Design Review + Design Apply lifecycle | JSON Layout/Block rounds + Execute | Founder explicitly removed preview/approve flow. |
| Separate Fidelity lifecycle | Reuse accepted JSON then Execute | Founder explicitly said “bỏ fidelity”. |
| Backend Plan/Review/Apply | Backend Plan/Approve | Founder requested two skills only. |

### OWED

| Owed | Cleared by |
|---|---|
| None | Trust `main` is pushed. Registry branch remains a committed local linked worktree because no registry-remote push was requested. |
