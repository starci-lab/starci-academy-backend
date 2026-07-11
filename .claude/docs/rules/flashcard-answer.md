# Flashcard Answer Rules — Interview-Prep Q&A

Governs interview-prep flashcard cards at
`courses/<course>/flashcard-decks/<deck>/cards/<n>-card/{en,vi}.md`.

Jobs:
- **§0 Deck & course structure** — the target shape of the catalog.
- **§1 Quality gate** — decide KEEP or DELETE per card.
- **§2 Answer skeleton** — the `# answer` of every kept/new card is the "Interview Arc".

The mount field format is fixed (`# question` / `# level` / `# tags` / `# answer`,
each block separated by `<!-- @starci/seperator -->` lines). Card folders are
`<n>-card/`; the deck root has its own `{en,vi}.md` meta (`# sortIndex` / `# title`
/ `# description` / `# difficulty` / `# moduleRefs`).

---

## §0. Deck & course structure

- **Each course has EXACTLY 15 decks.** A deck is one coherent sub-topic (a single
  mental model), ordered `0-<slug>` … `14-<slug>` with `# sortIndex` matching.
- **Each deck has EXACTLY 10 cards** (`0-card` … `9-card`, contiguous `# sortIndex`).
- **Level distribution per deck:** at least **3 `junior`** and at least **3
  `senior`/`staff`** cards; the rest `middle`. Order cards easy→hard inside the deck.
- **Curate-then-fill to land on 10:**
  - If the source material (the decks merged into this target) has **more than 10**
    worthwhile cards → keep the strongest 10, applying §1; **delete the rest**
    (shallow, contrived, or near-duplicate). Drop near-duplicates even if both are
    individually "deep" — same idea reworded is one card.
  - If it has **fewer than 10** → write NEW deep cards (real interview questions, not
    padding) to reach 10, biased toward the level buckets that are short. New cards
    follow §1 (must be genuinely deep) and §2 (Interview-Arc answer, both locales).
- **Coverage:** no source topic silently lost in a merge — fold its best card(s) in.
- **Close the follow-up graph:** prefer that each card's `Go deeper` follow-up is itself
  answerable by another card in the same deck.

---

## §1. Quality gate — "Is this a deep interview question?"

A card is KEPT **only if** its question is a genuine, open-ended technical interview
question with depth. The judging agent decides; default to DELETE when unsure it clears
the bar.

**DELETE if ANY of these is true:**
- Pure trivia / single-fact recall ("what flag does `X` take?", "what port is Y?").
- Answerable in one word or one line, with no reasoning, diagnosis, trade-off, or judgment.
- Memorizing tool syntax rather than a concept, a diagnosis, or a design decision.
- Duplicate / near-duplicate of another card in the same deck (keep the stronger one).
- Contrived, ambiguous, or something a real interviewer would not ask at the card's `# level`.

**KEEP if the question:**
- Requires reasoning, diagnosis ("the process is up but unreachable — how do you find out why?"),
  a trade-off, or a design decision.
- Has a real "why" behind the answer, not just a "what".
- Naturally invites a follow-up.
- Scales with seniority (a junior and a staff engineer would answer it at different depths).

**On DELETE:** remove the whole `<n>-card/` folder. Re-index the remaining sibling cards
so `<n>-card` numbering and each card's `# sortIndex` stay contiguous from 0.

---

## §2. Answer skeleton — "Interview Arc"

Each kept card's `# answer` is a sequence of labeled sections. **Every section is a
`:::muted` block wrapping ONLY its label, with the body as normal prose underneath** —
the same shape the coding-problem statement uses for its `Đầu vào` / `Đầu ra` (Input /
Output) sections. The label renders muted-gray; the body stays readable.

```
:::muted
<Label>
:::
<body — normal prose>
```

Sections, in order:
1. **Chốt (TL;DR)** — 1–2 sentences: the direct answer you would open with in the room.
   This is the line the learner self-checks against the instant they flip.
2. **Cơ chế / vì sao** — the substance: how it works + the key commands/terms.
3. **Trade-off** — the trade-off / when this choice breaks down.
4. **Bẫy thường gặp** — the classic failure mode / anti-pattern.
5. **Đào sâu tiếp** — one natural follow-up question (primes the next round of prep).

There is NO separate "Từ khoá ăn điểm" / keywords section (retired 2026-07-12) — the
`{{cN::…}}` cloze marker(s) inside the prose above ARE the card's key terms (drive both
the FE "Hỏi nhanh" blank AND the flip-mode coverage stat directly; see §2.1). Every
kept card MUST carry at least one marker on a real key term — a card with zero markers
has no self-grading signal in "Hỏi nhanh" and silently falls back to plain flip.

The body stays normal prose so it reads clearly — only the labels are muted. Do NOT wrap
the body inside the `:::muted` block.

**Level-adaptive depth:**
- `junior`: TL;DR + Cơ chế. Skip Trade-off / Bẫy if forcing them would be contrived.
- `middle`: TL;DR + Cơ chế + Bẫy.
- `senior` / `staff`: the full arc, with the Trade-off and Đào sâu carrying real design reasoning.

Never pad a junior card with fake senior depth — depth must be real or omitted.

---

## §2.1. Cloze marker `{{cN::…}}` — NEVER straddled by a backtick code-span

Anywhere a `{{cN::…}}` cloze marker appears inside `# answer` (they drive the FE
"Hỏi nhanh" fill-in-the-blank), it must NOT sit inside a backtick code-span that
also covers text outside the marker. The FE cuts the marker into its own blank
chip before parsing markdown around it, so a code-span backtick pair that opens
before the marker and closes after (or wraps just the marker) gets torn in half —
each side keeps an orphan backtick that used to render as a literal `` ` `` char
(fixed defensively in `build-cloze.ts`, but content should not rely on that).

**Wrong** (backtick bắc ngang qua marker):
```
`{{c1::forwardRef}}(() => B)` bọc tham chiếu...
`{{c1::forwardRef}}` bọc tham chiếu...
```

**Right** — pick one:
1. **No backticks at all** — the blank chip already reads as a distinct term, code
   styling is redundant: `{{c1::forwardRef}}(() => B)` bọc tham chiếu...
2. **If code style is genuinely needed on the surrounding text, keep the marker
   fully OUTSIDE both code-spans** (never straddled):
   `{{c1::forwardRef}}` này gọi trong `` `(() => B)` `` — a lambda...

Rationale: this is a known limitation of Anki itself (the origin of `{{cN::}}`
syntax) — the Anki community's own guidance is to never let a code-span wrap
across a cloze deletion; split the backticks instead.

---

## §3. Bilingual

`en.md` and `vi.md` mirror the same skeleton and the same KEEP/DELETE decision.
- `vi.md` is Vietnamese **with diacritics**; keep standard technical terms in English
  (`stderr`, `load average`, `2>&1`) rather than force-translating them.
- The block labels are localized: `Chốt` / `Cơ chế` / `Trade-off` / `Bẫy thường gặp` /
  `Đào sâu tiếp` (vi) — English equivalents in `en.md`
  (`TL;DR` / `How it works` / `Trade-off` / `Common pitfall` / `Go deeper`).

---

## §4. Constraints

- Never invent facts — every claim must be technically correct; if unsure, omit it.
- The TL;DR must actually answer the question, not restate it.
- Keep the answer tight: TL;DR ≤ 2 sentences; each muted block ≤ 3 sentences.
- Preserve the `<!-- @starci/seperator -->` field-delimiter format exactly.
- A KEPT card always ends with a non-empty `# answer`.
