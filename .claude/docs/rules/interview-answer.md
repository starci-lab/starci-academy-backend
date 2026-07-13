# Mock-Interview Bank Rules — Technical + Behavioral/EQ

Governs mock-interview question banks. Two FAMILIES share the same DSL grammar and
gate but differ in fields, source-of-truth, and placement:

- **technical** — `courses/<course>/mock-interview/<N>-bank/` (one bank per module),
  grounded in that module's lesson + flashcard content (`# moduleRefs`).
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

---

## §0. Bank & folder structure

- **Bank root** `<N>-bank/{vi,en}.md` — bank META only: `# sortIndex` / `# title` /
  `# description` / `# difficulty` / `# family` (default family for questions inside) /
  `# moduleRefs` (**technical only** — the module slug(s) this bank grounds in).
- **Questions** live one-per-folder under the bank, mirroring the flashcard `cards/`
  convention: `<N>-bank/questions/<n>-question/{vi,en}.md`, `sortIndex` contiguous
  from 0 matching folder index `<n>`.
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
### Target shape — mirror flashcard's `15 × 10` (thầy 2026-07-12: "mock interview có concept khá giống flashcard, ngoại trừ các câu hỏi sâu hỏi mang tính suy luận hơn")

The technical family is the reasoning-question TWIN of the flashcard catalog — same
catalog shape, deeper prompts. So it inherits flashcard's §0 numbers verbatim:

- **Technical:** each course has **EXACTLY 15 banks** — one per coherent sub-topic,
  the SAME 15 sub-topics as the course's 15 flashcard decks (a fact-recall deck and its
  reasoning-question bank are two views of one sub-topic). Order `0-<slug>` … `14-<slug>`,
  `# sortIndex` matching, and `# moduleRefs` grounding the same module(s) as the paired
  deck. (Supersedes the earlier "one bank per module" — banks track the 15 curated
  sub-topics, NOT the raw module count.)
- **Each technical bank has EXACTLY 10 questions** (`0-question` … `9-question`,
  contiguous `# sortIndex`).
- **Tier distribution per bank** (mirror flashcard's level buckets — interview `# tier`
  has no `staff`, so its top bucket is `senior`): at least **3 `junior`** and at least
  **3 `senior`**, the rest `middle`; order questions easy→hard inside the bank.
- **Curate-then-fill to 10** (same as flashcard): a sub-topic with >10 worthwhile
  reasoning prompts → keep the strongest 10 per §1, drop the rest (shallow / contrived /
  near-duplicate); <10 → author NEW deep prompts (real interview questions, not padding)
  biased toward the short tier buckets.
- The DIFFERENCE from flashcard is only the QUESTION nature (§1): a flashcard card is
  fact-recall (read the answer, self-grade); an interview question is a situation/problem
  the candidate reasons through OUT LOUD and the AI grades against `# rubric` +
  `# idealAnswer`. Same catalog, deeper prompts.

- **Behavioral/EQ:** bank count/topic is curated by the teacher, not derived from any
  course structure (universal competencies, one shared global bank set) — it does NOT
  follow the per-course `15 × 10` shape.

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

**`# kind` enum (11 total):**
- technical: `theory` · `reasoning` · `scenario` · `debug` · `review` · `optimize` ·
  `coding` · `design`
- behavioral: `behavioral` · `situational` · `culture`

**Technical-only fields:**
- `# diagram` — mermaid source; used for `kind=scenario` when a diagram helps set up
  the question.
- `# givenCode` + `# givenLang` — the broken/to-review code snippet; **required** for
  `kind ∈ {debug, review, optimize}` when the question does NOT use `# langs`.
- `# langs` — **only** when a question needs MULTIPLE per-programming-language
  `givenCode` variants (e.g. a module with parallel `bodies/{0-typescript,1-java,
  2-csharp,3-go}` tracks — ground a `coding`/`debug`/`review`/`optimize` question
  fairly across stacks instead of forcing one). **Mutually exclusive** with top-level
  `# givenCode`/`# givenLang` — use ONE or the OTHER, never both. List (`## 0`/`## 1`/…),
  each item an object with `### lang` (`typescript`|`java`|`csharp`|`go`|`agnostic`) +
  `### givenCode` (wrap in `<!-- @starci/seperator -->` — code often contains `#`
  characters, e.g. Python/shell comments, that would otherwise be misparsed as
  headings):
  ```
  # langs
  ## 0
  ### lang
  <!-- @starci/seperator -->
  typescript
  <!-- @starci/seperator -->
  ### givenCode
  <!-- @starci/seperator -->
  ```ts
  // TypeScript code
  ```
  <!-- @starci/seperator -->
  ## 1
  ### lang
  <!-- @starci/seperator -->
  java
  <!-- @starci/seperator -->
  ### givenCode
  <!-- @starci/seperator -->
  ```java
  // Java code
  ```
  <!-- @starci/seperator -->
  ```
  `# prompt`/`# rubric`/`# idealAnswer` stay concept-level, shared across every `# langs`
  variant — only the given code differs per language. Seeds into `mock_interview_langs`
  (one row per variant, cascade-linked to the question row in `mock_interviews`).
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
- Technical `design`: `rubricByTier`, not `rubric` — never both.
- Technical `theory`/`reasoning`/`scenario`: plain untagged `# rubric` items (dimension
  tags optional — these kinds aren't scored per-dimension).
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
