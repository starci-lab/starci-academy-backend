# Mock-Interview Bank Rules — Technical + Behavioral/EQ

Governs mock-interview question banks. Two FAMILIES share the same DSL grammar and
gate but differ in fields, source-of-truth, and placement:

- **technical** — `courses/<course>/mock-interview/<N>-<module-slug>/` (one bank per
  module, folder NAMED AFTER the module — e.g. `0-framework-foundation`), grounded in
  that module's lesson + flashcard content (`# moduleRefs`).
- **behavioral/EQ** — GLOBAL `mock-interview-eq/<N>-bank/`, curated (not grounded in
  any module) — universal competencies, one shared bank for the whole platform.

This file is the **self-sufficient rule** for `starci-interview-audit` /
`starci-interview-generate` (replaces the non-existent in-mount README/RESEARCH/ROADMAP
the pilot skill draft assumed — consolidated into one file, same precedent as
`flashcard-answer.md`).

Jobs:
- **§0 Bank & folder structure** — where files live, DSL grammar.
- **§1 Quality gate** — KEEP/DELETE a question ("is this really an interview question?").
- **§2 Field reference** — every field per family, required vs optional.
- **§3 Rubric conventions** — the 4-dimension tag / rubricByTier / 6-STAR shapes.
- **§4 Bilingual + terminology.**
- **§5 Constraints.**
- **§6 Room tool mapping** — which FE tool renders each `# kind`'s question material.

---

## §0. Bank & folder structure

- **Bank root** `<N>-bank/{vi,en}.md` — bank META only: `# sortIndex` / `# title` /
  `# description` / `# difficulty` / `# family` (default family for questions inside) /
  `# moduleRefs` (**technical only** — the module slug(s) this bank grounds in).
- **Questions** live one-per-folder under the bank, mirroring the flashcard `cards/`
  convention: `<N>-bank/questions/<n>-question/{vi,en}.md`, `sortIndex` contiguous
  from 0 matching folder index `<n>`. A code-rendering question (`debug`/`review`/
  `optimize`) additionally carries per-language `<n>-question/bodies/{0-typescript,
  1-java,2-csharp,3-go}/{vi,en}.md` — see §2 (root = language-independent fields;
  each body = that language's `# prompt`/`# givenCode`/`# idealAnswer`).
- **DSL grammar** (identical to flashcard — mirrors `ExtractJsonFromMdService`'s real
  parser exactly, verified against production content): every field is `# fieldName` on
  its own line, **immediately followed by `<!-- @starci/seperator -->`, then the value,
  then another `<!-- @starci/seperator -->`** — the separator wraps BOTH sides, always,
  even for short scalars (`# family` / `<!-- sep -->` / `technical` / `<!-- sep -->`).
  **A field with no opening separator is NOT stripped** — the trailing separator leaks
  into the parsed value as literal text (this bit a real seed attempt once — a DB insert
  failed on `varchar(32)` overflow because `family` came out as
  `"technical\n<!-- @starci/seperator -->"`). List-type field values use `## 0` / `## 1` /
  … sub-items, each ALSO separator-wrapped the same way.
### Target shape — one bank PER MODULE, 15 reasoning questions across 7 categories (thầy 2026-07-13 — supersedes the flashcard `15 × 10` mirror)

Technical mock-interview no longer tracks the flashcard 15-deck sub-topic catalog. It
tracks the course's **MODULES** directly, one deeper reasoning bank per module:

- **Technical:** each course has **one bank per module** — bank `<N>-<module-slug>/`
  (folder NAMED AFTER the module, e.g. `0-framework-foundation` — NOT `0-bank`) grounds
  in module N via `# moduleRefs`, `# sortIndex` matching module order, `# title` /
  `# description` themed on that module's concept (e.g. module 0 → "framework
  foundation"). A course with 23 modules → 23 banks. (Supersedes the earlier "15 banks =
  15 flashcard sub-topics" mirror — banks now track the raw module count; the
  flashcard↔interview 1:1 sub-topic pairing no longer holds.)
