# StarCi — read the canon before you touch code

`.claude/` and `.claudev2/` together are the single source of truth for how this codebase is
written, front end and back end alike. They are not reference material to consult when stuck; they
are the rules the code already follows.

`.claudev2/` is the canon being rebuilt in the shape described in
[`.claudev2/HOW-TO-WRITE.md`](.claudev2/HOW-TO-WRITE.md) — one file per concept, each shaped
`Definition → Rules → Ban → Example`, filed on an axis. It is built BESIDE the old tree rather than
converted in place, so no rule is ever half-migrated. `.claude/` still holds the skills, the
scripts, the gates and everything not yet moved.

## The rule

**Any request that reads, writes, reviews, or plans code — in this repo or in either front-end repo
— starts by reading the canon that governs it.** Read it before proposing a shape, before opening a
source file to edit, and before answering a question about how something should be built.

| Work | Read first |
|---|---|
| back end | [`.claude/canon/be/INDEX.md`](.claude/canon/be/INDEX.md) and the `enforce/` shelves it points to |
| front end — layer question (leaf / branch / block) | [`.claudev2/fe/canon/uxui/layers/`](.claudev2/fe/canon/uxui/layers/) — one file per layer |
| front end — everything else | [`.claude/canon/fe/README.md`](.claude/canon/fe/README.md), then the shelf for what is being touched |
| where anything physically sits | [`.claude/canon/fe/sourcetree.md`](.claude/canon/fe/sourcetree.md) |
| which skill owns the verb | the skill roster under [`.claude/skills/`](.claude/skills/) |

Reading "carefully" means opening the governing document, not pattern-matching its filename. A rule
skimmed and a rule read produce different code, and the difference is exactly the drift the gates
exist to catch.

## Why it is worded this hard

The failure this prevents is not ignorance — it is **inventing a shape the canon already settles**.
A component placed at the wrong layer, an exception thrown as `new Error`, a block that fetches, a
page that owns its own shell: each one type-checks, each one renders, and each one costs more to
undo later than it would have cost to read the rule first. Canon is cheaper than rework.

## There are TWO front ends. Know which one you are in.

| Role | Folder | Branch | What it is |
|---|---|---|---|
| **front end — live work** | `starci-academy-fe` | `main` | the rebuild: a contracts registry, no `className` escape hatch, `leaf / branch / block` |
| front end — legacy | `starci-academy` | `mtp` | the shipped product. Read it as the source of truth for WHAT a screen contains; do not build here |
| back end | this repo | `mtp` | |

Resolve both paths with `node .claude/scripts/workspace/read-workspace-context.mjs` rather than from
memory — a remembered path is right on one machine and silently wrong on the next.

**The rebuild is a FORK, not a greenfield.** The legacy app is what each screen must end up saying;
the new spine is only how it is spelled. Colour tokens and brand icons are already ported verbatim.
Composition is not, which is why a screen can obey every rule here and still not look like the
product — the acceptance test for a ported screen is the legacy screen, never the rule set alone.

## The front-end layers

Three, and each is decided by ONE question. The full rule for each lives in its own file under
[`.claudev2/fe/canon/uxui/layers/`](.claudev2/fe/canon/uxui/layers/); what follows is only enough to
know which file to open.

| Layer | The question that decides it |
|---|---|
| **leaf** | Does it place two pieces of content relative to each other? A leaf wraps ONE vendor primitive and renders it through. How complex the VENDOR's own component is does not matter — a date picker drawing a month grid is still a leaf, because none of that arranging is ours. |
| **branch** | Does it assemble? Then every class on it comes from the registry, and it owns none of its own. |
| **block** | Does it know the domain — the words, the data, the state? Then it is a block, and it never says how many pixels. |

**Settled: a leaf may keep the classes that hold ONE line together** — glyph-to-baseline glue
(`inline-flex`, `items-center`, the single gap between an icon and its own words) and filling the
width it was given. It may not own `flex-col`, a gap between two separate contents,
`justify-between`, `grid`, padding on a wrapper, or any positioning. Arranging two contents is a
node, and nodes come from the registry.

Do not use the words *atom*, *frame* or *composite* for the new front end. They belong to the
legacy repo's tier system, which is documented separately and has different rules.

