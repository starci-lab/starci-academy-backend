# Business rules · Study library

- `BR-01` — Existing Study and the scored cloze assessment are explicit sibling modes and never collapse into one ambiguous session. _confirmed_; evidence `EV-001`, `EV-010`, `EV-011`, `EV-012`.
- `BR-02` — A review or quiz session is persisted before navigation to focused work. _confirmed_; evidence `EV-006`, `EV-010`, `EV-011`.
- `BR-03` — Live work restores the persisted session identity, card order and acknowledged progress. _confirmed_; evidence `EV-006`, `EV-010`, `EV-011`.
- `BR-04` — Leaving unfinished Study or Quick quiz work preserves resumability; finishing early requires confirmation and reports only completed work. _confirmed_; evidence `EV-010`, `EV-011`.
- `BR-05` — A live session route represents in-progress work and a dedicated result route represents completed work. _confirmed_; evidence `EV-010`, `EV-011`.
- `BR-06` — Invalid, missing or expired sessions recover to a safe setup or overview with an explanation. _confirmed_; evidence `EV-010`, `EV-011`.
- `BR-07` — Study scheduling and route identity remain unchanged; assessment playability requires cloze-valid cards and scoring remains correct blanks over total positive blanks. _confirmed_; evidence `EV-012`, `EV-013`, `EV-014`.
- `BR-08` — Results prioritize weak-topic and contextual next-study actions over decorative celebration. _confirmed_; evidence `EV-010`, `EV-011`.
- `BR-09` — Every remote-data surface exposes pending, ready, empty, failed and retry or recovery behavior. _confirmed_; evidence `EV-002`, `EV-010`, `EV-011`.
- `BR-10` — Foundation browsing supports pagination and can settle as pending, ready, empty, failed or partial. _confirmed_; evidence `EV-004`, `EV-007`.
- `BR-11` — An assessment question is playable only when its card contains at least one valid cloze blank. _confirmed_; evidence `EV-012`, `EV-013`, `EV-014`.
- `BR-12` — Every assessment blank is filled by selecting a term from the provided word bank; the learner may revise unchecked choices. _confirmed_; evidence `EV-012`, `EV-013`, `EV-015`.
- `BR-13` — Assessment mode never falls back to answer reveal, self-reported recall rating or SM-2 review behavior. _confirmed_; evidence `EV-012`, `EV-013`.
- `BR-14` — When the selected scope cannot supply enough cloze-valid questions, starting is blocked with an explicit eligible-count explanation. _confirmed_; evidence `EV-012`, `EV-013`.
- `BR-15` — Each scored question has totalBlanks greater than zero; coverage is derived from correctBlanks divided by totalBlanks and cannot be fabricated by the client. _confirmed_; evidence `EV-012`, `EV-014`.
- `BR-16` — A pre-existing mixed or malformed assessment session cannot continue through review fallback; it recovers to setup without producing a scored assessment completion. _confirmed_; evidence `EV-012`, `EV-013`, `EV-014`.
- `BR-17` — The existing Study branch is neither redesigned nor removed by this revision. _confirmed_; evidence `EV-012`.