- **Each technical bank has EXACTLY 15 questions** (`0-question` … `14-question`,
  contiguous `# sortIndex`), spread across **7 spoken-interview categories** with this
  target distribution:

  | `# kind` | count | Bloom | what it probes | tier lean |
  |---|---|---|---|---|
  | `theory` | 2 | Understand | explain a concept out loud | junior |
  | `scenario` | 2 | Apply | apply the concept to a concrete situation | junior/middle |
  | `reasoning` | 3 | Analyze | trade-offs, "why X over Y, when NOT" | middle/senior |
  | `debug` | 2 | Analyze | read broken code/behaviour, find the root cause | middle/senior |
  | `review` | 2 | Evaluate | critique someone else's code/design | senior |
  | `optimize` | 2 | Evaluate | reason about making it faster/cheaper (spoken, no IDE) | middle/senior |
  | `design-lite` | 2 | Create (light) | design ONE small interface/contract/module boundary, defend it | middle/senior |

  Total = 15. Order easy→hard by `# sortIndex` (roughly theory → scenario → reasoning →
  debug → review → optimize → design-lite).
- **Tier floor:** at least **3 `junior`** and at least **3 `senior`** (interview `# tier`
  has no `staff`), the rest `middle`. The distribution above naturally lands
  senior-heavy — intended, higher-Bloom questions discriminate seniority.
- **Excluded from the per-module bank on purpose:** `coding` (write + run code) lives in
  the `/practice` feature (Judge0); the full 5-phase `design` lives in the capstone
  whiteboard flow. Neither belongs in the 15-question spoken bank — but both stay valid
  `# kind` values in the enum (§2) for those separate flows.
- **`design-lite` vs `design`:** `design-lite` is a SMALL spoken design — one interface /
  contract / module boundary the candidate sketches and defends out loud, graded with a
  plain `# rubric` (§3). It is NOT the 5-phase `design` capstone (`# rubricByTier`), which
  stays in its own flow.
- **Curate-then-fill to 15:** a module with >15 worthwhile prompts → keep the strongest
  15 per §1, drop the rest (shallow / contrived / near-duplicate); <15 → author NEW deep
  prompts (real interview questions, not padding) biased toward the short
  category/tier buckets.
- The DIFFERENCE from flashcard is the QUESTION nature (§1): a flashcard card is
  fact-recall (read the answer, self-grade); an interview question is a situation/problem
  the candidate reasons through OUT LOUD and the AI grades against `# rubric` +
  `# idealAnswer`.

- **Behavioral/EQ:** bank count/topic is curated by the teacher, not derived from any
  course structure (universal competencies, one shared global bank set) — it does NOT
  follow the per-module 15-question shape.

---

## §1. Quality gate — "Is this a real interview question?"

A question is KEPT only if it is a genuine spoken-answer interview prompt with depth.
Default to DELETE when unsure it clears the bar.

**DELETE if ANY of these is true:**
- Single-fact recall answerable in one line with no reasoning — that belongs in a
  flashcard (`/starci-flashcard-generate`), not here.
- Duplicate / near-duplicate of another question in the same bank.
- Contrived, or something a real interviewer would not ask at the question's `# tier`.
- Technical prompt that requires inventing a fact not actually in the course (`.mount`)
  content — ground truth only, never bịa endpoint/concept/API that doesn't exist.

**KEEP if the question:**
- Is a situation or problem the candidate reasons through OUT LOUD (not read-and-recall).
- Has a real ground-truth answer (`# idealAnswer` / `# rubricByTier`) that reasoning
  converges on, not a matter of opinion.
- Naturally supports 1–3 follow-up probes (technical) or reveals a STAR story
  (behavioral).

---

## §2. Field reference

**Common to every question (both families):**
`# sortIndex` · `# isPremium` · `# family` (`technical`|`behavioral`) · `# tier`
(`junior`|`middle`|`senior`) · `# kind` · `# tags` (list) · `# prompt`.

**`# kind` enum (12 total):**
- technical: `theory` · `reasoning` · `scenario` · `debug` · `review` · `optimize` ·
  `design-lite` · `coding` · `design`
  — the per-module bank uses the **first 7** (see §0 target-shape table). `coding`
  belongs to `/practice` (Judge0) and the 5-phase `design` to the capstone flow; both
  stay valid here for those separate flows but are NOT part of the 15-question bank.
- behavioral: `behavioral` · `situational` · `culture`

