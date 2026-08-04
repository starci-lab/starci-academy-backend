# StarCi — read the canon before you touch code

`.claude/` is the single source of truth for how this codebase is written, front end and back end
alike. It is not reference material to consult when stuck; it is the rules the code already follows.

## The rule

**Any request that reads, writes, reviews, or plans code — in this repo or in the front-end repo —
starts by reading the canon that governs it.** Read it before proposing a shape, before opening a
source file to edit, and before answering a question about how something should be built.

| Work | Read first |
|---|---|
| back end | [`.claude/canon/be/INDEX.md`](.claude/canon/be/INDEX.md) and the `enforce/` shelves it points to |
| front end | [`.claude/canon/fe/README.md`](.claude/canon/fe/README.md), then the tier doc for the tier being touched (`canon/fe/enforce/tiers/`) |
| where anything physically sits | [`.claude/canon/fe/sourcetree.md`](.claude/canon/fe/sourcetree.md) |
| which skill owns the verb | the skill roster under [`.claude/skills/`](.claude/skills/) |

Reading "carefully" means opening the governing document, not pattern-matching its filename. A rule
skimmed and a rule read produce different code, and the difference is exactly the drift the gates
exist to catch.

## Why it is worded this hard

The failure this prevents is not ignorance — it is **inventing a shape the canon already settles**.
A component placed at the wrong tier, an exception thrown as `new Error`, a block that fetches, a
page that owns its own shell: each one type-checks, each one renders, and each one costs more to
undo later than it would have cost to read the rule first. Canon is cheaper than rework.

## Lanes

Most work has a verb, and the verb has a skill — `starci-fe-layout-plan` designs a flow,
`starci-be-cannon-apply` writes back-end code to canon, `starci-fe-review-plan` judges an existing
surface, and so on. Use the specific skill when the verb is clear. When the ask names an outcome
without a verb, or spans several, `starci-canon-first` is the grounded fallback — **never** the
first choice, and never a licence to skip the reading.

## Standing constraints

These are recorded in full in canon; they are repeated here because they are the ones most often
broken by a change that otherwise looks correct.

- **Branch**: all work lands on `mtp`, front end and back end both.
- **Exceptions**: the back end throws `AbstractException` — never `new Error`, never a bare Nest
  `*Exception`.
- **Front-end theming**: colours change in `globals.css` CSS variables. Do not edit the atom layer
  to restyle something.
- **Analysis before edits**: for anything beyond a trivial mechanical change, present the analysis
  and wait for approval before editing.
- **One `.claude/`, one storybook**: this repo holds both, for both repos. The front-end app at
  `starci-academy` has no `.claude/` of its own except the skill-written queues under
  `.claude/fe/` (`proposals/`, `scaffolds/`, `surfaces/`).

## Verifying, not assuming

The gates under [`.claude/scripts/gates/`](.claude/scripts/gates/) are the machine half of the
canon. Run the ones that govern what was touched before calling work finished, and read what they
print — a gate that passes on a file it never scanned has proved nothing.
