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

## The strict lint layer — canon the compiler enforces

`plugins/eslint/index.mjs` (`eslint-plugin-starci-be`, wired in `eslint.config.mjs`) turns the
back-end authoring canon into rules the machine holds. **Every rule below is `error` with zero
debt**, so a violation is not a warning to triage — it is a broken build.

| Rule | Canon | What it stops |
|---|---|---|
| `throw-abstract-exception` | error-handling §1 | `new Error` / a bare Nest `*Exception` |
| `require-exception-object-arg` | error-handling §1 | `new XException()` or positional args — it takes one metadata object, `{}` if empty |
| `no-inline-param-type` | type-safety §4 | an inline object type on a destructured param; the type is a named interface in `types/` |
| `no-restricted-syntax` | type-safety §6 · config-and-env §8 | `as unknown as` outside spec mocks; `process.env` outside `parse-env.ts` |
| `@typescript-eslint/no-explicit-any` | type-safety §1 | `any` — narrow from `unknown` instead |
| `no-nest-logger` · `no-interpolated-log-message` · `no-console` | observability | any logger but `WinstonService`; an interpolated log message (it takes a `WinstonLog` member plus a structured object) |
| `no-deep-module-import` | naming-and-structure §3 | reaching past a module's barrel into its interior |
| `barrel-export-star-only` | naming-and-structure §3 | a named re-export in an `index.ts` — always the symptom of two folders emitting one symbol |
| `require-export-jsdoc` · `require-enum-member-jsdoc` | comments §3 · type-safety §3 | an undocumented export; an enum member that does not state its consequence |
| `no-vietnamese` · `no-emoji` · `no-ai-symbol` | comments | non-English or non-ASCII in source — the bar is a stranger who does not read Vietnamese |

**Where it bites.** `.husky/pre-commit` runs `lint-staged`, which runs `eslint --fix` on the
staged `*.ts` only. Untouched history never blocks you; the file you touch must be clean.

**Adding a rule.** Measure the debt first. Debt above zero means the rule lands at `warn` with
the count in its trailing comment, gets burned down, and is flipped to `error` only at zero.
Shipping a rule at `error` while debt exists blocks every commit that touches an offending file.

**The sanctioned exits**, each stated where it applies: `apps/tools/dashboard/**` is a Vite/React
SPA and is out of scope for the back-end-shaped rules; the `*spec.ts` family, `apps/*/test/**` and
`src/modules/tests/**` may use `as unknown as` (canon §6 names spec mocks) and may read
`process.env` to stand up Testcontainers; `apps/*/test/**` may `throw new Error`, which there is a
test-runner assertion rather than a domain failure. Vietnamese a literal matches on or emits at
runtime stays, marked `vn-ok: <reason>` on the line.

## Semantic code search over this repo (MCP)

`.mcp.json` registers `starci-code`, an MCP server that answers "which module handles refunds"
— the question grep cannot ask. Grep still wins for an exact identifier, so the server runs
hybrid (vector plus keyword) rather than vector alone.

```bash
docker run -d --name starci-code-qdrant --restart unless-stopped \
  -p 6360:6333 -p 6361:6334 -e QDRANT__SERVICE__API_KEY=starci-code-local \
  -v starci-code-qdrant-data:/qdrant/storage qdrant/qdrant:latest
ollama pull bge-m3            # embeddings run locally: no API cost, no source leaves the machine
npm i -g @mhalder/qdrant-mcp-server
```

Then run `claude` in this folder and approve `starci-code` when prompted — a server declared by
a repo file is deliberately not trusted until a human says so. Index with the `index_codebase`
tool, and after pulling work, `reindex_changes` — a stale index answers confidently and wrongly,
which is worse than having none.

It points at its **own** Qdrant on `:6360`, never the app's on `:6333`: a code index must not
touch the `content_rag` collections the product serves, and the app's instance is pinned to a
Qdrant version this client cannot talk to.