**Technical-only fields:**
- `# diagram` — mermaid source; used for `kind=scenario` (and optionally `design-lite`,
  to sketch the interface/contract) when a diagram helps set up the question.
- `# givenCode` + `# givenLang` — the broken/to-review code snippet inline, for a
  code question posed in a SINGLE stack only (rare — a concept meaningful in just one
  language). For the normal multi-language case use **per-language `bodies/`** below.
- **Per-language `bodies/` (thầy 2026-07-13 — mirrors lesson-content `bodies/`)** — the
  standard shape for `kind ∈ {debug, review, optimize}` in a multi-language module.
  The candidate picks ONE language at interview-session start (§6); a code question then
  renders **that language's prompt AND its ideal answer**, not just its code — so the
  language-specific parts live in per-language body files, exactly like lesson content:
  - **Root** `<n>-question/{vi,en}.md` — ALWAYS present. Holds the language-INDEPENDENT
    fields: meta (`# sortIndex`/`# isPremium`/`# family`/`# tier`/`# kind`), `# tags`,
    **`# rubric`** (the 4-dimension reasoning points — grade the reasoning not the syntax,
    so worded neutrally per §5), `# followUps`, `# hints`, `# keywords`. It MAY also carry
    an agnostic `# prompt` + `# idealAnswer` — **required only as a fallback when FEWER
    than 4 language bodies exist**; when all 4 bodies are present the root omits
    `# prompt`/`# idealAnswer` (the bodies cover every session language).
  - **Bodies** `<n>-question/bodies/{0-typescript,1-java,2-csharp,3-go}/{vi,en}.md` — one
    folder per language (same numbering as lesson content). Each holds `# lang`
    (`typescript`|`java`|`csharp`|`go`) + `# prompt` (that stack's concrete framing) +
    `# givenCode` (that stack's snippet, separator-wrapped — code contains `#`) +
    `# idealAnswer` (that stack's fix). NO `# rubric`/`# tags`/`# followUps` — inherited
    from root. `vi.md`↔`en.md` mirror inside each body.
  - **Render/seed:** session lang L → render `bodies/L`'s prompt+givenCode+idealAnswer +
    root's rubric/followUps/hints; if `bodies/L` is absent → render the root agnostic
    `# prompt`+`# idealAnswer` (mandatory whenever coverage < 4). Seeds one row per body
    into `mock_interview_langs`, cascade-linked to the question row in `mock_interviews`.
- `# rubric` — list (`## 0`/`## 1`/…) of reasoning points that earn credit; **required**
  for every kind except `design`. For `kind ∈ {coding, debug, review, optimize}` each
  item MUST open with a dimension tag `[communication]` / `[problemSolving]` /
  `[technical]` / `[testing]` (one of the 4, e.g. `[technical] Explains the race
  condition and where the lock must go.`).
- `# rubricByTier` — **only** for `kind=design`, REPLACES `# rubric`. Three sub-sections
  `## junior` / `## middle` / `## senior`, each a short prose paragraph of what a strong
  answer looks like at that tier.
- `# followUps` — list, 1–3 probe questions the interviewer may ask next.
- `# hints` — list, progressive (easiest → most revealing).
- `# idealAnswer` — the grading ground-truth outline, wrapped `:::muted` like the
  flashcard answer skeleton. **Required** for every technical question.
- `# keywords` — list, `:::chip` coverage terms.

**Behavioral-only fields:**
- `# competency` — one of `conflict` · `ownership` · `leadership` · `communication` ·
  `growth`.
- `# rubric` — **exactly 6 items**, one per STAR dimension, **in this fixed order**,
  each opening with its dimension tag: `[situationClarity]` · `[actionSpecificity]` ·
  `[resultImpact]` · `[selfAwareness]` · `[communication]` · `[relevanceToRole]` — the
  rest of the line says what "good" looks like for THIS question.
- `# ownershipSignal` — **required**, a grading note instructing the AI to dock points
  when the candidate says "we/the team" instead of naming their own concrete action.
- `# leadershipTier` — optional, senior-only.

---

## §3. Rubric conventions (summary — see §2 for exact shape)

- Technical `coding`/`debug`/`review`/`optimize`: 4-dimension tagged rubric.
- Technical `design` (5-phase capstone only): `rubricByTier`, not `rubric` — never both.
- Technical `theory`/`reasoning`/`scenario`/`design-lite`: plain untagged `# rubric`
  items (dimension tags optional — these kinds aren't scored per-dimension). `design-lite`
  uses plain `# rubric` + `# idealAnswer` (NOT `rubricByTier`); it may add an optional
  `# diagram` of the interface/contract.
- Behavioral: always exactly 6 STAR-tagged items, fixed order, `# ownershipSignal`
  always present.

---

## §4. Bilingual + terminology

`vi.md` ↔ `en.md` mirror the same bank/question count, same `kind`/`tier`/`family`,
same KEEP/DELETE decision. `vi.md` is Vietnamese **with diacritics**; keep standard
technical terms in English (don't force-translate), per `terminology-bold.md`.

---

## §5. Constraints

- Never invent facts: technical `idealAnswer`/`rubric`/`diagram`/`givenCode` must be
  grounded in the module's real `.mount` lesson/flashcard content — no fabricated
  endpoints, APIs, or concepts.
- `# prompt` must actually be answerable OUT LOUD by reasoning, not a fact lookup.
- Preserve the `<!-- @starci/seperator -->` field-delimiter format exactly.
- Placement is load-bearing: behavioral questions never carry `# moduleRefs`; technical
  bank meta always does. A behavioral bank inside a course path (or vice versa) is a
  gate FAIL, not a warning.
- **Language neutrality for no-code kinds (thầy 2026-07-13)** — a multi-language module
  (TS/Java/C#/Go) means `theory`/`reasoning`/`scenario`/`design-lite` (which have no
  `# givenCode` and no per-language `bodies/`) MUST be language-agnostic in `# prompt`/
  `# rubric`/`# idealAnswer`/`# hints`: **name a mechanism, not one framework's API.** Do
  NOT bake a single stack's identifiers into the concept — e.g. write "free-form string
  logging" not `console.log`; "a colored terminal output vs a JSON sink" not `nestLike`;
  "one central error-handling point (exception filter on Nest/Spring/ASP.NET, or
  middleware + `recover()` on Go)" not just "exception filter" / `HttpException`. When a
  concept genuinely renders differently per language, name ALL the stacks' forms in one
  neutral sentence (the "common → agnostic" rule); reserve the per-language split
  (`bodies/{0-typescript,1-java,2-csharp,3-go}` + agnostic root fallback, see §2) for the
  `debug`/`review`/`optimize` kinds that carry real `# givenCode`. A JS-only idiom leaking
  into a no-code prompt is an authoring defect, not a style nit.

---

## §6. Room tool mapping (thầy 2026-07-13)

Every question is answered OUT LOUD (mic — always on, all kinds). On top of voice,
the room wires exactly **3 FE tools**, derived from `# kind` (never stored per question):

| tool | mode | kinds | notes |
|---|---|---|---|
| Code viewer | **readonly** | `debug` · `review` · `optimize` | One shared component. **Language is chosen ONCE at interview-session start** (TS/Java/C#/Go, like tier). A question with per-language `bodies/` renders that session lang's body — its `# prompt`, `# givenCode` AND `# idealAnswer` (§2) — NO per-question tab; a single-stack `# givenCode`/`# givenLang` question shows as-is. Session lang missing its `bodies/` folder → fall back to the agnostic root `# prompt`/`# idealAnswer`. |
| Mermaid render | **readonly** | `scenario` (+ `design-lite` when the prompt seeds a diagram) | Renders `# diagram`; reuses the lesson mermaid pipeline. |
| xyflow canvas | **interactive** | `design-lite` | The candidate SKETCHES the interface/contract as nodes/edges; the serialized graph JSON is sent alongside the voice transcript for grading. The only interactive tool in the per-module bank. `# diagram` (optional) only seeds the prompt — the answer artifact is the xyflow graph. |

`theory` / `reasoning` = voice only (plus a free notepad — auxiliary, never graded).
`coding` (Monaco + Judge0) and 5-phase `design` (whiteboard) keep their own flows
outside the per-module bank, as in §0.

**Grading payload consequence:** `design-lite` grading receives transcript + xyflow
graph JSON — the BE grading branch must accept the extra graph payload; other kinds
grade on transcript alone (code/diagram are question material, not answer artifacts).