## Standing constraints

Recorded in full in canon; repeated here because they are the ones most often broken by a change
that otherwise looks correct.

- **Branch**: back end and legacy front end land on `mtp`; the rebuild lands on `main`.
- **Exceptions**: the back end throws `AbstractException` — never `new Error`, never a bare Nest
  `*Exception`.
- **Secrets**: every credential goes through `parseEnvSecret` and the `<KEY>_FILE` pointer
  convention. The KEY names the VALUE (`STRIPE_SECRET_KEY`), never a path; `envConfig().secrets.*`
  holds what was resolved. `mountPath.*` survives only for CONTENT and CONFIG paths.
- **Front-end theming**: colours change in `globals.css` CSS variables. Do not edit the leaf layer
  to restyle something.
- **Analysis before edits**: for anything beyond a trivial mechanical change, present the analysis
  and wait for approval before editing.
- **One `.claude/`**: this repo holds it, for every repo. **There is no Storybook** — it was retired
  from the front end deliberately. Anything that tells you to open one is out of date, and nothing
  currently replaces it as a drawing board.

## Verifying, not assuming

The gates under [`.claude/scripts/gates/`](.claude/scripts/gates/) and
[`.claude/scripts/verify.mjs`](.claude/scripts/verify.mjs) are the machine half of the canon. Run
the ones that govern what was touched before calling work finished, and **read what they print** — a
gate that passes on a file it never scanned has proved nothing. `verify.mjs` in particular spent a
long time printing a clean-looking result while resolving no source at all; treat "0 checked" as a
failure, not a pass.

## The strict lint layer — canon the compiler enforces

Both codebases carry an ESLint plugin that turns authoring canon into rules the machine holds.

| | Plugin | Wired in |
|---|---|---|
| back end | `plugins/eslint/index.mjs` (`eslint-plugin-starci-be`) | `eslint.config.mjs` |
| front end (rebuild) | `plugins/eslint/index.mjs` (`eslint-plugin-starci-fe`) | `eslint.config.mjs`, plus `npm run test:rules` |

**The config file is the authority on which rules exist and at what level.** Do not copy the roster
into a document — a list transcribed by hand starts lying the first time somebody adds a rule, and
then a reader trusts the copy over the config.

What does NOT change with the roster:

- **Every rule is `error` with zero debt unless a trailing comment carries a `nợ=` count.** A
  violation at `error` is a broken build, not a warning to triage.
- **Adding a rule: measure the debt first.** Debt above zero means the rule lands at `warn` with the
  count in its trailing comment, gets burned down, and is flipped to `error` only at zero. Shipping
  at `error` while debt exists blocks every commit that touches an offending file.
- **Where it bites**: `.husky/pre-commit` runs `lint-staged`, which runs `eslint --fix` on the
  staged files only. Untouched history never blocks you; the file you touch must be clean.
- **The sanctioned exits are stated where they apply.** On the back end: the `*spec.ts` family and
  `src/tests/**` may use `as unknown as` and may read `process.env` to stand up Testcontainers, and
  may `throw new Error`, which there is a test-runner assertion rather than a domain failure.
  Vietnamese that a literal matches on or emits at runtime stays, marked `vn-ok: <reason>` on the
  line.
- **An exemption written as a folder is a policy, and it deserves the same scrutiny as a rule.** The
  front-end structural-class rule currently exempts the whole leaf folder by path; under the layer
  rule above that exemption is too wide and is being narrowed to the glue classes only.

## What is not settled yet

Canon is mid-restructure. The three front-end layer files are written in the new shape; every other
shelf still lives under `.claude/canon/` in the old one. **Where the two disagree about the
front-end rebuild, `.claudev2/` wins** — and say so when you notice the conflict rather than picking
one silently.

Two things in particular are NOT decided, and inventing an answer to either is the expensive kind of
mistake:

- **What replaces the drawing board.** The design system had one and it was retired; nothing has
  taken its place, so "how a component should look before it reaches a screen" currently has no
  home.
- **How much of `.claude/canon/` moves, and in what order.** Many files there already state one
  concept and only need refiling; the large authoring shelves need splitting first. Neither has been
  scheduled.
