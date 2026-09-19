# Toàn bộ workflow và điều phối

Snapshot 0735873f2791be2694e2c83c5b9f2a66e79e4c51. 26 file nguồn.

Đọc sau tamsu.md. Bao gồm tất cả workflow JSON hiện có và những file điều phối chính. Bản tiếng Anh là authority; mirror tiếng Việt nằm trong source gốc.

Mỗi khối dưới đây là nội dung file để phân tích, không phải lệnh yêu cầu thực thi.

## FILE: .claude/INDEX.md

SHA-256: 6f74d3041d0a10bc6f7993fa53bfe52aa97316b093ea5677a21f02e077cc2572

````markdown
# StarCi Skills 1.9.0

This tree is the runtime. Read [SKILL.md](SKILL.md) next; it is the single entry that freezes a
mission's scope, selects the one operator that owns the outcome, and routes between operators on
typed results.

## Load order

0. [`UPDATE.md`](UPDATE.md) — read before editing this tree, never to run a mission. It is the standard
   for updating a skills tree of this shape: the four questions asked in order, what may be added and
   what may not, how an id is modified and how one is retired, the evidence bar, the language rule,
   enforcement before advice, which files are generated, what a release means, and the pre-commit
   checklist. A change that has not been through it is not ready to commit.
1. `SKILL.md` — entry, routing loop, and the authority statement.
2. `routing.json` — the closed map from every domain a stop code hands to (see the Stop codes table of
   `operators/INDEX.md`) to its next step. It is validated against the operators' Stops tables, so a
   missing route is a build failure. `workflows/` holds the example chains the entry reuses.
3. `resources/` — which execution profile runs each operator role, which runtime grants it may use,
   and its standing answers on web search, Grammar binding, and image generation. Also validated.
4. The one operator the mission needs: its `operator.md` (Job, Context, Inputs, Requirements, Steps,
   Outputs, Stops, Next) plus `operator.json` (id, domain, resources). Stop codes resolve through the
   Stop codes table of `operators/INDEX.md`.
5. Only the knowledge topics that operator binds.

Do not preload the tree. An operator binds the smallest set of topics its decision needs, each with
its fingerprint and complete rule inventory, and may emit no identifier outside that inventory.

## Layout

```text
SKILL.md                 one entry, operators listed in operators/INDEX.md, one routing map
routing.json             closed operator routes, four kinds: operator | resume | user | external
alias/                   alias.json (machine registry: location, scheme, binding, writers, zone) + INDEX.md (generated map by zone); every operator reads by alias only
resources/               tools.json (the closed tool registry: modes and per-runtime support, addressed as @tools/<id>) + agents/profiles/{openai,claude}.json (6 profiles, permits per tool) + orchestrator.json (one agent per operator, max 3, profile equivalents); validated
workflows/               example chains (steps of parallel branches, loops, presets) the entry reuses when a request matches their when; otherwise it composes its own under the same rules; validated
operators/INDEX.md       generated: what each operator reads, which kinds it consumes and produces, its steps, and every stop code with its disposition; operators/errors.json holds the codes several operators share
operators/<id>/          operator.md (+vi) one authored file per operator, operator.json (id, domain, resources), errors.json (its own codes), validate.mjs, self-test.mjs
knowledge/
  ui/composition/        what a tree must contain, before it exists   -> frontend.direction.decide
  ui/presentation/       which CSS value an app-owned boundary takes  -> frontend.presentation.resolve
  ui/proof/              what is only true once rendered              -> frontend.surface.audit
  patterns/fe, be        code conventions extracted from the two live sources
  grammars/<family>/     one visual family's realization of Common
templates/               one template per document kind; each carries the json template-contract the tree is checked against;
                         kinds/ types every file that crosses between steps (<kind>.contract.json + <kind>.skeleton.md for markdown, <kind>.schema.json for data); step/ holds the request.json and response.json gates
scripts/                 validate-routing.mjs, validate-resources.mjs, validate-knowledge-citations.mjs, validate-alias.mjs, validate-templates.mjs, validate-operator.mjs, validate-workflows.mjs, validate-request.mjs, validate-response.mjs, validate-step.mjs, run-operator-self-tests.mjs;
                         device-state.mjs and workspace-portable.mjs (+ specs), which the backend package.json calls
readiness/               workspaces/ schemas that the portable and hydrated route declarations name as $schema
```

`npm test` runs the routing validation, the resources validation, the knowledge citation check, the template check, every operator self-test, and the script specs. It is green at the published
head or the head is not publishable.

## Rules that hold everywhere

- An operator performs one job in one linear pass. It never calls another operator, routes a
  workflow, pauses internally, or returns free-form control instructions. The parent alone maps a
  validated output to the next transition.
- Only a validated field routes. Prose in a receipt, a narrated outcome, or an output that failed its
  validator does not route.
- Authority lives in operator schemas, not in this file or in `SKILL.md`. `git.publish` cannot
  express a force push; `release.deploy` cannot run without its declared authorization;
  `uat.verify` has no field that can hold a credential.
- English `.md` files are the only runtime authority. Same-stem `.vi.md` files are human mirrors and
  never enter a context manifest, dependency list, or operator binding; a parity validator reads them only to prove the mirror has not drifted, never as authority.
- Rule IDs are stable public addresses. Append; never renumber, reuse, or silently change meaning.

## Lineage

1.9.0 (2026-09-04): owner library repairs and verified dependency updates have bounded operators with regression proofs; identity provisioning binds actual provider custody and proves product login; UI audits prioritize selected primary surfaces and preserve the limits of deferred secondary states.

1.8.0 (2026-09-04): interaction has one communication policy and typed question/selection gates; material directions are chosen by the user with rendered evidence, recorded choices are reused, and routine confirmation is omitted within authorized work; operational grants and routing remain unchanged.

1.7.9 (2026-09-04): opening a session is the first act of a mission that writes, never a question put to a person and never something done after the first write — a mission that has already written outside a session opens one and moves the work onto its branch; a bind that finds uncommitted source on the mutation branch refuses, whether or not a declared write root covers it.
1.7.8 (2026-09-04): a sealed value is resolved only where it is consumed — a diagnostic that proves a reference resolves reports the outcome, the name, a length or a digest, never the value, and one that cannot be written that way is not run; a receipt that had only a fallback section now has a finding section to record the lapse in.
1.7.7 (2026-09-04): a walk is evidence only for what it pressed — every scored assertion of a UAT capture names the surface control the step acted on, so a step that makes something happen other than through the surface cannot be scored.
1.7.6 (2026-09-04): a score is a claim about the candidate it scores — a decision declares what each candidate does not carry, and a criterion declared unmet cannot be scored at the passing end nor left unscored.
1.7.5 (2026-09-04): a UAT run is triggered by need and authorised by the environment declaration for its seed and identity classes, not by a person named in the request; a state-reading topic — composition, accessibility, the taste lens — is blocked with its coverage gaps named when the matrix does not cover every state the direction declares, and a narrowed round cannot close a loop or exhaust a budget; the serve rung runs the delivery gates the product declares, patch coverage against the merged base included.
1.7.4 (2026-09-03): authority comes from the environment declaration — .stacks/<env>/environment.json marks each operation class declared or person, non-production defaults to declared for provisioning and runtime, production to person, and the approval field accepts the declaration reference with its hash; several rendered candidates are ranked by the proof rubric and the dominant one is taken, a person is asked only over a scored tie; a data-volume criterion is measured at the flow's representative seeded volume, routes to seed below it and is data-bound at it; a criterion the person's printed choice was known to fail is person-accepted and does not block quality or uat.
1.7.3 (2026-09-03): a decision handed to a person is printed as rendered candidates — one per option, at least three for composition or taste, a capture per viewport, a one-line question — and the direction and audit validators refuse a user route that prints fewer; the family binds by the route's grammarId as @knowledge/grammars/<family>; Steps rows state the job and the kind, mechanisms live in the kind contracts; UPDATE.md carries the two writing principles (nothing specific, no errata) and the tree is swept for both.
1.7.2 (2026-09-03): a restart is not a rebuild — scripts/serve-runtime.mjs records the served head and a digest of the route's manifests and lockfiles, clears the framework build cache when they moved, the previous head is unknown or --clean is asked, and stops the whole process tree of a server, verifying by connecting that the port is free; the platform-operation receipt requires a cache row and the validator refuses a kept cache over an unknown previous head.
1.7.1 (2026-09-03): INTEGRATION_CONFLICT retired into INTEGRATION_FAILED — serve resolves a merge conflict under a closed four-rule set, records each resolution on the merge, runs the delivery gates on the merged head before restarting, and stops only on a red gate; the audit's Served surface names the family version observed and the version the delivery was resolved against, and states the drift in the evidence of any verdict it could flip.
1.7.0 (2026-09-03): the runtime is each product's uat integration branch on the fixed projected port — platform.operate climbs the whole ladder (stack-up → locate → start-role → serve → attest), serve merges the session branch into uat and restarts idempotently by head, servers run detached with pid and log (scripts/serve-runtime.mjs), the lease is the merge order, RUNTIME_BUSY and INTEGRATION_CONFLICT; workspace.bind binds by ancestry (the served head contains the pinned commit); the audit takes a route input and a Served surface section; UAT snapshots carry isolation; the two-sessions-one-product law lives in one place; a ports projection schema with sessionSlots defaulting to 0.

1.6.1 (2026-09-03): @tools/print — direction prints every candidate URL and a capture per viewport before the decision is written, the audit prints the sheet, the worst capture per topic and the Verdict table, UAT prints the step-capture summary; receipts carry a ## Printed table and validators refuse a decision the person never saw.

1.6.0 (2026-09-03): a missing UAT record is created, not reported — platform.operate provisions the account at the registry's identity provider with the sealed shared password and seeds the data; the runtime registry is keyed <project>/<role> (owner.schema.json) and carries identity; the audit signs in as the flow's account and IDENTITY_MISSING hands to provisioning; the UAT flow folder (flow.md, accounts.<env>.json, seed, golden snapshots, append-only runs, latest.json, history.md) is a contract; env on uat, audit and platform; the staging-uat example workflow.

1.5.4 (2026-09-03): the host probes a port by connecting before binding (Windows lets two servers bind one loopback port); 1.5.3 shipped with that spec red.

1.5.3 (2026-09-03): @tools/host ships its server (scripts/host-artifacts.mjs) so no session writes one for the occasion; .gitattributes pins LF.

1.5.2 (2026-09-03): the direction decision declares the surface class (coverage.surfaceClass and a ## Surface class row read from COVERAGE-1); the audit copies it from the decision instead of declaring one.

1.5.1 (2026-09-03): the contrast topic's verdict rule takes the topic's own prefix (CONTRAST-1); COLOR-6 is retired and points at it.

1.5.0 (2026-09-03): UPDATE.md, the neutral standard for changing a skills tree, first in the load order and shipped with the installer; session-first and SESSION_MISSING; git.publish demands receipts; every example workflow is a long flow (bind runtime → screenshot audit → quality → uat → publish); the taste (TASTE) and experience (UX) lenses conclude inside their own topics and the final verdict is a table in quality.verify's receipt; @tools/host serves candidates per viewport; the consolidation pass took the day's concepts from 44 places to 19 and retired ui.md and FE-TEST-7.

1.3.0 (2026-09-03): a mechanical presentation sweep (scripts/sweep-presentation.mjs: APP_OVERRIDE, APP_REIMPLEMENTATION, OFF_SCALE, SHELL_GEOMETRY) wired into frontend.source.apply and quality.verify; resolve scope covers every app-owned leaf/branch folder; twin, paired-spec and deployment-constant rules; rules are written product-agnostic.

1.2.0 (2026-09-03): the second test round (tests/) and its fixes: state.json has a schema and the resume linkage is checked; a workflow declares asks; response.next must be offered by the Next table; UNKNOWN_STOP is emittable; the architecture decision publishes the operations the backend plan consumes and cites coverage-matrix dimensions instead of BA-<n>; uat.verify accepts its own lawful refusal; a radius topic.

1.1.0 (2026-09-03): the tree ships as the npm package @starci/skills; npx @starci/skills init installs it as a repository's .claude runtime with the CLAUDE.md and AGENTS.md bootstraps, update keeps local edits, doctor runs the validators on the installed copy; @starci/grammar 0.4.2 (the core entry re-exports Common).

1.0.3 (2026-09-03): a tools registry replaces grants and policies (resources/tools.json, @tools/<id> in Steps, per-runtime support, profile equivalents); every operator binds an OpenAI profile for the Codex processor; the first test round (tests/) and its fixes; docs/ and sites/ return.

1.0.2 (2026-09-03): every operator is one authored operator.md with a request/response branch layout, JSON kind contracts, an errors registry with dispositions, example workflows, and the frontend.*/backend.source.apply names; 1.0.1 was the dry-run round that exposed the old shape.


This tree replaced the v7.6 runtime on 2026-09-02. The complete v7.6 tree, including its 13 skills,
113 operators, templates, and runtime contracts, is preserved on the `v7` branch of this repository.
A v8 document that cites a v7-only file names that branch.
````

## FILE: .claude/SKILL.md

SHA-256: 5dc235f08d4b8c7a5f90be25787592a27592bd18e85f2d5bf52005d132430b41

````markdown
---
name: starci
description: Complete one StarCi mission by freezing its scope, selecting the one operator that owns the outcome, and routing between operators on typed results until the outcome is proved or a person must decide.
---

# StarCi

One entry, the operators and workflows listed in their indexes, one closed routing map, one tool registry. This file picks the
workflow or composes one, selects the first operator, and sequences the rest. It does no work of its own: it never decides a value, writes source, or judges a
result.

## Setup

Before communicating a question, apply [the interaction policy](resources/interaction.md).
This changes communication only: all routing transitions, operator boundaries and required
authorizations below remain in force. An Ask column or diagnostic reason is not a prompt to forward.

1. Freeze one mission scope: the unit, the target, inclusions and exclusions, write roots, external
   effects, and what will count as proof. Two readings that would change any of those is one focused
   question, not a guess.
2. Run `workspace.bind` for any mission that reads or writes routed source. Nothing else may resolve a
   checkout, and a similar directory name is never route authority.
3. Look for a workflow first: read the `when` of every example in `workflows/`. A full match is run as
   written, its presets filling `request.json`. The examples are references, not the only chains
   there are: when the match is partial, or the business is harder than any `when` describes, the
   entry brainstorms its own chain from the operators' `## Next` tables under the rules
   `workflows/README.md` states (required inputs produced earlier, no shared write alias inside a
   step, loops capped, a declared end) rather than bending a near-miss example into shape; a composed
   chain worth keeping becomes a new example. Every chain, written or composed, obeys the same
   long-flow law: a chain that writes frontend source under `mode: apply` proves the surface with
   `frontend.surface.audit` and walks it with `uat.verify` before it reaches `git.publish`, and a
   chain that delivers any user-facing flow does the same, because a delivery nobody looked at and
   nobody walked through is not a delivery.
4. Create the session before anything else happens. Nothing is designed, written or committed outside
   a session: the first act of a mission that will write anything is, in order, the session folder,
   the branch the route's git policy names for session work, and a validated `request.json` — never a
   question put to a person about whether to open one or which of those to do, because the tree has
   already answered both, and never something done after the first write. Before any file outside the
   session folder is read in order to change it, and before any file outside the session folder is
   written, `<Source>/.worktrees/sessions/<sessionId>/state.json` and
   `step-1/parallel-1/request/request.json` exist on disk and `scripts/validate-request.mjs` is green
   on that branch. An agent that finds itself editing routed source, or publishing it, with no
   `step-N/parallel-M` under a session stops and reports `SESSION_MISSING`. Its repair is fixed, not a
   choice to surface: open the session now, move the already-written change onto the branch its git
   policy names for session work, and run the operators that owe the receipt for it — the same
   recovery `SESSION_MISSING` itself states — never write the session afterwards to make the past look
   gated, because that records the work instead of gating it. Designing by hand and committing on a
   session branch with no session on disk is the same violation as writing with no request: the
   candidates nobody saw, the screenshots nobody took and the UAT nobody ran are exactly what the
   missing folder was supposed to hold.
5. Select the first operator of that chain. Read only that operator's `operator.md` and
   `operator.json`.
6. Run that operator, end to end, on the one profile its `operator.json` names under `resources`, with
   only the grants it lists. An operator has no other model, no inherited turns, and no grant the
   assignment omits.

Cross-session evidence uses scripts/producer-import.mjs. Copy a completed producer request/response bundle into an unused receiving step-N/parallel-M coordinate, preserving every byte and original session/step metadata. import.json binds the source and target coordinates and every file digest. The input gate verifies the original frozen request, its declared completed outputs, origin and copied bytes; imported slots are evidence only and never enter the receiving chain, steps, request hashes or leases. Use the normal step-N/parallel-M/response input path. No operator is rerun, and no source-write authority is imported.

## Entry

| The request is about | First operator |
| --- | --- |
| Which project, checkout, or runtime binding applies | `workspace.bind` |
| What the product promises, who may have it, what happens when it fails | `business.decide` |
| System boundaries, data ownership, or the tech stack | `architecture.decide` |
| Server behaviour, an API contract, persistence, or a job | `backend.source.apply` |
| Creating, restructuring, or redesigning a page or surface | `frontend.direction.decide` |
| Which CSS value an already-composed tree takes | `frontend.presentation.resolve` |
| Writing an already-resolved tree into product source | `frontend.source.apply` |
| Repairing existing behavior in an explicitly bound owner library package | `workspace.bind`, then `library.source.apply` through `library-maintenance` |
| Consuming a verified package release through exact dependency metadata | `workspace.bind`, then `dependency.update` through `dependency-maintenance` |
| Whether a rendered surface actually holds up | `frontend.surface.audit` |
| Build, lint, typecheck, coverage, or Sonar | `quality.verify` |
| Whether a real person can complete a real journey | `uat.verify` |
| Shipping a release, or recovering one | `release.deploy` |
| Observability, Sonar service, or a tunnel | `platform.operate` |
| An educational content unit | `content.generate` |
| Publishing an approved Git boundary | `git.publish` |

A request that names no owner, or two owners whose scopes differ materially, stops here with one
focused question naming the competing boundaries.

## The loop

```text
request/request.json -> validate-request.mjs -> agent writes response/ -> validate-response.mjs + the operator's validate.mjs -> route
```

Routing reads `response.json` and nothing else:

1. `done` advances the chain to the next step the workflow names; the next branch's `request.json`
   points at this branch's outputs by explicit path.
2. `waiting` runs the nested exchange the response awaits (`<exchange>/request` and `response` inside
   the same branch), then resumes the same agent; sibling branches keep running.
3. `blocked` reads `stop`, looks the code up in the merged registry (`operators/errors.json` plus the
   operator's own `errors.json`) for its `domain`, and resolves that domain in `routing.json`:
   - `operator` invokes the named operator, then returns here;
   - `resume` re-enters the same operator in a new step, `request.json.resume` naming the blocked one;
   - `user` stops and reports what the person must decide or publish;
   - `external` stops and reports what outside the runtime must change.
   A code whose disposition is `fallback` never blocks: the agent performs the fallback, records it
   under `## Fallbacks taken`, and continues, unless the code's `unless` param says otherwise.

A response that fails either validator does not route. Prose in `response.md` does not route. Only a
validated field of `response.json` does.

`routing.json` is closed and checked: every domain an operator's stop codes hand to has exactly one
route, and no route names a domain no code reaches. A missing route is a build failure, not a
judgement call.

## Progress

Every operator carries its own resume and fingerprint semantics, so this file holds no progress
counter and no handoff state. A `resume` route that returns `NO_PROGRESS` means the same input
reached the same wall: report the wall rather than trying again.

A cycle between two operators is valid only while the progress fingerprint changes. A repeated
fingerprint, or the same material finding twice, ends the loop and reports the smaller owner.

## Authority

This file grants nothing. Every authority boundary is enforced by the operator's own `operator.md`
tables and `validate.mjs`, which this file cannot widen:

- `git.publish` has no requirement that can name a force push, a bypassed hook, a reset, a clean, a
  stash, or a branch deletion; it merges the session branch, pushes non-force, and a conflict is
  `NON_FAST_FORWARD` for a person.
- `release.deploy`, `platform.operate` and `uat.verify` require an `approval`, taken from the
  environment's own declaration where it marks the touched operation class `declared` and from a
  person only where the environment marks it `person`; `release.deploy` runs only on a
  `quality-verification` input.
- `uat.verify`'s account record refuses a password field, and its validator rejects a
  credential-shaped string anywhere in what it writes.
- `frontend.presentation.resolve` and `frontend.surface.audit` may name only rule identifiers the bound
  knowledge publishes; `frontend.source.apply` writes only classes in the resolved inventory.
- A source-writing operator commits only on `session/<sessionId>`; the person's branch is never touched.

If a mission seems to need more than an operator allows, that is the answer, not an obstacle to route
around.

## Knowledge

Operators bind their own knowledge; this file does not preload it.

| Folder | Bound by |
| --- | --- |
| `knowledge/ui/composition/` | `frontend.direction.decide` |
| `knowledge/ui/presentation/` | `frontend.presentation.resolve` |
| `knowledge/ui/proof/` | `frontend.surface.audit` |
| `knowledge/patterns/fe/`, `knowledge/patterns/be/` | `frontend.source.apply`, `backend.source.apply` |
| `knowledge/grammars/<family>/` | every operator that composes that family |

English `.md` files are the only runtime authority. Same-stem `.vi.md` files are human mirrors and
never enter a context manifest, a dependency list, a validator input, or an operator binding.

## Orchestration

One invocation of one operator is one agent, created fresh on the profile its `operator.json` names,
with the aliases its Context table declares and the tools its `operator.json` declares (`@tools/<id>` from `resources/tools.json`, one mode each) and nothing else. `resources/orchestrator.json`
fixes the rules: at most three agents at once, branches of one step never sharing a write alias,
dispatch by workflow and `routing.json`, hand-off only through `response.json` fields inside the
session (`state.json`, `step-N/parallel-M/{request,response}`), a session the orchestrator creates
first and deletes after `git.publish`. An agent never starts another agent; a nested exchange (a
critique, a review) is a second fresh agent the orchestrator spawns for a branch that paused with
`waiting`. `alias/alias.json` is the one place an alias resolves to a location, and `alias/INDEX.md` is
its readable map by zone (workspaces, grammar, knowledge, worktrees, remote, dynamic); an operator
reads only what its Context table names.
````

## FILE: .claude/UPDATE.md

SHA-256: 6cc5b38248c80c268ea18296fb535adde9adde2ef630b0ce40ad7e36d8e504fa

```markdown
# Updating this tree

Read this before editing anything under `knowledge/`, `operators/`, `templates/`, `workflows/`,
`scripts/` or `resources/`. It is the standard the tree is maintained by, not a description of what
the tree currently says.

A skills tree of this shape is a set of stable addresses. Rules carry ids that other files, receipts
and validators point at; operators carry step tables that scripts read; templates carry contracts
that every authored document is checked against. What makes such a tree usable after a year is not
how much it says but how few places each thing is said in. Every edit below is judged by one
measure: **places per concept**. A change that answers a question already answered somewhere else has
made the tree larger and worse, whatever it added.

## The four questions, in order

Before writing anything, answer these in order and stop at the first that applies.

**1. Is the thing already forbidden?**
If an existing rule already says no and the violation happened anyway, this is an enforcement gap,
not a knowledge gap. The fix is a script, a validator, an operator step or a stop code — something
that would have refused the work. Adding a rule that repeats a rule the tree already publishes leaves
the hole open and adds a second place to maintain. Zero findings from a gate while the work was
plainly wrong is the signature of this case.

**2. Does the concept have no home at all?**
Then one rule, in the file whose reader binds it, stating a shape. A rule says what must be true of
any instance; it never shows a worked example from the product the tree happens to be installed in.
Append the next ordinal of that topic's prefix.

**3. Is an existing rule wrong, or narrower than the truth?**
Change that rule's Case and keep its id. A sibling rule created because the original was slightly off
is the most common way a tree grows a second home. Widening a Case, replacing its `When`, or adding a
Case to the same rule are all preferable to a new id.

**4. Is the concept already in two places?**
Fold. Choose one home — the file whose reader binds the concept — and reduce every other place to a
citation of that rule's id. A citation is a link and an identifier, never a paraphrase; a paraphrase
is a second home wearing a reference's clothes.

## What may be added, and what may not

May be added:

- **A concept** with no home, as one rule stating a shape.
- **A gate**: a validator, a sweep, a schema constraint or a stop code that makes an existing rule
  refusable.
- **An operator step**, when an existing operator must now read or emit something.
- **An evidence note** under `tests/evidence/`, recording the occurrences that justified a rule.

May not be added:

- **A code example from a product.** A rule states a shape: a relationship, a constraint, a
  condition. Concrete component names, file paths, line numbers, commit shas and counts belong to
  evidence, not to law.
- **Anything specific.** The tree is installed by teams that do not share the history that produced
  it, and a rule speaks in roles — the bound project, the route's family, the projected port, the
  kind — never in the one instance this install happens to have. A rule naming a repository, an
  application, a company, a page, a machine path, a port, a tool or the number from one run cannot be
  read by another install; where the concept needs a name, it names the alias or the role, not the
  fact.
- **A restated threshold.** A number lives in exactly one rule. Every other rule that needs it cites
  that rule's id. Two copies of a number drift, and the drift is discovered as a contradiction
  between two green gates.
- **Errata.** A rule states what is true now, never what changed or why it changed: not "used to",
  not "as of", not an incident it was written against. The change record is the commit and the
  evidence file, not the rule. A retired id keeps only the one clause naming it and the survivor it
  folded into — nothing more, because that address must still resolve for a reader who finds an old
  citation.

## How to modify

- **Ids are stable public addresses.** Receipts, validators, other rules and other teams' notes point
  at them. Never renumber, reuse or silently change what an id means.
- **Cases append.** A rule's Cases are ordinal within the rule. Add Case *n+1*; do not renumber the
  ones above it. Changing an existing Case's wording is correct when the Case was wrong; splitting
  one Case into two new ids is not.
- **A threshold lives once.** When a rule needs a number another rule owns, it names the owning rule
  and the situation, and stops. When two rules both need to own a number, that is a sign the concept
  was split in the wrong place: fold first, then state the number once.
- **Change the contract before the documents.** Shapes are enforced by the template contracts. To
  change a shape, change the contract, run the template validator, and bring every document it names
  into conformance in the same commit.

## How to delete

A rule is never deleted and never renumbered. It is **retired**: its number stops being published,
and the file that used to publish it records the retirement in prose, naming the id and the survivor
it folded into. The number is never reused. A topic may therefore publish a non-contiguous series,
and that is the intended result — a reader who finds an old citation can still resolve it.

The citation gate understands this: a line that says a number is retired may name numbers the topic
no longer publishes, so the record stays legal without reopening the address.

## Evidence

- A rule needs **at least two independent occurrences** before it is law. One occurrence is an
  anecdote and legislating it turns a local accident into a constraint on everyone.
- Occurrences are recorded under `tests/evidence/`, dated, in prose, with whatever concrete detail
  they need — paths, counts, screenshots, line numbers. Evidence is allowed to be concrete precisely
  because it is not law.
- The rule cites its evidence from its `Sources:` line. That line is the join between the shape and
  the observations that justified it.
- Evidence that contradicts the intended rule is recorded as it stands. A rule written against the
  observations is worse than no rule, and the count that refuses it is the most useful thing in the
  file.

## Language

- **English `.md` files are the only runtime authority.** Every context manifest, dependency list,
  operator binding and validator input names an English file.
- **Same-stem `.vi.md` files are human mirrors**, written in the same commit as the English file they
  mirror. Nothing loads a mirror as authority.
- The one thing that reads a mirror is the parity check that proves it has not drifted from its
  English original. That check takes no authority from the mirror; it only compares.

## Enforcement first

Every rule an operator relies on has something behind it that would refuse a violation: a validator, a
schema constraint, a sweep, or a stop code in the operator's own table. A rule with nothing behind it
is advice, and advice is what the four questions above exist to avoid adding.

A gate reads the rule file. It does not carry its own copy of a threshold, a closed list or a set of
names — it parses them out of the file that publishes them, so changing the rule changes the gate and
there is no second place to forget. A gate that hard-codes what a rule states is itself a second home
for that concept, and the next edit to the rule will silently pass it.

## Regeneration

Some files in the tree are generated and must never be hand-edited. After changing their sources,
regenerate them and commit the result:

| Generated | Regenerate with |
| --- | --- |
| `operators/INDEX.md` (+ mirror) | `node scripts/generate-operators-index.mjs` |
| `alias/INDEX.md` (+ mirror) | `node scripts/generate-alias-doc.mjs` |
| `docs/reference/**` (+ `docs/vi/reference/**`) | `node docs/scripts/generate-docs.mjs` |
| the published site catalog | the site's own generation step |

Each generator has a `--check` mode, and the test run uses it: a stale generated file is a build
failure rather than a silent divergence.

## Release

- One version, one **lineage line**. Each release adds a single line to the lineage section of the
  root index saying what changed and why, newest first. The lineage is the tree's own history and the
  only narrative it keeps.
- **Patch**: a gate, a validator, a wording fix, a regenerated file, an evidence note. No id changes
  meaning and no document shape changes.
- **Minor**: a new concept with a new id, a new operator step, a new template section, a new stop
  code, a folded concept whose old id is now retired. Existing addresses still resolve.
- **Major**: an address stops resolving, a document shape changes in a way an installed tree cannot
  read, or the entry's routing contract changes.

A tree is publishable only when its test run is green. There is no grace period, because a tree whose
own gates are red cannot be the authority for anything else's.

## The pre-commit checklist

Run through all of it. Each line is a thing that has silently broken before.

1. **Citations validator** — every rule identifier cited anywhere resolves to a published rule.
2. **Templates validator** — every authored document matches its kind's contract, mirror included.
3. **Operator self-tests** — each operator's validator accepts its lawful branches and rejects its
   mutations.
4. **Docs check** — the generated reference matches the tree.
5. **Places per concept** — for every concept this change touched, count the files that state it. The
   count must not have gone up. If it did, one of them is a citation you have not written yet.
6. **No product identity in law** — no repository name, application name, absolute path, file:line
   reference, commit sha or census count in `knowledge/**` or `operators/**`. If it is evidence, it
   belongs under `tests/evidence/`.
7. **Every new rule has a gate** — name it. If you cannot, you are at question 1, not question 2.

## Lineage of this standard

Distilled from operating one tree of this shape through several rounds of live use, where every rule
above was learned by watching a specific failure: a rule added where a gate was missing, a threshold
copied into a second file and then contradicted, a sibling rule created because an existing one was
one word too narrow, and a green test suite over work that was entirely wrong. The standard is
written to be installed alongside the tree and followed by any team that owns one.
```

## FILE: .claude/workflows/README.md

SHA-256: e1478316318bb71ae56be9df3fc3de774d2c4a7b775e9959be72ceff0a84a7d5

````markdown
# Workflows

A workflow is a pre-composed chain of operators: an ordered list of **steps**, each step a list of
**branches** that run in parallel (at most three), with optional **loops** back to an earlier step and
**presets** for a branch's Requirements. The files here are references, not the only chains there are:
they are the shapes that came up often enough to be worth writing down, and a mission whose business
is harder than any of them composes its own chain under the same rules rather than forcing itself
into the nearest example.

How the entry uses them:

1. Read the `when` of every example. If the request matches one fully, run that chain; its presets
   fill `request.json`; obtain missing fields under [the interaction policy](../resources/interaction.md).
2. If the match is partial, or the business is harder than any `when` describes, compose a chain
   rather than bending a near-miss example into shape: brainstorm it from the operators' `## Next`
   tables and `routing.json`, under the same rules `scripts/validate-workflows.mjs` enforces on these
   files:
   - every branch names a real operator and presets only fields that operator declares;
   - every Requirements field with no Default is either preset or listed under the branch's `asks`, so a
     chain says up front which fields the entry must obtain before that branch starts; `asks` is an
     input inventory, not permission to send a question;
   - every required Input of a branch is produced by an earlier step;
   - branches of one step share no write alias (two operators may not write the same checkout or
     root at once; `frontend.surface.audit` fans out by matrix entry because it writes nothing);
   - a loop goes back to an earlier step and carries `maxRounds`;
   - a chain that writes frontend source under `mode: apply` runs `frontend.surface.audit` and
     `uat.verify` between that write and its `git.publish` — the long-flow law below;
   - the chain ends at `git.publish`, `release.deploy`, or `user`.
3. A composed chain that would be useful again becomes a new file here, with its `when`.

## Every example is a long flow

A chain that writes a surface is not finished when the source compiles. Between the write and the
publish stand two proofs that nothing else in the tree can supply: `frontend.surface.audit`, which
renders the surface and keeps the screenshots, and `uat.verify`, which walks a real person's journey
through it. `quality.verify` sits between them and answers a different question — the build, the
lint, the types, the coverage — and green gates have never yet noticed that a page reads wrong. So
every example that applies frontend source ends the same way:

```text
frontend.source.apply → workspace.bind (role fe, runtimeNeed consume) → frontend.surface.audit → quality.verify → uat.verify → git.publish
```

The second `workspace.bind` is there because the head moved: the surface that must be served, audited
and walked is the one the write just produced, not the one that was bound before it. `uat.verify`
needs `feature`, `flow` and `approval` before it starts — the flow to walk and the authority for its
own writes, taken from the environment's declaration and asked of a person only where that
declaration marks the touched class `person` — so every chain that carries it declares them under
`asks`, and the run refuses rather than inventing an authority.

`staging-uat` is the one example that proves a delivery somewhere other than where it was written.
It writes nothing — `frontend.source.apply` runs under `mode: dry`, so the long-flow law does not
reach it — and it carries `env` on the audit and the run, which is what selects the stack's runtime
registry entry, its accounts file and its approved reference. It ends at `user`, because two receipts
in a person's hands are the outcome; reaching an environment is `release`'s job and stays there.

`backend-feature` is the one delivery chain with neither proof, and its `when` says why: it writes no
surface, `uat.verify` requires a `frontend-surface-audit` input and a bound fe route, and neither
exists there. A backend feature whose promise reaches a person through a screen belongs in
`full-feature`, which walks the journey before it publishes. `release` and `content-unit` write no
frontend source and publish no boundary, so the law does not reach them.

Every source-writing branch commits on `session/<sessionId>`; `git.publish` merges it, and refuses a
session branch whose session carries no source-application receipt and no audit screenshots
(`SESSION_MISSING`). A blocked branch re-enters as a new step; a loop counts toward the operator's own
`maxRounds`.

| Workflow | When | Steps | Parallel | Ends |
| --- | --- | --- | --- | --- |
| `library-maintenance` | existing owner package behavior and next patch, without product presentation changes | bind → library apply → quality | — | `user` |
| `dependency-maintenance` | verified package consumption through exact dependency metadata | bind → dependency update → quality | — | `user` |
| `frontend-new-surface` | a surface that does not exist yet (`new`) | bind ×2 → business → direction → resolve → apply → bind (consume) → audit → quality → uat → publish | audit by matrix | `git.publish` |
| `frontend-reconstruct` | rebuild an existing surface, business facts kept | bind ×2 → direction → resolve → apply → bind (consume) → audit → quality → uat → publish | audit by matrix | `git.publish` |
| `frontend-refine` | repair inside an approved structure | bind ×2 → direction → resolve → apply → bind (consume) → audit → quality → uat → publish | audit by matrix | `git.publish` |
| `backend-feature` | a backend contract for one feature, no surface | bind → business (model) → architecture → backend apply → quality → business (reconcile) → publish | — | `git.publish` |
| `full-feature` | backend and a new frontend surface together | bind ×2 → business → architecture → [backend apply ∥ direction] → [quality ∥ resolve] → apply → bind (consume) → audit → quality → uat → business (reconcile) → publish | two steps of two, audit by matrix | `git.publish` |
| `frontend-with-uat` | a frontend change a person asked to walk through by name | bind ×2 → direction → resolve → apply → bind (consume) → audit → quality → uat → publish | audit by matrix | `git.publish` |
| `staging-uat` | a published delivery must be walked on another stack before release | bind ×2 (consume) → direction → resolve → apply (dry) → audit (env staging) → quality → uat (env staging) | audit by matrix | `user` |
| `release` | a published head must reach production | bind → quality → release | — | `release.deploy` |
| `content-unit` | one curriculum unit end to end | content.generate (review exchange inside) | — | `user` |

File shape (`schemaVersion` 9): `id` equals the file name; `when` has `en` and `vi`; `chain` is an
array of steps, each an array of
`{ operator, requirements?, asks?: [field], fanout?: "matrix", maxParallel?: 1..3 }`;
`loops` is an array of `{ from, to, when, maxRounds }`; `ends` is `user` or an operator of the last step.
````

## FILE: .claude/workflows/backend-feature.json

SHA-256: 4453a18af2b1294cb88df9b5f270ee0717a72eb89a3772e6702d1401134f56f6

```json
{
  "schemaVersion": 9,
  "id": "backend-feature",
  "when": {
    "en": "Server behaviour, an API contract, persistence or a job changes for one business feature; the architecture is decided first and the promise is reconciled after the code lands. This chain writes no surface, so it carries no frontend.surface.audit and no uat.verify: uat.verify requires a frontend-surface-audit input and a bound fe route, and neither exists here. A feature whose promise reaches a person through a screen is not this workflow — it is full-feature, which walks the journey before it publishes.",
    "vi": "Hành vi server, contract API, persistence hay job đổi cho một feature nghiệp vụ; kiến trúc quyết trước, lời hứa được đối chiếu sau khi code đã vào. Chuỗi này không ghi bề mặt nào nên không mang frontend.surface.audit và không mang uat.verify: uat.verify cần đầu vào frontend-surface-audit và một route fe đã bind, ở đây không có cái nào. Một feature mà lời hứa chạm tới người qua màn hình thì không thuộc workflow này — nó là full-feature, nơi hành trình được đi trước khi publish."
  },
  "chain": [
    [
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "be"
        }
      }
    ],
    [
      {
        "operator": "business.decide",
        "requirements": {
          "mode": "model"
        },
        "asks": [
          "featureId",
          "targetState"
        ]
      }
    ],
    [
      {
        "operator": "architecture.decide",
        "requirements": {
          "alternatives": 1,
          "selectionPolicy": "automatic"
        },
        "asks": [
          "objective",
          "constraints"
        ]
      }
    ],
    [
      {
        "operator": "backend.source.apply",
        "asks": [
          "featureId",
          "outcome",
          "mutableFileRefs"
        ]
      }
    ],
    [
      {
        "operator": "quality.verify"
      }
    ],
    [
      {
        "operator": "business.decide",
        "requirements": {
          "mode": "reconcile"
        },
        "asks": [
          "featureId",
          "targetState"
        ]
      }
    ],
    [
      {
        "operator": "git.publish",
        "asks": [
          "boundary",
          "approval"
        ]
      }
    ]
  ],
  "ends": "git.publish"
}
```

## FILE: .claude/workflows/content-unit.json

SHA-256: ac8009472f79dc3ec4624ec3396a1775facc2ec84ffa8db248d07b19c20f7584

```json
{
  "schemaVersion": 9,
  "id": "content-unit",
  "when": {
    "en": "One curriculum unit needs its brief, its language editions, its code tracks and an independent review; publishing to MinIO stays with a person.",
    "vi": "Một đơn vị giáo trình cần brief, các ấn bản ngôn ngữ, track code và một lượt review độc lập; đưa lên MinIO vẫn là việc của người."
  },
  "chain": [
    [
      {
        "operator": "content.generate",
        "requirements": {
          "maxReviewRounds": 2
        },
        "asks": [
          "unit"
        ]
      }
    ]
  ],
  "ends": "user"
}
```

## FILE: .claude/workflows/dependency-maintenance.json

SHA-256: b503b4083eaf2183689ffe9693155645b53ae749a79ed79e7d7e86599e277ef8

```json
{
  "schemaVersion": 9,
  "id": "dependency-maintenance",
  "when": {
    "en": "One verified package release must be consumed through exact frontend dependency metadata, without source or presentation changes. Package consumption and quality evidence precede the separately bound runtime surface audit and UAT; this chain alone never claims a user-facing delivery.",
    "vi": "Một bản phát hành package đã kiểm cần được tiêu thụ qua metadata dependency frontend chính xác, không đổi source hay presentation. Bằng chứng tiêu thụ package và chất lượng đi trước audit runtime và UAT đã bind riêng; riêng chuỗi này không xác nhận bàn giao luồng người dùng."
  },
  "chain": [
    [
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "fe",
          "runtimeNeed": "none"
        }
      }
    ],
    [
      {
        "operator": "dependency.update",
        "asks": [
          "plan"
        ]
      }
    ],
    [
      {
        "operator": "quality.verify"
      }
    ]
  ],
  "ends": "user"
}
```

## FILE: .claude/workflows/frontend-new-surface.json

SHA-256: e509b6a1a64c3623c6b0328c06d105288729e6d748c5e7909a4cade451b4a3a4

```json
{
  "schemaVersion": 9,
  "id": "frontend-new-surface",
  "when": {
    "en": "A page, flow, or surface that does not exist yet must be created; the person named the target route and its business promise is known or will be decided first.",
    "vi": "Một trang, luồng hay bề mặt chưa tồn tại cần được tạo; người dùng nêu route đích, lời hứa nghiệp vụ đã có hoặc sẽ được quyết trước."
  },
  "chain": [
    [
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "be"
        }
      },
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "fe"
        }
      }
    ],
    [
      {
        "operator": "business.decide",
        "requirements": {
          "mode": "model"
        },
        "asks": [
          "featureId",
          "targetState"
        ]
      }
    ],
    [
      {
        "operator": "frontend.direction.decide",
        "requirements": {
          "intent": "create",
          "changeLevel": "new"
        },
        "asks": [
          "target"
        ]
      }
    ],
    [
      {
        "operator": "frontend.presentation.resolve"
      }
    ],
    [
      {
        "operator": "frontend.source.apply",
        "requirements": {
          "mode": "apply"
        }
      }
    ],
    [
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "fe",
          "runtimeNeed": "consume"
        }
      }
    ],
    [
      {
        "operator": "frontend.surface.audit",
        "fanout": "matrix",
        "maxParallel": 3,
        "asks": [
          "auditScope"
        ]
      }
    ],
    [
      {
        "operator": "quality.verify"
      }
    ],
    [
      {
        "operator": "uat.verify",
        "asks": [
          "approval",
          "feature",
          "flow"
        ]
      }
    ],
    [
      {
        "operator": "git.publish",
        "asks": [
          "boundary",
          "approval"
        ]
      }
    ]
  ],
  "ends": "git.publish",
  "loops": [
    {
      "from": "frontend.surface.audit",
      "to": "frontend.presentation.resolve",
      "when": "an application-owned node fails a claim or a proof rule",
      "maxRounds": 2
    },
    {
      "from": "frontend.surface.audit",
      "to": "frontend.direction.decide",
      "when": "the taste lens is fix-first, so the composition is decided again rather than revalued",
      "maxRounds": 2
    }
  ]
}
```

## FILE: .claude/workflows/frontend-reconstruct.json

SHA-256: ef990a93422b39bb03b0569642339d1185150ecd49cdf1583e57578e01d6332c

```json
{
  "schemaVersion": 9,
  "id": "frontend-reconstruct",
  "when": {
    "en": "An existing surface is rebuilt: composition, region order, hierarchy or responsive structure change while business facts, behaviour and API semantics stay.",
    "vi": "Dựng lại một bề mặt đã có: đổi composition, thứ tự vùng, hierarchy hay cấu trúc responsive trong khi fact nghiệp vụ, hành vi và API giữ nguyên."
  },
  "chain": [
    [
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "be"
        }
      },
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "fe"
        }
      }
    ],
    [
      {
        "operator": "frontend.direction.decide",
        "requirements": {
          "intent": "modify",
          "changeLevel": "reconstruct"
        },
        "asks": [
          "target"
        ]
      }
    ],
    [
      {
        "operator": "frontend.presentation.resolve"
      }
    ],
    [
      {
        "operator": "frontend.source.apply",
        "requirements": {
          "mode": "apply"
        }
      }
    ],
    [
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "fe",
          "runtimeNeed": "consume"
        }
      }
    ],
    [
      {
        "operator": "frontend.surface.audit",
        "fanout": "matrix",
        "maxParallel": 3,
        "asks": [
          "auditScope"
        ]
      }
    ],
    [
      {
        "operator": "quality.verify"
      }
    ],
    [
      {
        "operator": "uat.verify",
        "asks": [
          "approval",
          "feature",
          "flow"
        ]
      }
    ],
    [
      {
        "operator": "git.publish",
        "asks": [
          "boundary",
          "approval"
        ]
      }
    ]
  ],
  "ends": "git.publish",
  "loops": [
    {
      "from": "frontend.surface.audit",
      "to": "frontend.presentation.resolve",
      "when": "an application-owned node fails a claim or a proof rule",
      "maxRounds": 2
    },
    {
      "from": "frontend.surface.audit",
      "to": "frontend.direction.decide",
      "when": "the taste lens is fix-first, so the composition is decided again rather than revalued",
      "maxRounds": 2
    }
  ]
}
```

## FILE: .claude/workflows/frontend-refine.json

SHA-256: 48172a024f51556ab53efa6d48d473f0e40e59cce4c0e399a4174ae19bb51481

```json
{
  "schemaVersion": 9,
  "id": "frontend-refine",
  "when": {
    "en": "The approved structure of a surface stays; only typography, spacing, labels, controls, states, tokens or Grammar conformance inside it are repaired.",
    "vi": "Cấu trúc đã duyệt của bề mặt giữ nguyên; chỉ sửa typography, spacing, label, control, state, token hay conformance Grammar bên trong."
  },
  "chain": [
    [
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "be"
        }
      },
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "fe"
        }
      }
    ],
    [
      {
        "operator": "frontend.direction.decide",
        "requirements": {
          "intent": "audit-repair",
          "changeLevel": "refine"
        },
        "asks": [
          "target"
        ]
      }
    ],
    [
      {
        "operator": "frontend.presentation.resolve"
      }
    ],
    [
      {
        "operator": "frontend.source.apply",
        "requirements": {
          "mode": "apply"
        }
      }
    ],
    [
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "fe",
          "runtimeNeed": "consume"
        }
      }
    ],
    [
      {
        "operator": "frontend.surface.audit",
        "fanout": "matrix",
        "maxParallel": 3,
        "asks": [
          "auditScope"
        ]
      }
    ],
    [
      {
        "operator": "quality.verify"
      }
    ],
    [
      {
        "operator": "uat.verify",
        "asks": [
          "approval",
          "feature",
          "flow"
        ]
      }
    ],
    [
      {
        "operator": "git.publish",
        "asks": [
          "boundary",
          "approval"
        ]
      }
    ]
  ],
  "ends": "git.publish",
  "loops": [
    {
      "from": "frontend.surface.audit",
      "to": "frontend.presentation.resolve",
      "when": "an application-owned node fails a claim or a proof rule",
      "maxRounds": 2
    },
    {
      "from": "frontend.surface.audit",
      "to": "frontend.direction.decide",
      "when": "the taste lens is fix-first, so the composition is decided again rather than revalued",
      "maxRounds": 2
    }
  ]
}
```

## FILE: .claude/workflows/frontend-with-uat.json

SHA-256: 9be096d4bf50a86a1f844c17f5b106f13a421eb592392e16936e7674a6c74f6c

```json
{
  "schemaVersion": 9,
  "id": "frontend-with-uat",
  "when": {
    "en": "A frontend change must also be walked by a real person's journey before it is published; a person asked for the UAT run by name.",
    "vi": "Một thay đổi frontend còn phải đi qua hành trình của người thật trước khi publish; có người yêu cầu đích danh lần chạy UAT."
  },
  "chain": [
    [
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "be"
        }
      },
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "fe"
        }
      }
    ],
    [
      {
        "operator": "frontend.direction.decide",
        "requirements": {
          "intent": "modify",
          "changeLevel": "reconstruct"
        },
        "asks": [
          "target"
        ]
      }
    ],
    [
      {
        "operator": "frontend.presentation.resolve"
      }
    ],
    [
      {
        "operator": "frontend.source.apply",
        "requirements": {
          "mode": "apply"
        }
      }
    ],
    [
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "fe",
          "runtimeNeed": "consume"
        }
      }
    ],
    [
      {
        "operator": "frontend.surface.audit",
        "fanout": "matrix",
        "maxParallel": 3,
        "asks": [
          "auditScope"
        ]
      }
    ],
    [
      {
        "operator": "quality.verify"
      }
    ],
    [
      {
        "operator": "uat.verify",
        "asks": [
          "approval",
          "feature",
          "flow"
        ]
      }
    ],
    [
      {
        "operator": "git.publish",
        "asks": [
          "boundary",
          "approval"
        ]
      }
    ]
  ],
  "ends": "git.publish",
  "loops": [
    {
      "from": "frontend.surface.audit",
      "to": "frontend.presentation.resolve",
      "when": "an application-owned node fails a claim or a proof rule",
      "maxRounds": 2
    },
    {
      "from": "frontend.surface.audit",
      "to": "frontend.direction.decide",
      "when": "the taste lens is fix-first, so the composition is decided again rather than revalued",
      "maxRounds": 2
    }
  ]
}
```

## FILE: .claude/workflows/full-feature.json

SHA-256: 623718ce9b3fb52f5823380ff8e902b4d37c4cf8a0cb7b2212554563e7f37091

```json
{
  "schemaVersion": 9,
  "id": "full-feature",
  "when": {
    "en": "One feature needs both a backend contract and a new frontend surface; backend implementation and frontend direction run side by side after the architecture is decided.",
    "vi": "Một feature cần cả contract backend lẫn bề mặt frontend mới; hiện thực backend và hướng frontend chạy song song sau khi kiến trúc đã quyết."
  },
  "chain": [
    [
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "be"
        }
      },
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "fe"
        }
      }
    ],
    [
      {
        "operator": "business.decide",
        "requirements": {
          "mode": "model"
        },
        "asks": [
          "featureId",
          "targetState"
        ]
      }
    ],
    [
      {
        "operator": "architecture.decide",
        "requirements": {
          "alternatives": 1,
          "selectionPolicy": "automatic"
        },
        "asks": [
          "objective",
          "constraints"
        ]
      }
    ],
    [
      {
        "operator": "backend.source.apply",
        "asks": [
          "featureId",
          "outcome",
          "mutableFileRefs"
        ]
      },
      {
        "operator": "frontend.direction.decide",
        "requirements": {
          "intent": "create",
          "changeLevel": "new"
        },
        "asks": [
          "target"
        ]
      }
    ],
    [
      {
        "operator": "quality.verify"
      },
      {
        "operator": "frontend.presentation.resolve"
      }
    ],
    [
      {
        "operator": "frontend.source.apply",
        "requirements": {
          "mode": "apply"
        }
      }
    ],
    [
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "fe",
          "runtimeNeed": "consume"
        }
      }
    ],
    [
      {
        "operator": "frontend.surface.audit",
        "fanout": "matrix",
        "maxParallel": 3,
        "asks": [
          "auditScope"
        ]
      }
    ],
    [
      {
        "operator": "quality.verify"
      }
    ],
    [
      {
        "operator": "uat.verify",
        "asks": [
          "approval",
          "feature",
          "flow"
        ]
      }
    ],
    [
      {
        "operator": "business.decide",
        "requirements": {
          "mode": "reconcile"
        },
        "asks": [
          "featureId",
          "targetState"
        ]
      }
    ],
    [
      {
        "operator": "git.publish",
        "asks": [
          "boundary",
          "approval"
        ]
      }
    ]
  ],
  "ends": "git.publish",
  "loops": [
    {
      "from": "frontend.surface.audit",
      "to": "frontend.presentation.resolve",
      "when": "an application-owned node fails a claim or a proof rule",
      "maxRounds": 2
    },
    {
      "from": "frontend.surface.audit",
      "to": "frontend.direction.decide",
      "when": "the taste lens is fix-first, so the composition is decided again rather than revalued",
      "maxRounds": 2
    }
  ]
}
```

## FILE: .claude/workflows/library-maintenance.json

SHA-256: 1a68e82c04c20f7ad974b49d9665bd382f469a301f2e810b9b7a89eadaab8a69

```json
{
  "schemaVersion": 9,
  "id": "library-maintenance",
  "when": {
    "en": "An explicitly authorized existing owner package needs a behavior repair and next patch version. Bind its owner checkout, reproduce the regression, repair through library.source.apply and verify the package. Product presentation changes still follow the frontend workflows. Consumer integration, surface audit and UAT follow after the verified package is made available under its separately bound publication authority; a package proof is never a consumer delivery claim.",
    "vi": "Package hiện có của owner đã được giao sửa hành vi và tăng patch kế tiếp. Bind checkout owner, tái hiện regression, sửa qua library.source.apply rồi kiểm package. Thay đổi presentation sản phẩm vẫn theo workflow frontend. Tích hợp consumer, audit bề mặt và UAT theo sau khi package đã kiểm được cung cấp dưới thẩm quyền phát hành đã bind riêng; bằng chứng package không phải xác nhận bàn giao consumer."
  },
  "chain": [
    [
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "fe",
          "runtimeNeed": "none"
        }
      }
    ],
    [
      {
        "operator": "library.source.apply",
        "asks": [
          "plan"
        ]
      }
    ],
    [
      {
        "operator": "quality.verify"
      }
    ]
  ],
  "ends": "user"
}
```

## FILE: .claude/workflows/release.json

SHA-256: ed0d04b6a2bd0e0cc856ad839a9db5aead6c78d335f8b3aa6f56fffc506069de

```json
{
  "schemaVersion": 9,
  "id": "release",
  "when": {
    "en": "A published head must reach production: verify it, deploy it, and prove the steady state; recovery and rollback are inside release.deploy.",
    "vi": "Một head đã publish phải lên production: kiểm, deploy và chứng minh trạng thái ổn định; phục hồi và rollback nằm trong release.deploy."
  },
  "chain": [
    [
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "be"
        }
      }
    ],
    [
      {
        "operator": "quality.verify"
      }
    ],
    [
      {
        "operator": "release.deploy",
        "asks": [
          "release",
          "target",
          "approval",
          "rollbackIdentity"
        ]
      }
    ]
  ],
  "ends": "release.deploy"
}
```

## FILE: .claude/workflows/staging-uat.json

SHA-256: eb9b254c89a95d1c807fb3ee30a21853804cff85968ceb379364c4a0b5521218

```json
{
  "schemaVersion": 9,
  "id": "staging-uat",
  "when": {
    "en": "A delivery that is already published must be verified on another stack before it is released: the same head is observed and walked there, and the chain ends with the two receipts in a person's hands rather than with a deployment.",
    "vi": "Một bản giao đã publish phải được kiểm trên một stack khác trước khi release: cùng một head được quan sát và đi qua ở đó, và chuỗi kết thúc bằng hai biên nhận trong tay một con người chứ không bằng một lần deploy."
  },
  "chain": [
    [
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "be"
        }
      },
      {
        "operator": "workspace.bind",
        "requirements": {
          "role": "fe",
          "runtimeNeed": "consume"
        }
      }
    ],
    [
      {
        "operator": "frontend.direction.decide",
        "requirements": {
          "intent": "modify",
          "changeLevel": "refine"
        },
        "asks": [
          "target"
        ]
      }
    ],
    [
      {
        "operator": "frontend.presentation.resolve"
      }
    ],
    [
      {
        "operator": "frontend.source.apply",
        "requirements": {
          "mode": "dry"
        }
      }
    ],
    [
      {
        "operator": "frontend.surface.audit",
        "requirements": {
          "env": "staging"
        },
        "fanout": "matrix",
        "maxParallel": 3,
        "asks": [
          "auditScope"
        ]
      }
    ],
    [
      {
        "operator": "quality.verify"
      }
    ],
    [
      {
        "operator": "uat.verify",
        "requirements": {
          "env": "staging"
        },
        "asks": [
          "approval",
          "feature",
          "flow"
        ]
      }
    ]
  ],
  "ends": "user",
  "loops": []
}
```

## FILE: .claude/routing.json

SHA-256: 84cbae8ed67b9cd8cd2665118665a4b2e4da37b5e22f75f7d4ae36bee5c0bc3d

```json
{
  "schemaVersion": 9,
  "note": "Closed routing map. A skill reads a validated operator output and routes on outcome, then on failure.owningDomain. It never reads prose to decide the next step.",
  "kinds": {
    "operator": "Invoke the named operator next.",
    "resume": "Invoke the same operator again with the required delta from its resume token.",
    "user": "Stop. A person owns this and must decide or publish before the mission continues.",
    "external": "Stop. The blocker is outside the runtime and no operator can clear it."
  },
  "routes": {
    "architecture.decide": {
      "architecture": {
        "kind": "resume"
      },
      "business": {
        "kind": "operator",
        "target": "business.decide"
      },
      "workspace": {
        "kind": "operator",
        "target": "workspace.bind"
      },
      "caller": {
        "kind": "user"
      }
    },
    "backend.source.apply": {
      "backend": {
        "kind": "resume"
      },
      "business": {
        "kind": "operator",
        "target": "business.decide"
      },
      "contract": {
        "kind": "user"
      },
      "platform": {
        "kind": "operator",
        "target": "platform.operate"
      },
      "workspace": {
        "kind": "operator",
        "target": "workspace.bind"
      },
      "caller": {
        "kind": "user"
      }
    },
    "business.decide": {
      "business": {
        "kind": "resume"
      },
      "backend": {
        "kind": "operator",
        "target": "backend.source.apply"
      },
      "workspace": {
        "kind": "operator",
        "target": "workspace.bind"
      },
      "caller": {
        "kind": "user"
      }
    },
    "content.generate": {
      "content": {
        "kind": "resume"
      },
      "curriculum": {
        "kind": "user"
      },
      "engineering": {
        "kind": "user"
      },
      "workspace": {
        "kind": "operator",
        "target": "workspace.bind"
      },
      "caller": {
        "kind": "user"
      }
    },
    "frontend.direction.decide": {
      "business": {
        "kind": "operator",
        "target": "business.decide"
      },
      "backend": {
        "kind": "operator",
        "target": "backend.source.apply"
      },
      "architecture": {
        "kind": "operator",
        "target": "architecture.decide"
      },
      "grammar": {
        "kind": "user"
      },
      "workspace": {
        "kind": "operator",
        "target": "workspace.bind"
      },
      "caller": {
        "kind": "user"
      },
      "frontend": {
        "kind": "resume"
      }
    },
    "frontend.presentation.resolve": {
      "grammar": {
        "kind": "user"
      },
      "knowledge": {
        "kind": "user"
      },
      "workspace": {
        "kind": "operator",
        "target": "workspace.bind"
      },
      "caller": {
        "kind": "user"
      },
      "frontend": {
        "kind": "resume"
      }
    },
    "frontend.source.apply": {
      "resolution": {
        "kind": "operator",
        "target": "frontend.presentation.resolve"
      },
      "workspace": {
        "kind": "operator",
        "target": "workspace.bind"
      },
      "caller": {
        "kind": "user"
      }
    },
    "frontend.surface.audit": {
      "workspace": {
        "kind": "operator",
        "target": "workspace.bind"
      },
      "caller": {
        "kind": "user"
      },
      "platform": {
        "kind": "operator",
        "target": "platform.operate"
      },
      "frontend": {
        "kind": "resume"
      },
      "direction": {
        "kind": "operator",
        "target": "frontend.direction.decide"
      }
    },
    "git.publish": {
      "workspace": {
        "kind": "operator",
        "target": "workspace.bind"
      },
      "source": {
        "kind": "operator",
        "target": "workspace.bind"
      },
      "remote": {
        "kind": "external"
      },
      "caller": {
        "kind": "user"
      }
    },
    "platform.operate": {
      "platform": {
        "kind": "resume"
      },
      "provider": {
        "kind": "external"
      },
      "product": {
        "kind": "user"
      },
      "workspace": {
        "kind": "operator",
        "target": "workspace.bind"
      },
      "caller": {
        "kind": "user"
      },
      "control-panel": {
        "kind": "external"
      }
    },
    "quality.verify": {
      "platform": {
        "kind": "operator",
        "target": "platform.operate"
      },
      "workspace": {
        "kind": "operator",
        "target": "workspace.bind"
      },
      "caller": {
        "kind": "user"
      }
    },
    "release.deploy": {
      "deployment": {
        "kind": "resume"
      },
      "platform": {
        "kind": "operator",
        "target": "platform.operate"
      },
      "provider": {
        "kind": "external"
      },
      "backend": {
        "kind": "operator",
        "target": "backend.source.apply"
      },
      "approval": {
        "kind": "user"
      },
      "caller": {
        "kind": "user"
      }
    },
    "uat.verify": {
      "control-panel": {
        "kind": "external"
      },
      "runtime": {
        "kind": "external"
      },
      "backend": {
        "kind": "operator",
        "target": "backend.source.apply"
      },
      "quality": {
        "kind": "operator",
        "target": "quality.verify"
      },
      "caller": {
        "kind": "user"
      },
      "platform": {
        "kind": "operator",
        "target": "platform.operate"
      },
      "workspace": {
        "kind": "operator",
        "target": "workspace.bind"
      }
    },
    "workspace.bind": {
      "workspace": {
        "kind": "resume"
      },
      "source": {
        "kind": "resume"
      },
      "runtime": {
        "kind": "operator",
        "target": "platform.operate"
      },
      "identity": {
        "kind": "external"
      },
      "caller": {
        "kind": "user"
      }
    },
    "library.source.apply": {
      "caller": {
        "kind": "user"
      },
      "workspace": {
        "kind": "operator",
        "target": "workspace.bind"
      },
      "library": {
        "kind": "resume"
      }
    },
    "dependency.update": {
      "caller": {
        "kind": "user"
      },
      "workspace": {
        "kind": "operator",
        "target": "workspace.bind"
      },
      "dependency": {
        "kind": "resume"
      }
    }
  }
}
```

## FILE: .claude/resources/INDEX.md

SHA-256: b5929870b2afc6b815d60b97c6aac7f9fd707ca63b87b61efb814036b6004d3a

```markdown
# Resources

Questions and recorded choices follow [interaction](interaction.md).
Identity provisioning follows [provider-bound custody](identity.md).

Who runs each operator, with what, and under which standing policies. Two closed places carry it:

- `agents/profiles/<runtime>.json` — one file per runtime (`openai.json`, `claude.json`); the file owns
  its provider, a profile carries model, isolation, what the model can do here
  (`capabilities`), and what an operator on that profile is allowed to use (`permits`).
- `operators/<id>/operator.json` → `resources` — inside each operator: the one profile that runs it
  end to end, which grants it actually requires, and its answers to the three standing questions.
  Each operator's `operator.md` names the same aliases in its Context table. There is no central assignment file.

`scripts/validate-resources.mjs` runs inside `npm test`. It rejects an operator whose `operator.json` declares no
`resources`, an operator bound to an unknown profile, a required grant no assigned profile permits, a profile that permits
what its model cannot do, a policy answer that
contradicts the grants, a model an operator's own schema pins that is not its profile's model, and a row of the
process matrix below that disagrees with the operator it summarises. The registry, the operators,
and this summary therefore cannot drift apart silently.

## Binding rule

An operator binds exactly one profile and runs on it end to end, never per invocation and never
split across profiles: a critique, review, or judgement inside an operator is a step of that one
execution, and a second model for it would be a workflow. The profile decides the model and the
isolation; the operator's `operator.md` Steps decide the work; `resources.requires` decides which grants that
work may touch. A grant absent from `requires` is unavailable to the operator even if the profile
would permit it. Capability is a fact about the model; permission is a policy about the
operator: `gpt-5.6-sol` can search, draw, drive a browser, and write source, so `sol-fresh` may use all
four, while `sol-reviewer` on the same model is permitted only the browser, because a reviewer that
produces is no longer a reviewer. Material brainstorms and reviews are always one fresh execution with no inherited
turns, and a reviewer receives artifacts and claims, never the producer's rationale.

## The three standing questions

**Does it search the web when the tree holds no reference?** Only where `policy.webSearch` is
`bounded`: the decision operators and the content brief. Research is bounded by the exact gap it must
close, records what it used, and never copies a page, brand, palette, or component anatomy. A
presentation value the knowledge does not publish is `RULE_MISSING`, never a research task.

**Is it bound to published Grammar?** Where `policy.grammarBound` is true: the four frontend
operators. Direction binds Grammar compositions; presentation resolves only against Grammar's owned
relationships; apply writes only resolved classes; audit judges against the same law. A missing
reusable capability is `GRAMMAR_REQUIRED` or `COMMON_CAPABILITY_MISSING`, never a local imitation.

**Does it generate images?** `required` only in content generation, where an image is made to a
stated claim and inspected for fidelity to it. `authority-only` in frontend direction: the direction
itself renders an inspectable page, and product artwork is generated only when product authority
names it. Everywhere else, `never`.

## Process matrix

A summary of what each `operator.json` declares; the validator rejects a row that disagrees.

| Operator | Profile | Grammar | Tools | Why |
| --- | --- | --- | --- | --- |
| `workspace.bind` | luna | no | `fileread:context-aliases`, `git:read`, `shell:declared-commands`, `http:probe`, `secrets:resolve-by-name` | Reads canonical files and a registry; no judgement |
| `business.decide` | sol-fresh | no | `fileread:context-aliases`, `sourcewrite:declared-write-set`, `git:read`, `websearch:bounded` | An unfamiliar business model may need reference research before coverage can be frozen |
| `architecture.decide` | sol-fresh | no | `fileread:context-aliases`, `git:read`, `websearch:bounded`, `visualize:html` | Alternatives and compatibility need evidence beyond the repo; schema pins the model |
| `backend.source.apply` | luna | no | `fileread:context-aliases`, `sourcewrite:declared-write-set`, `git:commit-session-branch`, `shell:declared-commands` | Writes inside a frozen contract following patterns/be |
| `library.source.apply` | luna | no | `fileread:context-aliases`, `sourcewrite:declared-write-set`, `git:commit-session-branch`, `shell:declared-commands` | Repairs a bound owner package with before/after regression evidence and complete package gates |
| `dependency.update` | luna | no | `fileread:context-aliases`, `sourcewrite:declared-write-set`, `git:commit-session-branch`, `shell:declared-commands` | Consumes one verified package release within exact dependency metadata and unchanged consumer regression gates |
| `frontend.direction.decide` | sol-fresh | yes | `fileread:context-aliases`, `git:read`, `websearch:bounded`, `imagegen:judged`, `visualize:html`, `host:loopback`, `print:decision-points` | Research only for an unfamiliar domain; renders candidates as pages and judges for itself when a region is too empty to stand without an image |
| `frontend.presentation.resolve` | luna | yes | `fileread:context-aliases`, `git:read`, `registry:read` | A lookup against a closed inventory |
| `frontend.source.apply` | luna | yes | `fileread:context-aliases`, `sourcewrite:declared-write-set`, `shell:declared-commands`, `git:commit-session-branch`, `imagegen:judged` | Writes only what the resolution already contains, following patterns/fe |
| `frontend.surface.audit` | sol-reviewer | yes | `fileread:context-aliases`, `git:read`, `websearch:bounded`, `visualize:html`, `browsercontrol:required`, `http:probe`, `host:loopback`, `secrets:resolve-by-name`, `print:decision-points` | Browser only, no source write: the auditor cannot repair what it measures, and it signs in by credential name to reach a guarded route |
| `quality.verify` | luna | no | `fileread:context-aliases`, `git:read`, `shell:declared-commands`, `http:probe` | Runs gates, repairs nothing |
| `uat.verify` | sol-fresh | no | `fileread:context-aliases`, `sourcewrite:declared-write-set`, `git:read`, `websearch:bounded`, `visualize:html`, `browsercontrol:required`, `http:probe`, `secrets:resolve-by-name`, `database:namespaced-write`, `print:decision-points` | Drives the real journey in a browser and may write nothing; fresh verdict per lane |
| `release.deploy` | luna | no | `fileread:context-aliases`, `git:read`, `shell:declared-commands`, `http:probe`, `container:operate`, `ci:read`, `secrets:resolve-by-name` | Immutable release under declared authorization |
| `platform.operate` | luna | no | `fileread:context-aliases`, `git:merge-into-integration-branch`, `shell:declared-commands`, `http:probe`, `container:operate`, `secrets:resolve-by-name`, `sourcewrite:declared-write-set`, `browsercontrol:required`, `database:namespaced-write` | Shared services from exact evidence, and the identity and runtime entry a bound route needs: it creates the account and seeds rather than reporting one missing |
| `content.generate` | luna | no | `fileread:context-aliases`, `shell:declared-commands`, `websearch:bounded`, `imagegen:required`, `objectstorage:read` | Researches the brief within bounds, then writes, codes, and draws to a claim; the schema pins this model |
| `git.publish` | luna | no | `fileread:context-aliases`, `git:merge-and-push`, `shell:declared-commands`, `ci:read` | Non-force publication; destructive operations are unrepresentable |

## Profiles

### Runtime `openai` (provider `openai`)

| Profile | Model | Capabilities | Permits | Used for |
| --- | --- | --- | --- | --- |
| `sol-fresh` | `gpt-5.6-sol` | web, images, browser, source | web, images, browser, source | Decisions and direction, end to end |
| `sol-reviewer` | `gpt-5.6-sol` | web, images, browser, source | browser | Audits and UAT; observes, never writes |
| `luna` | `gpt-5.6-luna` | web, images, source | web, images, source | Authored content, end to end |

### Runtime `claude` (provider `anthropic`)

| Profile | Model | Capabilities | Permits | Used for |
| --- | --- | --- | --- | --- |
| `opus` | `claude-opus-5` | web, browser, source | browser, source | Heavy authoring and high-stakes mutation |
| `sonnet` | `claude-sonnet-5` | web, browser, source | source | Deterministic and mechanical work |
| `fable` | `claude-fable-5-1` | web, browser, source | source | Source-grounded extraction and audits |

`fable` is registered for the audit and extraction work that produced `patterns/`; no operator binds
it today.

## What may change here

A profile's model or grants, an operator's profile, and any policy answer are owner decisions.
Changing one is an edit in the profile file or the operator's `operator.json`, the matching line in
its `operator.md`, and a green `npm test`. Adding a grant kind means adding
it to every profile explicitly, because the validator refuses a profile that leaves a grant unstated.
```

## FILE: .claude/resources/interaction.md

SHA-256: 27c4d7ccc5434b2554d8d1ed440ac47272a0f3b1986c0fbe5cdd4c58d84d450f

```markdown
# Interaction

[interaction.json](interaction.json) owns the communication policy. The entry reads it before
dispatch. Operator Ask columns, workflow `asks`, missing defaults and route names identify inputs
or owners; they do not independently authorize a question or an action.

A proposed question is typed as `response.json.interaction`: `kind`, a stable `decisionId`, and
options with distinct `id`, `label` and `tradeoff`. Visual alternatives retain the existing rendered
evidence. The response gate checks this record before the question is sent. Legacy `reason` prose
is diagnostic evidence, not a question to forward automatically.

Record an actual answer in `state.json.choices[decisionId]` with `selected`, `selectedBy` and
`sourceRef` pointing to the user's message. A continuation request carries `decisionId` and
`selectedOption`; its gate checks them against that record. Recommendations are not user choices.
Do not create a new decision id merely to ask the same question again. A mission without a material
choice needs no choice record.

The standalone `scripts/validate-interaction.mjs <branch>` gate and the generic response gate check
proposed questions. These gates validate communication only; passing them authorizes no operation.

Sources: [Interaction evidence](../tests/evidence/20260904-interaction.md).
```

## FILE: .claude/resources/interaction.json

SHA-256: c2dcc4f01f253c9135f9d073c053995385c913261dc2ee8d358faf7cdf9e9799

```json
{
  "schemaVersion": 1,
  "questionKinds": ["tier-choice"],
  "minOptions": 2,
  "maxOptions": 3,
  "selectionSource": "user",
  "rule": "Within work already authorized by the user, do not request routine confirmation. Ask only when the user must choose between materially different tiers or directions, such as UX/UI alternatives. Tier does not mean execution model profile. Present the alternatives and their tradeoffs, let the user select, and reuse the selection on continuation without asking again. Obtain ordinary missing inputs from existing context and evidence. This is a communication policy only: it grants no source write, package publication, deployment, credential access or other external action, and overrides no mandatory host approval, access control, operator boundary or quality gate. When work cannot proceed within existing authority, report the exact limitation and continue independent authorized work; never invent approval or claim completion.",
  "gate": "scripts/validate-interaction.mjs"
}
```

## FILE: .claude/resources/orchestrator.json

SHA-256: f40631bcb4b463d19e9b1eeff4166d7a541ba8cb84552fb9d7c3deb9606f68fc

```json
{
  "schemaVersion": 8,
  "note": "How operators become agents. One invocation of one operator is one agent, created fresh on the operator's own profile (operator.json → resources) with the aliases its Context table declares and nothing else. The orchestrator owns dispatch: it writes the branch's request/request.json, validates it (scripts/validate-request.mjs), starts the agent, validates the response (scripts/validate-response.mjs, then the operator's validate.mjs), and follows routing.json to the next operator, user, or external party. It never merges two operators into one agent and never lets an agent start another; a nested exchange (a step that pauses with status waiting, e.g. architecture.decide's critique) is served by a second fresh agent the orchestrator spawns, with its own request/ and response/ inside the branch.",
  "agentPerOperator": true,
  "maxConcurrentAgents": 3,
  "dispatch": "routing.json",
  "interactionPolicy": "resources/interaction.json",
  "agent": {
    "profile": "operator.json → resources.profile",
    "grants": "operator.json → resources.tools: each @tools/<id> with one mode from resources/tools.json, and nothing the profile would otherwise permit. A tool whose only use the operator's mode forbids is not granted for that run: backend.source.apply and frontend.source.apply under mode dry receive neither @tools/sourcewrite nor @tools/git",
    "refs": "operator.md → Context table, resolved through alias/alias.json; an unlisted location is unreadable",
    "requirements": "operator.md → Requirements table; fill defaults into request.json and obtain required values from the mission, existing decisions and declared inputs. Fields under agent.fills (project, runId and lease) come from the session. A missing default does not itself authorize a question: apply interactionPolicy. Unavailable required authorization still blocks under the existing operator gate; this communication rule supplies no grant.",
    "prompt": "rendered at dispatch from operator.md plus request.json; never stored",
    "isolation": "fresh, no inherited turns",
    "writes": "only response/ of its own branch (step-N/parallel-M/response/); a nested-exchange agent writes only <exchange>/response/ of that branch; a source-writing operator also writes the session branch of its checkout under an exclusive lease (see sourceWrites)",
    "profileRecord": "the orchestrator fills response.json boundProfile (operator.json → resources.profile) and ranProfile at dispatch whenever the two differ; validate-response refuses one without the other or a boundProfile that is not the operator's",
    "fills": [
      "project",
      "runId",
      "lease"
    ]
  },
  "concurrency": {
    "rule": "at most maxConcurrentAgents agents at once; branches of one step run concurrently only when their Writes touch no common alias",
    "sharedCheckout": "two agents may read one checkout; only one may hold it for writing (backend.source.apply, frontend.source.apply, git.publish are exclusive per checkout)",
    "sharedRoot": "business.decide is exclusive per businesses root; platform.operate is exclusive per runtime owner"
  },
  "handoff": {
    "carrier": "response.json fields: kind → path relative to the branch; the next branch's request.json inputs point at step-N/parallel-M/<path> from the session root, written explicitly by the orchestrator (nearest earlier producer guides the orchestrator, never the agent)",
    "stop": "response.json status blocked with stop = code; errors/ says whether the code terminates or falls back, and routing.json says where a terminated step hands to. A code the merged registry does not list is read by the orchestrator as UNKNOWN_STOP and routed on domain caller; the branch keeps the code the agent wrote as evidence and the orchestrator records the substitution in state.json.substitutions",
    "waiting": "response.json status waiting with awaiting { exchange, kind }: the orchestrator validates the fields written so far, creates <exchange>/request/request.json in the same branch, runs a fresh agent for it, and resumes the paused agent when <exchange>/response/response.json is done; other branches of the step keep running",
    "resume": "a blocked branch re-enters the same operator as a new agent in step-(N+1)/parallel-1, with request.json.resume naming the blocked step and parallel; the blocked branch stays on disk as evidence"
  },
  "session": {
    "root": "<Source>/.worktrees/sessions/<sessionId>/",
    "id": "<yyyymmdd-HHMMss>-<project>-<first operator>, e.g. 20260903-142200-project-frontend.direction.decide",
    "manifest": "state.json, validated against templates/step/state.schema.json by validate-request: id, project, workflow, startedAt, status (running | blocked | done | stopped), chain [[\"1/1\"], [\"2/1\", \"2/2\"], ...], steps { \"N/M\": operatorId }, current, leases { \"N/M\": { agent, holds } }, requestHashes { \"N/M\": sha256 of request/request.json }, resumes { \"N/M\": { resumes: \"K/L\", stop } } for every re-entry, stoppedAt { branch, operator, stop | null, domain, route, why } when the session ended, substitutions { \"N/M\": code } for codes read as UNKNOWN_STOP, transitions [] as the audit trail",
    "branch": "step-<N>/parallel-<M>/ — N is the position in the chain, M the parallel branch; parallel-1 always exists",
    "branchLayout": [
      "request/request.json",
      "response/response.json",
      "response/response.md",
      "response/<other>.md when the operator has one",
      "response/data/",
      "response/artifacts/",
      "<exchange>/request/request.json and <exchange>/response/ for a nested exchange"
    ],
    "paths": "inside request.json inputs: from the session root (step-1/parallel-1/response/response.md); inside response.json fields and operator.md Outputs: from the branch (response/response.md, critique/response/critique.md)",
    "lifecycle": [
      "create: the session is the first act of the mission, before anything else. Nothing is designed, written or committed outside a session. Before any file outside the session folder is read in order to change it, and before any file outside the session folder is written, state.json and step-1/parallel-1/request/request.json exist on disk and scripts/validate-request.mjs is green on that branch; only then does the orchestrator take the leases and start the first agent. An agent that finds itself editing routed source, or publishing it, with no step-N/parallel-M under a session stops with SESSION_MISSING and reports it: the folder is never written afterwards, because a session written after the work records the work instead of gating it, and the candidates, screenshots and UAT runs it should have held cannot be reconstructed from a diff",
      "branch: each agent gets a fresh step-N/parallel-M/ with request/request.json already written and hashed into state.json, and writes only response/",
      "advance: response.json status done and both validators green; the orchestrator writes the next branches' request.json from the Next table and routing.json. A done response that fails a validator does not route: the session ends with stoppedAt { stop: null, why: the validator output } exactly as a terminating stop ends it",
      "wait: status waiting runs the nested exchange, then resumes the same agent; the branch stays running in state.json",
      "block: status blocked keeps the session on disk. When routing.json answers the stop's domain with kind resume, the orchestrator asks the person for the field the stop names and re-enters the operator in step-(N+1)/parallel-1 with resume set and state.json.resumes recorded. When it answers operator, the named operator runs next and the blocked branch is re-entered the same way once that operator is done. When it answers user or external, the branch stays blocked and the chain continues only after the person or the outside party has changed something the stop names; that continuation is also a step-(N+1)/parallel-1 re-entry with resume set, and request.json must carry the changed requirement or input, because a re-entry with no delta is NO_PROGRESS",
      "done: when routing reaches user or external, or git.publish emits done, the orchestrator releases the leases and deletes the session folder; what survives is what the steps published (commits, business heads, UAT pairs, remote runs) and any audit record the owner copies out first"
    ]
  },
  "sourceWrites": {
    "rule": "an operator that writes source (frontend.source.apply, backend.source.apply, library.source.apply, dependency.update) writes only on the session branch session/<sessionId> of the routed checkout, in a git worktree the orchestrator prepared from the frozen head; it commits the declared write set once and records the sha in response.json.commits; the person's checked-out branch is never touched",
    "track": "changes.md names every path with before/after hashes and the commit; the next requests pin @workspaces/<role> at that sha (contexts[].head) so quality.verify and frontend.surface.audit verify exactly what was written",
    "publish": "git.publish merges the session branch into the target branch: fast-forward when the target has not moved; a merge commit only when there is no conflict and the gates are re-run on the merge result; a conflict is NON_FAST_FORWARD and a person resolves it; never rebase, never force",
    "cleanup": "after a successful publish the worktree and the session branch are removed together with the session folder; a blocked session keeps both",
    "policy": "the routed checkout must declare gitPolicy.worktreeBranches = session-only (readiness/initialization/workspaces); a route declaring forbidden binds read-only and no source-writing operator may run against it; mode dry is exempt, because it writes nothing: a dry backend.source.apply or frontend.source.apply may run against a read-only binding, and its plan records a null commit"
  },
  "profileEquivalents": {
    "rule": "an operator binds one profile; when the processor runs on a runtime that lacks that profile, it runs the equivalent profile of its own runtime with exactly the grants the operator requires, and response.json records both (boundProfile, ranProfile) so an audit can tell a stand-in from the binding",
    "pairs": {
      "opus": "sol-fresh",
      "sonnet": "luna",
      "fable": "sol-reviewer",
      "sol-fresh": "opus",
      "luna": "sonnet",
      "sol-reviewer": "fable"
    },
    "grants": "the equivalent runs with the tools the operator declares that its own profile permits and its runtime supports (resources/tools.json); a tool the runtime does not support is unavailable for that run: a judged imagegen step records that no artwork could be made and continues, any other unsupported tool blocks the branch with the operator's own code",
    "imageVersusVisualize": "imageGeneration means artwork: a digital image produced by an image model (OpenAI profiles only). Rendering HTML (direction candidates, audit sheets, previews) is visualization, needs no grant, and every runtime does it."
  }
}
```

## FILE: .claude/resources/tools.json

SHA-256: 8dacb08371f837eb714e8b763a25e07c0d665e1a731fdf3f7f275399f8c4a980

```json
{
  "schemaVersion": 9,
  "note": "The closed registry of tools an operator may call, addressed as @tools/<id> in a Steps table. A tool is what an operator is allowed to do beyond reading aliases; an alias is what it may read. Each tool lists the modes an operator may declare in operator.json → resources.tools, and how each runtime provides it, so the same operator.md runs on Codex and on Claude without a second home for the rule. A runtime that does not support a tool cannot run an operator that declares it in a mode other than never; the processor then runs the profile equivalent on a runtime that does, or reports the gap. A tool absent from this file does not exist for an operator.",
  "runtimes": {
    "openai": "Codex (desktop app or CLI) running an OpenAI profile from resources/agents/profiles/openai.json",
    "claude": "Claude Code (desktop app or CLI) running a Claude profile from resources/agents/profiles/claude.json"
  },
  "tools": {
    "fileread": {
      "purpose": "Read files and directories at the aliases the Context table names, at the frozen head.",
      "modes": {
        "never": "the operator reads nothing on disk",
        "context-aliases": "only locations the Context table resolves to"
      },
      "support": {
        "openai": {
          "supported": true,
          "via": "Codex file reads"
        },
        "claude": {
          "supported": true,
          "via": "Claude Code Read, Glob and Grep"
        }
      }
    },
    "sourcewrite": {
      "purpose": "Write files inside a routed checkout or an authority root.",
      "modes": {
        "never": "the operator writes no file outside its own response/",
        "declared-write-set": "only the paths the request declared, only on the session branch or the authority root the alias names, only values the bound receipts already contain"
      },
      "support": {
        "openai": {
          "supported": true,
          "via": "Codex file edits"
        },
        "claude": {
          "supported": true,
          "via": "Claude Code Write and Edit"
        }
      }
    },
    "git": {
      "purpose": "Read and change repository state: heads, branches, worktrees, commits, merges, pushes.",
      "modes": {
        "never": "no git at all",
        "read": "rev-parse, status, log, diff, show; nothing that writes",
        "commit-session-branch": "create or reuse the session/<sessionId> worktree from the frozen head and commit the declared write set there exactly once; never the person's branch",
        "merge-and-push": "merge the session branch into the target (fast-forward, or a merge commit with the gates re-run), push without force, remove the session worktree and branch; never rebase, never force, never --no-verify",
        "merge-into-integration-branch": "create or reuse the product integration worktree from the mainline and merge a session branch or the mainline into it as a merge commit, so two sessions meet at integration time; never push, never rebase, never force, never delete a branch"
      },
      "support": {
        "openai": {
          "supported": true,
          "via": "git through the Codex shell"
        },
        "claude": {
          "supported": true,
          "via": "git through the Claude Code Bash tool"
        }
      }
    },
    "shell": {
      "purpose": "Run declared commands: gates, builds, proofs, hooks, deployment plans.",
      "modes": {
        "never": "the operator runs no command",
        "declared-commands": "only the commands the route, the contract, or the manifest pins, with their output captured as evidence"
      },
      "support": {
        "openai": {
          "supported": true,
          "via": "the Codex shell"
        },
        "claude": {
          "supported": true,
          "via": "the Claude Code Bash tool"
        }
      }
    },
    "websearch": {
      "purpose": "Read public web pages to close one named gap in the evidence; results are references with URLs, never authority.",
      "modes": {
        "never": "the operator does not search",
        "bounded": "the operator searches only for the gap the step names and records every source it used with its URL"
      },
      "support": {
        "openai": {
          "supported": true,
          "via": "Codex web search"
        },
        "claude": {
          "supported": true,
          "via": "Claude Code WebSearch and WebFetch"
        }
      }
    },
    "imagegen": {
      "purpose": "Produce artwork: a digital image from an image model, made to one stated claim. Rendering HTML is the visualize tool, not this one.",
      "modes": {
        "never": "the operator produces no artwork",
        "judged": "the operator decides on its own, from the direction, whether a region reads empty enough to need artwork, records why, and never decorates",
        "required": "artwork is a step of the job"
      },
      "support": {
        "openai": {
          "supported": true,
          "via": "the OpenAI image model available to the Codex session"
        },
        "claude": {
          "supported": false,
          "via": "none; a judged step records that no artwork could be made and the branch continues; a required step blocks with the operator's own code"
        }
      }
    },
    "visualize": {
      "purpose": "Render HTML for a person to look at: direction candidates, audit sheets, alternative comparisons, previews. No model grant is involved.",
      "modes": {
        "never": "the operator renders nothing",
        "html": "the operator writes HTML under response/artifacts/ and links it from response.md"
      },
      "support": {
        "openai": {
          "supported": true,
          "via": "files written by the Codex session"
        },
        "claude": {
          "supported": true,
          "via": "files written by the Claude Code session"
        }
      }
    },
    "browsercontrol": {
      "purpose": "Drive a real browser against a served route: navigate, act, capture screenshots and DOM measurements.",
      "modes": {
        "never": "the operator opens no browser",
        "required": "the operator's evidence comes from a driven browser"
      },
      "support": {
        "openai": {
          "supported": true,
          "via": "Codex computer use, which opens the person's own Chrome; every UAT or audit run must use a dedicated browser profile (the shared UAT identity), never the person's logged-in profile"
        },
        "claude": {
          "supported": true,
          "via": "the in-app Browser pane, or Claude in Chrome when the task needs the person's sessions"
        }
      }
    },
    "http": {
      "purpose": "Probe an endpoint: readiness, health, a served route, a GraphQL typename, a status page.",
      "modes": {
        "never": "no probes",
        "probe": "GET or HEAD against the endpoints the runtime registry or the manifest names, with the observed status recorded"
      },
      "support": {
        "openai": {
          "supported": true,
          "via": "curl through the Codex shell"
        },
        "claude": {
          "supported": true,
          "via": "curl through Bash, or WebFetch for a public URL"
        }
      }
    },
    "registry": {
      "purpose": "Read a package registry: the published Grammar, its version, its files.",
      "modes": {
        "never": "no registry reads",
        "read": "npm view and the installed package in node_modules; publishing stays with a person"
      },
      "support": {
        "openai": {
          "supported": true,
          "via": "npm through the Codex shell"
        },
        "claude": {
          "supported": true,
          "via": "npm through Bash"
        }
      }
    },
    "container": {
      "purpose": "Inspect or operate containers and images: compose services, GHCR images by digest.",
      "modes": {
        "never": "no container operations",
        "read": "inspect, logs, digests",
        "operate": "start, stop, roll out, roll back the services the approved plan names"
      },
      "support": {
        "openai": {
          "supported": true,
          "via": "docker and the GHCR API through the Codex shell"
        },
        "claude": {
          "supported": true,
          "via": "docker and the GHCR API through Bash"
        }
      }
    },
    "ci": {
      "purpose": "Observe or dispatch continuous-integration runs.",
      "modes": {
        "never": "no CI access",
        "read": "list and read runs and their logs",
        "dispatch": "trigger the workflow the release manifest names"
      },
      "support": {
        "openai": {
          "supported": true,
          "via": "gh through the Codex shell"
        },
        "claude": {
          "supported": true,
          "via": "gh through Bash"
        }
      }
    },
    "objectstorage": {
      "purpose": "Read or write objects in the content store (MinIO): curriculum, style references, published units.",
      "modes": {
        "never": "no object store access",
        "read": "read the objects the unit names",
        "write": "publish the objects the unit produced, under a person's approval"
      },
      "support": {
        "openai": {
          "supported": true,
          "via": "the MinIO client or its HTTP API through the Codex shell"
        },
        "claude": {
          "supported": true,
          "via": "the MinIO client or its HTTP API through Bash"
        }
      }
    },
    "secrets": {
      "purpose": "Resolve a sealed credential by name at the moment it is used; never read, print or store its value. The value may enter the request body of the call that consumes it or the field of a form in a driven browser, and nowhere else: not a file, not a fixture, not a recorded command, not a screenshot, not a log and not a receipt.",
      "modes": {
        "never": "no credential is resolved",
        "resolve-by-name": "the name comes from device-state or the selected route; identity provisioning first passes resources/identity.json through its fixed consuming helper. Decryption happens in the tool that consumes it; the value reaches only a request body or a browser form, never response/, a capture, a generic file-read result or diagnostic output"
      },
      "support": {
        "openai": {
          "supported": true,
          "via": "SOPS and age through the Codex shell"
        },
        "claude": {
          "supported": true,
          "via": "SOPS and age through Bash"
        }
      }
    },
    "database": {
      "purpose": "Read or write the product database for verification: seeds, fixtures, is_uat records.",
      "modes": {
        "never": "no database access",
        "read": "select only",
        "namespaced-write": "insert and delete only rows carrying the run namespace and is_uat=true"
      },
      "support": {
        "openai": {
          "supported": true,
          "via": "psql or the service's API through the Codex shell"
        },
        "claude": {
          "supported": true,
          "via": "psql or the service's API through Bash"
        }
      }
    },
    "host": {
      "purpose": "Serve a folder of static HTML on the loopback interface so a person can open it in a browser. The port is tried from 60000 upward to 60100 and the first free one wins; the receipt records the URL, the port, the folder and the pid under response/artifacts/host.json, and the server is stopped when the branch ends or is resumed. It never binds 0.0.0.0, so nothing it serves leaves the machine.",
      "modes": {
        "never": "the operator serves nothing",
        "loopback": "the operator serves one folder on 127.0.0.1 at the first free port from 60000 to 60100 and records host.json"
      },
      "support": {
        "openai": {
          "supported": true,
          "via": "node scripts/host-artifacts.mjs <folder> through the shell of the Codex session (the tree ships the server; nothing is written ad hoc)"
        },
        "claude": {
          "supported": true,
          "via": "node scripts/host-artifacts.mjs <folder> through the shell of the Claude Code session (the tree ships the server; nothing is written ad hoc)"
        }
      },
      "script": "scripts/host-artifacts.mjs"
    },
    "print": {
      "purpose": "Hand an artifact to the person in the conversation, rendered when the client can (image, HTML) and as a path or URL otherwise, at the moment a decision or a verdict needs their eyes. A run that produced the artifact and said nothing served nobody: the artifact reaches the person where they are reading, not where the branch happened to write it.",
      "modes": {
        "never": "the operator hands the person nothing",
        "decision-points": "before a decision or a verdict is recorded, the operator hands the person every artifact that decision or verdict rests on, and lists the same artifact in the receipt under `## Printed` with why it was printed; a receipt whose table is empty where the operator printed something is a defect its own validator refuses. Apply resources/interaction.json before communicating any question. For a visual tier choice, print one rendered candidate per typed option, served through @tools/host with a capture per viewport; the stop's `reason` names the sheet URL and asks one question. Scores inform the recommendation. Prose alternatives do not replace rendered evidence; the operator's validator refuses a visual choice whose `## Printed` holds fewer rendered candidates than its options, or none. A diagnostic owner route carries no question by itself. Printing and the communication policy grant no operational authorization."
      },
      "support": {
        "openai": {
          "supported": true,
          "via": "the absolute path or the URL printed into the conversation, with the image inline where the client renders one"
        },
        "claude": {
          "supported": true,
          "via": "the session's file and render hand-off, which displays an image or an HTML page in the conversation and falls back to the path or the URL"
        }
      }
    }
  }
}
```

## FILE: .claude/resources/agents/profiles/claude.json

SHA-256: a4faff01a3b05084f2e2ddc0aa81da54d39451661131910a87679eb17e705ff3

```json
{
  "schemaVersion": 8,
  "runtime": "claude",
  "provider": "anthropic",
  "note": "Execution profiles run by the claude runtime. Profile ids are unique across every file in this directory and are what each operator binds under `resources` in its operator.json. `capabilities` states what the model can do in this workspace; `permits` states what a role on this profile may use, and must be a subset of capabilities.",
  "profiles": {
    "opus": {
      "model": "claude-opus-5",
      "isolation": "fresh",
      "forkTurns": "none",
      "count": 1,
      "role": "Heavy authoring and high-stakes mutation inside a frozen boundary: source apply, backend implementation, release and platform operations.",
      "capabilities": {
        "fileread": true,
        "sourcewrite": true,
        "git": true,
        "shell": true,
        "websearch": true,
        "imagegen": false,
        "visualize": true,
        "browsercontrol": true,
        "http": true,
        "registry": true,
        "container": true,
        "ci": true,
        "objectstorage": true,
        "secrets": true,
        "database": true,
        "host": true,
        "print": true
      },
      "permits": {
        "fileread": true,
        "sourcewrite": true,
        "git": true,
        "shell": true,
        "websearch": true,
        "imagegen": false,
        "visualize": true,
        "browsercontrol": true,
        "http": true,
        "registry": true,
        "container": true,
        "ci": true,
        "objectstorage": true,
        "secrets": true,
        "database": true,
        "host": true,
        "print": true
      }
    },
    "sonnet": {
      "model": "claude-sonnet-5",
      "isolation": "fresh",
      "forkTurns": "none",
      "count": 1,
      "role": "Deterministic and mechanical work: lookups against a closed inventory, gate execution, route verification, non-force publication.",
      "capabilities": {
        "fileread": true,
        "sourcewrite": true,
        "git": true,
        "shell": true,
        "websearch": true,
        "imagegen": false,
        "visualize": true,
        "browsercontrol": true,
        "http": true,
        "registry": true,
        "container": true,
        "ci": true,
        "objectstorage": true,
        "secrets": true,
        "database": true,
        "host": true,
        "print": true
      },
      "permits": {
        "fileread": true,
        "sourcewrite": true,
        "git": true,
        "shell": true,
        "websearch": true,
        "imagegen": false,
        "visualize": true,
        "browsercontrol": true,
        "http": true,
        "registry": true,
        "container": true,
        "ci": true,
        "objectstorage": true,
        "secrets": true,
        "database": true,
        "host": true,
        "print": true
      }
    },
    "fable": {
      "model": "claude-fable-5-1",
      "isolation": "fresh",
      "forkTurns": "none",
      "count": 1,
      "role": "Long-form extraction and documentation grounded in source, such as pattern catalogs and audits that must count rather than assert.",
      "capabilities": {
        "fileread": true,
        "sourcewrite": true,
        "git": true,
        "shell": true,
        "websearch": true,
        "imagegen": false,
        "visualize": true,
        "browsercontrol": true,
        "http": true,
        "registry": true,
        "container": true,
        "ci": true,
        "objectstorage": true,
        "secrets": true,
        "database": true,
        "host": true,
        "print": true
      },
      "permits": {
        "fileread": true,
        "sourcewrite": false,
        "git": true,
        "shell": true,
        "websearch": true,
        "imagegen": false,
        "visualize": true,
        "browsercontrol": true,
        "http": true,
        "registry": true,
        "container": false,
        "ci": true,
        "objectstorage": false,
        "secrets": true,
        "database": true,
        "host": true,
        "print": true
      }
    }
  }
}
```

## FILE: .claude/resources/agents/profiles/openai.json

SHA-256: 0e86b94dc2f9e14239462201988f70ab37a9f28e2f473b121426ba6c8e05b67a

```json
{
  "schemaVersion": 8,
  "runtime": "openai",
  "provider": "openai",
  "note": "Execution profiles run by the OpenAI runtime: Sol 5.6 and Luna 5.6. These models do not run through Codex; a Codex runtime (Terra 5.6) gets its own file here only when an operator binds it. Profile ids are unique across every file in this directory and are what each operator binds under `resources` in its operator.json. `capabilities` states what the model can do in this workspace; `permits` states what a role on this profile may use, and must be a subset of capabilities.",
  "profiles": {
    "sol-fresh": {
      "model": "gpt-5.6-sol",
      "isolation": "fresh",
      "forkTurns": "none",
      "count": 1,
      "role": "One fresh execution that completes a material brainstorm or decision end to end with no inherited turns.",
      "capabilities": {
        "fileread": true,
        "sourcewrite": true,
        "git": true,
        "shell": true,
        "websearch": true,
        "imagegen": true,
        "visualize": true,
        "browsercontrol": true,
        "http": true,
        "registry": true,
        "container": true,
        "ci": true,
        "objectstorage": true,
        "secrets": true,
        "database": true,
        "host": true,
        "print": true
      },
      "permits": {
        "fileread": true,
        "sourcewrite": true,
        "git": true,
        "shell": true,
        "websearch": true,
        "imagegen": true,
        "visualize": true,
        "browsercontrol": true,
        "http": true,
        "registry": true,
        "container": true,
        "ci": true,
        "objectstorage": true,
        "secrets": true,
        "database": true,
        "host": true,
        "print": true
      }
    },
    "sol-reviewer": {
      "model": "gpt-5.6-sol",
      "isolation": "fresh",
      "forkTurns": "none",
      "count": 1,
      "role": "One fresh reviewer that receives artifacts and claims only, never the producer's rationale, and returns findings without repairing anything. The model can write and draw; this role is forbidden to, by policy.",
      "capabilities": {
        "fileread": true,
        "sourcewrite": true,
        "git": true,
        "shell": true,
        "websearch": true,
        "imagegen": true,
        "visualize": true,
        "browsercontrol": true,
        "http": true,
        "registry": true,
        "container": true,
        "ci": true,
        "objectstorage": true,
        "secrets": true,
        "database": true,
        "host": true,
        "print": true
      },
      "permits": {
        "fileread": true,
        "sourcewrite": false,
        "git": true,
        "shell": true,
        "websearch": true,
        "imagegen": false,
        "visualize": true,
        "browsercontrol": true,
        "http": true,
        "registry": true,
        "container": false,
        "ci": true,
        "objectstorage": false,
        "secrets": true,
        "database": true,
        "host": true,
        "print": true
      }
    },
    "luna": {
      "model": "gpt-5.6-luna",
      "isolation": "fresh",
      "forkTurns": "none",
      "count": 1,
      "role": "Authored content end to end: bounded brief research, writing, per-language code tracks, image generation to a stated claim, and the bounded run-read-repair loop.",
      "capabilities": {
        "fileread": true,
        "sourcewrite": true,
        "git": true,
        "shell": true,
        "websearch": true,
        "imagegen": true,
        "visualize": true,
        "browsercontrol": true,
        "http": true,
        "registry": true,
        "container": true,
        "ci": true,
        "objectstorage": true,
        "secrets": true,
        "database": true,
        "host": true,
        "print": true
      },
      "permits": {
        "fileread": true,
        "sourcewrite": true,
        "git": true,
        "shell": true,
        "websearch": true,
        "imagegen": true,
        "visualize": true,
        "browsercontrol": true,
        "http": true,
        "registry": true,
        "container": true,
        "ci": true,
        "objectstorage": true,
        "secrets": true,
        "database": true,
        "host": true,
        "print": true
      }
    }
  }
}
```

## FILE: .claude/alias/alias.json

SHA-256: d6cd281cfc06f1f2a7eb29aaced00d8a22e9ff16fdd99f46b2a4b04a7f775d03

```json
{
  "schemaVersion": 8,
  "note": "Closed registry of reference aliases. An alias reads like the place it names. Static: @workspaces/fe and @workspaces/be (the bound project's routed checkouts), @workspaces/<project>/<role>, @workspaces/{projects,local/routes,ports,device-state}, @grammar/<family>, @knowledge/{ui,grammars,patterns}, @worktrees/{businesses,uat,debts,_templates,sessions/central-runtime}, @remote/{npm,git,ghcr,github-actions,minio}. Dynamic: @dynamic, the current session branch, typed by kind. `<Source>` is the host repository that owns this .claude. A sub-path after a registered alias narrows it; a segment in angle brackets is supplied by the invocation. The registry is a tree: one root per zone, children by path segment, a node with resolvesTo is a definition. Resolution picks the longest registered prefix.",
  "zones": {
    "remote": {
      "en": "Internet. Registries, git remotes, image registries, CI runs, object storage. Read through a network; bound by version, digest, or observed head.",
      "vi": "Internet. Registry, git remote, kho image, run CI, object storage. Đọc qua mạng; bind bằng version, digest hay head quan sát được."
    },
    "grammar": {
      "en": "The Grammar package as the bound app resolves it: the only fact about what a component owns.",
      "vi": "Gói Grammar như app đang resolve: sự thật duy nhất về việc component sở hữu gì."
    },
    "knowledge": {
      "en": "Canonical law in this tree: universal UI law (ui), the family's taste (grammars), code conventions (patterns). Read only; edited by the owner.",
      "vi": "Luật chuẩn trong cây này: luật UI phổ quát (ui), khẩu vị của họ (grammars), quy ước code (patterns). Chỉ đọc; chủ mới sửa."
    },
    "workspaces": {
      "en": "The working area: routed checkouts of the bound project and the declarations, routes, ports, and identity that locate them.",
      "vi": "Vùng làm việc: các checkout đã route của project đang bind, và khai báo, route, port, danh tính để tìm ra chúng."
    },
    "worktrees": {
      "en": "Machine-local authority and evidence outside any checkout: business heads, UAT pairs, debts, templates, the shared runtime owner.",
      "vi": "Thẩm quyền và bằng chứng máy-cục-bộ ngoài mọi checkout: head nghiệp vụ, UAT pair, nợ, khuôn, runtime owner dùng chung."
    },
    "dynamic": {
      "en": "Produced inside the current session by an earlier step and deleted with the session. Never exists before the run.",
      "vi": "Sinh trong phiên hiện tại bởi một bước trước và xoá cùng phiên. Không tồn tại trước lần chạy."
    }
  },
  "segments": {
    "note": "Human-friendly segments inside any checkout alias (@workspaces/fe, @workspaces/be, @workspaces/<project>/<role>), mapped to the exact path. Write the friendly word; the resolver substitutes the path.",
    "husky": ".husky/  (pre-commit, pre-push)",
    "package": "package.json  (scripts, dependencies, the package version)",
    "gates": "package.json#scripts plus the configs it names (eslint.config.*, tsconfig*.json, jest.config.*/vitest.config.*, sonar-project.properties)",
    "grammar": "packages/grammar  (the Grammar package source inside @workspaces/fe)",
    "/branch/session": "the session branch session/<sessionId> of that checkout, in its own git worktree prepared from the frozen head; the only branch a source-writing operator may commit to",
    "/commit/<sha>": "that checkout at one commit; how a later step names exactly what an earlier step wrote (response.json.commits[])"
  },
  "tree": {
    "@workspaces": {
      "params": [
        "project",
        "role"
      ],
      "kind": "checkout",
      "resolvesTo": "<checkout:project/role>  (any routed checkout named explicitly, for cross-project reads: @workspaces/other-project/fe)",
      "scheme": "source://<repository>",
      "bind": "fingerprint + sourceHead (git rev-parse HEAD of the checkout)",
      "writers": [],
      "purpose": "A checkout of another project. The bound project's own are @workspaces/fe and @workspaces/be.",
      "fe": {
        "params": [],
        "kind": "checkout",
        "resolvesTo": "<checkout:input.project.id/fe>  (diskPath from <Source>/.workspaces/local/routes/<project>/fe/config.json); friendly segments: /husky, /package, /gates, /grammar (see segments)",
        "scheme": "source://<repository>",
        "bind": "fingerprint + sourceHead (git rev-parse HEAD of the checkout)",
        "writers": [
          "frontend.source.apply",
          "library.source.apply",
          "dependency.update"
        ],
        "purpose": "The routed frontend checkout of the bound project."
      },
      "be": {
        "params": [],
        "kind": "checkout",
        "resolvesTo": "<checkout:input.project.id/be>  (diskPath from <Source>/.workspaces/local/routes/<project>/be/config.json); friendly segments: /husky, /package, /gates (see segments)",
        "scheme": "source://<repository>",
        "bind": "fingerprint + sourceHead (git rev-parse HEAD of the checkout)",
        "writers": [
          "backend.source.apply"
        ],
        "purpose": "The routed backend checkout of the bound project."
      },
      "projects": {
        "params": [],
        "kind": "dir",
        "resolvesTo": "<Source>/.workspaces/projects/<project>/<role>.json",
        "scheme": "workspace://declarations/<project>",
        "bind": "fingerprint",
        "writers": [],
        "purpose": "Portable route declarations, tracked. The only place a route is declared."
      },
      "local": {
        "routes": {
          "params": [],
          "kind": "dir",
          "resolvesTo": "<Source>/.workspaces/local/routes/<project>/<role>/config.json",
          "scheme": "workspace://routes/<project>/<role>",
          "bind": "fingerprint",
          "writers": [
            "workspace.bind"
          ],
          "purpose": "Machine-local hydrated routes; project the declarations onto this disk. Ignored by Git."
        }
      },
      "ports": {
        "params": [],
        "kind": "dir",
        "resolvesTo": "<Source>/.workspaces/ports/<project>.json",
        "scheme": "workspace://ports/<project>",
        "bind": "fingerprint",
        "writers": [],
        "purpose": "Port projection: project offset and application slots. Endpoints are derived, never typed."
      },
      "device-state": {
        "params": [],
        "kind": "file",
        "resolvesTo": "<Source>/.workspaces/device-state.json  (sealed keys live in <Source>/.workspaces/local/credentials/*.key.enc and are bound by name, never read)",
        "scheme": "workspace://identity/device",
        "bind": "fingerprint",
        "writers": [],
        "purpose": "Machine identity and the encrypted credential roster reference."
      }
    },
    "@knowledge": {
      "ui": {
        "params": [],
        "kind": "dir",
        "resolvesTo": "<Source>/.claude/knowledge/ui/  (composition/, presentation/, proof/; a sub-path narrows: @knowledge/ui/presentation)",
        "scheme": "knowledge://ui/<group>/<topic>",
        "bind": "fingerprint per file; rule inventory = every `## PREFIX-n` heading in the folder",
        "writers": [],
        "purpose": "Universal UI law: what a tree must contain, which value an app boundary takes, what is only true once rendered."
      },
      "grammars": {
        "params": [],
        "kind": "dir",
        "resolvesTo": "<Source>/.claude/knowledge/grammars/<family>/  (DNA.md generated from the package; idioms.md and playbook.md are the owner's taste; family.md holds the visual DNA and the gap table)",
        "scheme": "knowledge://grammars/<family>/<topic>",
        "bind": "fingerprint per file; DNA.md additionally binds the package version and checkout head it was generated from",
        "writers": [],
        "purpose": "How the family composes: the owner's taste (idioms, playbook) and what exists (DNA). Never the Grammar itself; where a taste row disagrees with @grammar, @grammar is the fact and the row is the finding."
      },
      "patterns": {
        "params": [],
        "kind": "dir",
        "resolvesTo": "<Source>/.claude/knowledge/patterns/  (fe/, be/)",
        "scheme": "knowledge://patterns/<side>/<topic>",
        "bind": "fingerprint per file; rule inventory = every `## PREFIX-n` heading in the folder",
        "writers": [],
        "purpose": "Code conventions counted from the two live sources; a rule cites two real paths."
      }
    },
    "@worktrees": {
      "businesses": {
        "params": [],
        "kind": "dir",
        "resolvesTo": "<Source>/.worktrees/businesses/  (features/<featureId>/model.json; business-registry-v1.json is the head index; objects/sha256/ the content store)",
        "scheme": "business://<featureId>",
        "bind": "content address from business-registry-v1.json featureHeads.<featureId>.head, with authorityStatus",
        "writers": [
          "business.decide"
        ],
        "purpose": "Business promise heads. Its own git worktree; a head binds by content address even before its commit lands."
      },
      "sessions": {
        "params": [],
        "kind": "dir",
        "resolvesTo": "<Source>/.worktrees/sessions/<sessionId>/  (state.json; step-<N>/parallel-<M>/ branches, each with request/ and response/ — see @dynamic; central-runtime/ is the shared runtime owner registry outside any session)",
        "scheme": "session://<sessionId>",
        "bind": "fingerprint per file read",
        "writers": [
          "*"
        ],
        "purpose": "The session container. Operators do not read it directly; they read @dynamic.",
        "central-runtime": {
          "params": [],
          "kind": "file",
          "resolvesTo": "<Source>/.worktrees/sessions/central-runtime/owner.json  (runtimes: one entry per <project>/<role> with its endpoints, head, generation, status, health evidence and identity declaration; generation-<n>-ready.json and logs/ beside it)",
          "scheme": "runtime://owner",
          "bind": "fingerprint + generation",
          "writers": [
            "platform.operate"
          ],
          "purpose": "The shared runtime owner, keyed per project route: each entry carries its own generation, status, endpoints, health evidence and identity provider. Callers consume the entry of their own route, never own it."
        }
      },
      "uat": {
        "params": [],
        "kind": "dir",
        "resolvesTo": "<Source>/.worktrees/uat/<flow>/  (flow.md: goal, role, preconditions, budget and the step table; accounts.<env>.json: one account per alias the steps act as, each a username, a role, a credential name, the sealed file and the registry entry, never a secret; seed/: README.md, records.json and fixtures/; snapshots/: the approved reference a person promotes, with its captures and data/after.json; runs/<runId>/ append-only, runId = <yyyymmdd-HHMMss>-<commit7>: snapshot.json, steps/<NN-slug>/, db/, diff/, verdicts.json, run.md; latest.json names the newest run and history.md keeps one line per run). <case> narrows to one case of the flow",
        "scheme": "uat://<flow>/<case>",
        "bind": "fingerprint of snapshot.json and result.json",
        "writers": [
          "platform.operate",
          "uat.verify"
        ],
        "purpose": "UAT authority per flow: the flow document, its dedicated account, its seed, the approved reference, and the append-only history of every run with the commit it verified. A record that is absent is created by the runtime, never reported as missing."
      },
      "debts": {
        "params": [],
        "kind": "dir",
        "resolvesTo": "<Source>/.worktrees/debts/  (be.md, fe.md, per-item files)",
        "scheme": "debt://<file>",
        "bind": "fingerprint per file",
        "writers": [],
        "purpose": "Owner-approved quality debts. A debt without a live approval here is not a debt."
      },
      "_templates": {
        "params": [],
        "kind": "dir",
        "resolvesTo": "<Source>/.worktrees/_templates/  (businesses/, debts/, sessions/); uat/ resolves to <Source>/.claude/templates/uat/",
        "scheme": "template://<kind>",
        "bind": "fingerprint per file",
        "writers": [],
        "purpose": "Authority templates for new heads, debts, sessions, and UAT flows. The UAT flow template ships with the tree at templates/uat/ (README.md as the folder contract, flow.md, accounts.json.example, run.md, seed/), so a fresh install has one without provisioning a worktree, and a flow folder that does not exist yet is drafted from it. Consumed, never modified."
      }
    },
    "@grammar": {
      "params": [
        "family"
      ],
      "kind": "checkout",
      "resolvesTo": "the Grammar package as the bound app resolves it (`file:packages/grammar` inside @workspaces/fe when vendored locally, or @remote/npm when published), narrowed to one family <family>: @grammar/core, @grammar/heritage, @grammar/offset-pop; @grammar/common is the shared layer every family imports",
      "scheme": "grammar://<family>@<version>",
      "bind": "package.json version + the resolved location's fingerprint (checkout head for file:, tarball integrity for npm)",
      "writers": [],
      "purpose": "The Grammar as it runs: Common renderers, props, owned relationships, data-contract claims, and the family's own CSS. The only fact about what a component owns."
    },
    "@remote": {
      "npm": {
        "params": [
          "package"
        ],
        "kind": "service",
        "resolvesTo": "the npm registry entry for <package>, e.g. @remote/npm/@scope/package@1.0.0",
        "scheme": "npm://<package>@<version>",
        "bind": "version + tarball integrity",
        "writers": [],
        "purpose": "Published packages. A version is the binding; latest never is."
      },
      "git": {
        "params": [
          "project",
          "role"
        ],
        "kind": "service",
        "resolvesTo": "the origin URL in @workspaces/local/routes/<project>/<role> (repository.gitRepository)",
        "scheme": "remote://<repository>/<branch>",
        "bind": "observed remote head (git ls-remote) at invocation time",
        "writers": [
          "git.publish"
        ],
        "purpose": "The publication target; fast-forwardness is decided against this observation."
      },
      "ghcr": {
        "params": [
          "image"
        ],
        "kind": "service",
        "resolvesTo": "ghcr.io/<image>@<digest>",
        "scheme": "oci://ghcr.io/<image>",
        "bind": "digest",
        "writers": [
          "release.deploy"
        ],
        "purpose": "Immutable release images. A tag is never a binding; a digest is."
      },
      "github-actions": {
        "params": [
          "runId"
        ],
        "kind": "service",
        "resolvesTo": "GitHub Actions run <runId> of the routed repository",
        "scheme": "workflow-run://github-actions/<runId>",
        "bind": "run id + conclusion",
        "writers": [],
        "purpose": "CI evidence of a build or rollout, read only."
      },
      "minio": {
        "params": [
          "contentId",
          "locale"
        ],
        "kind": "service",
        "resolvesTo": "MinIO object contents/<contentId>/<locale>.json through the routed runtime",
        "scheme": "content://<contentId>/<locale>",
        "bind": "fingerprint of the fetched object",
        "writers": [
          "content.generate"
        ],
        "purpose": "Authored lesson content as served, not as drafted."
      }
    },
    "@dynamic": {
      "params": [
        "kind"
      ],
      "kind": "dir",
      "resolvesTo": "<Source>/.worktrees/sessions/<sessionId>/step-<N>/parallel-<M>/ — one branch of one step. request/request.json is the gate in (orchestrator writes it); response/ is the agent's: response.json (gate out), response.md and other markdown kinds, data/<name>.json, artifacts/<file>; a nested exchange adds <exchange>/request/ and <exchange>/response/. A kind is passed by explicit path in request.json inputs, from the session root. Dynamic files are passed as kinds (templates/kinds/<kind>), never as aliases. The session folder is created by the orchestrator and deleted when git.publish finishes; a blocked run keeps it for resume",
      "scheme": "step://<sessionId>/<N>/<M>/<path>",
      "bind": "kind contract or schema under templates/kinds; response.json fields is the registry of what a branch produced",
      "writers": [
        "*"
      ],
      "purpose": "Everything produced inside the session and nothing that existed before it. Always dynamic; typed by kind."
    }
  }
}
```

## FILE: .claude/operators/INDEX.md

SHA-256: 62f98cdbfc5fcb7c0ecbe6f167b3bc223ab32e8c14656170d86eda5b61b93c2f

```markdown
# Operators

Generated by `scripts/generate-operators-index.mjs` from every `operator.md`; `--check` runs inside `npm test`, so this table cannot drift from the packages. Context aliases exist before the session; kinds are produced inside a branch (`step-N/parallel-M/response/`) and handed to a later branch by an explicit path in its `request.json`. 16 operators.

## What each operator needs and produces

| Operator | Profile | Context | Inputs (kinds) | Outputs (kinds) | Steps | Stop codes |
| --- | --- | --- | --- | --- | --- | --- |
| `architecture.decide` | `sol-fresh` | `@knowledge/patterns`, `@workspaces/be`, `@worktrees/businesses/<featureId>` | `architecture-decision`, `model` | `architecture-decision`, `current-state`, `stack-model`, `alternatives`, `independent-critique` | 10 | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS`, `EVIDENCE_MISSING`, `CURRENT_STATE_UNOBSERVED`, `BUSINESS_AUTHORITY_REQUIRED`, `CONSTRAINT_CONTRADICTION`, `NO_VIABLE_ALTERNATIVE`, `CHOICE_REQUIRED`, `COMPATIBILITY_UNVERIFIED`, `DATA_OWNERSHIP_UNASSIGNED`, `CRITIQUE_UNRESOLVED` |
| `backend.source.apply` | `luna` | `@knowledge/patterns/be`, `@workspaces/be`, `@worktrees/businesses/<featureId>` | `architecture-decision`, `model`, `backend-source-application` | `backend-source-application`, `changes`, `mutations`, `conformance`, `proof` | 8 | `INVALID_INPUT`, `SESSION_MISSING`, `SOURCE_DRIFT`, `NO_PROGRESS`, `CONTRACT_UNFROZEN`, `CONTRACT_WIDENED`, `BUSINESS_AUTHORITY_MISSING`, `OWNER_CONFLICT`, `PATTERN_UNBOUND`, `PROOF_UNAVAILABLE` |
| `business.decide` | `sol-fresh` | `@workspaces/be`, `@worktrees/businesses/<featureId>` | `architecture-decision`, `backend-source-application` | `business-promise-authority`, `claims`, `coverage-matrix`, `model` | 9 | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS`, `EVIDENCE_MISSING`, `CONTRADICTION_UNRESOLVED`, `LIFECYCLE_TRANSITION_INVALID`, `AUTHORITY_CONFLICT`, `APPROVAL_REQUIRED`, `COVERAGE_INCOMPLETE`, `CONSUMER_UNPROVEN`, `RECONCILIATION_DISCREPANCY` |
| `content.generate` | `luna` | `@remote/minio/<contentId>/<locale>`, `@worktrees/sessions/central-runtime` | `content-generation-receipt` | `content-generation-receipt`, `content-brief`, `e2e`, `content-review`, `article`, `image`, `image-prompt`, `track` | 9 | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS`, `BRIEF_UNBOUND`, `OUTCOME_UNCOVERED`, `IMAGE_UNAVAILABLE`, `CODE_BUILD_FAILED`, `E2E_FAILED`, `CONTRACT_WEAKENED`, `REVIEW_REVISION_REQUIRED`, `REVIEW_ROUNDS_EXHAUSTED` |
| `dependency.update` | `luna` | `@workspaces/fe` | `route` | `dependency-update`, `dependency-proof`, `dependency-log`, `changes` | 5 | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS`, `DEPENDENCY_BOUNDARY_REJECTED`, `DEPENDENCY_PROOF_FAILED` |
| `frontend.direction.decide` | `sol-fresh` | `@grammar/core`, `@knowledge/grammars/<family>`, `@knowledge/ui/composition`, `@knowledge/ui/proof`, `@workspaces/fe`, `@worktrees/uat/<flow>/<case>` | `business-promise-authority`, `backend-source-application`, `architecture-decision`, `frontend-direction-decision` | `frontend-direction-decision`, `ui-coverage`, `candidates`, `direction-image`, `host` | 12 | `INVALID_INPUT`, `ROUTE_UNVERIFIED`, `SOURCE_DRIFT`, `SCOPE_UNFROZEN`, `CHANGE_LEVEL_AMBIGUOUS`, `OWNER_CEILING_INVALID`, `BUSINESS_REQUIRED`, `BACKEND_REQUIRED`, `ARCHITECTURE_REQUIRED`, `GRAMMAR_REQUIRED`, `EVIDENCE_MISSING`, `REFERENCE_EVIDENCE_EXHAUSTED`, `REFERENCE_MISSING`, `NO_VIABLE_DIRECTION`, `DIRECTION_CHOICE_REQUIRED`, `NO_PROGRESS` |
| `frontend.presentation.resolve` | `luna` | `@grammar/core`, `@knowledge/ui/presentation`, `@workspaces/fe` | `frontend-direction-decision`, `frontend-surface-audit` | `frontend-presentation-resolution`, `inventory`, `resolved-tree` | 9 | `INVALID_INPUT`, `SOURCE_DRIFT`, `OWNER_CONFLICT`, `KNOWLEDGE_UNBOUND`, `UNKNOWN_RULE`, `RULE_MISSING`, `GRAMMAR_UNPUBLISHED`, `NO_PROGRESS` |
| `frontend.source.apply` | `luna` | `@workspaces/fe` | `frontend-presentation-resolution`, `frontend-direction-decision` | `frontend-source-application`, `changes`, `writes` | 7 | `INVALID_INPUT`, `SESSION_MISSING`, `SOURCE_DRIFT`, `OWNER_CONFLICT`, `RESOLUTION_STALE`, `WRITE_REJECTED`, `NO_PROGRESS` |
| `frontend.surface.audit` | `sol-reviewer` | `@knowledge/grammars/<family>`, `@knowledge/ui/proof`, `@workspaces/fe`, `@worktrees/sessions/central-runtime` | `frontend-source-application`, `frontend-presentation-resolution`, `frontend-direction-decision`, `route`, `uat-account` | `frontend-surface-audit`, `capture`, `screenshot`, `verdicts`, `host` | 6 | `INVALID_INPUT`, `SOURCE_DRIFT`, `RUNTIME_UNAVAILABLE`, `IDENTITY_MISSING`, `EVIDENCE_MISSING`, `UNKNOWN_RULE`, `SURFACE_CLASS_MISSING`, `NO_PROGRESS` |
| `git.publish` | `luna` | `@remote/git/<project>/<role>`, `@workspaces/<project>/<role>/husky`, `@workspaces/local/routes/<project>/<role>` | `workspace-route-binding`, `changes`, `quality-verification` | `git-publication` | 9 | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS`, `ROUTE_UNVERIFIED`, `SESSION_MISSING`, `APPROVAL_MISSING`, `BRANCH_POLICY_VIOLATION`, `DIRTY_OUTSIDE_BOUNDARY`, `HOOK_BLOCKED`, `NON_FAST_FORWARD` |
| `library.source.apply` | `luna` | `@workspaces/fe` | `route` | `library-source-application`, `library-proof`, `changes` | 5 | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS`, `LIBRARY_BOUNDARY_REJECTED`, `LIBRARY_PROOF_FAILED` |
| `platform.operate` | `luna` | `@workspaces/device-state`, `@workspaces/ports/<project>`, `@workspaces/projects/<project>/<role>`, `@worktrees/_templates`, `@worktrees/sessions/central-runtime`, `@worktrees/uat/<flow>` | — | `platform-operation-receipt`, `delta`, `checks`, `uat-account`, `changes` | 10 | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS`, `AUTHORITY_DRIFT`, `CAPABILITY_MISSING`, `INVENTORY_DRIFT`, `PORT_CONFLICT`, `EFFECT_UNAUTHORIZED`, `SERVICE_UNAVAILABLE`, `PROVISIONING_UNAVAILABLE`, `INTEGRATION_FAILED`, `PROOF_FAILED` |
| `quality.verify` | `luna` | `@workspaces/<project>/<role>/gates`, `@workspaces/be`, `@workspaces/fe`, `@worktrees/debts` | `backend-source-application`, `frontend-source-application`, `changes`, `frontend-surface-audit`, `uat-flow-verification` | `quality-verification`, `gate-result`, `coverage`, `audit-scope` | 8 | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS`, `PREDECESSOR_MIXED`, `PREDECESSOR_STALE`, `GATE_UNAVAILABLE`, `DEBT_UNAPPROVED` |
| `release.deploy` | `luna` | `@remote/ghcr/<image>`, `@remote/github-actions/<runId>`, `@workspaces/be`, `@workspaces/device-state` | `quality-verification`, `backend-source-application`, `route` | `release-deployment`, `probes`, `migration-release`, `migration-release-proof` | 10 | `INVALID_INPUT`, `NO_PROGRESS`, `AUTHORIZATION_MISSING`, `MANIFEST_INVALID`, `APPROVAL_REQUIRED`, `CREDENTIAL_UNAVAILABLE`, `HOST_UNAVAILABLE`, `ARTIFACT_MISSING`, `MIGRATION_BLOCKED`, `DOMAIN_UNRECONCILED`, `ROLLOUT_FAILED`, `RECOVERY_EXHAUSTED`, `CONCURRENT_DRIFT`, `ROLLBACK_IDENTITY_MISSING`, `STEADY_STATE_UNPROVEN` |
| `uat.verify` | `sol-fresh` | `@knowledge/ui/proof`, `@workspaces/be`, `@workspaces/device-state`, `@workspaces/fe`, `@worktrees/_templates`, `@worktrees/sessions/central-runtime`, `@worktrees/uat/<flow>/<case>` | `frontend-surface-audit`, `quality-verification`, `route`, `uat-account` | `uat-flow-verification`, `uat-snapshot`, `uat-capture`, `uat-verdicts`, `audit-scope`, `screenshot`, `sheet` | 10 | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS`, `AUTHORITY_DRIFT`, `ADMISSION_MISSING`, `PROVISIONING_UNAVAILABLE`, `IDENTITY_MISSING`, `LEASE_INVALID`, `RUNTIME_UNAVAILABLE`, `EVIDENCE_UNAVAILABLE`, `FIXTURE_VIOLATION`, `CANONICAL_WRITE_DENIED` |
| `workspace.bind` | `luna` | `@workspaces/device-state`, `@workspaces/local/routes/<project>/<role>`, `@workspaces/ports/<project>`, `@workspaces/projects/<project>/<role>`, `@worktrees/sessions/central-runtime` | — | `workspace-route-binding`, `route` | 6 | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS`, `IDENTITY_UNVERIFIED`, `ROUTE_UNDECLARED`, `ROUTE_UNHYDRATED`, `ROUTE_MISMATCH`, `BRANCH_POLICY_VIOLATION`, `CHECKOUT_DIRTY`, `ENDPOINT_AUTHORITY_STALE`, `RUNTIME_NOT_READY`, `RUNTIME_BUSY` |

## Hand-offs between branches

Every kind that crosses between operators, who writes it, and who reads it. A kind with no consumer is kept for audit or for a person; a kind with no producer is a defect this check reports.

| Kind | Produced by | Consumed by |
| --- | --- | --- |
| `alternatives` | `architecture.decide` | — |
| `architecture-decision` | `architecture.decide` | `architecture.decide (optional)`, `backend.source.apply`, `business.decide (optional)`, `frontend.direction.decide (optional)` |
| `article` | `content.generate` | — |
| `audit-scope` | `quality.verify`, `uat.verify` | — |
| `backend-source-application` | `backend.source.apply` | `backend.source.apply (optional)`, `business.decide (optional)`, `frontend.direction.decide (optional)`, `quality.verify (optional)`, `release.deploy (optional)` |
| `business-promise-authority` | `business.decide` | `frontend.direction.decide (optional)` |
| `candidates` | `frontend.direction.decide` | — |
| `capture` | `frontend.surface.audit` | — |
| `changes` | `backend.source.apply`, `dependency.update`, `frontend.source.apply`, `library.source.apply`, `platform.operate` | `git.publish`, `quality.verify (optional)` |
| `checks` | `platform.operate` | — |
| `claims` | `business.decide` | — |
| `conformance` | `backend.source.apply` | — |
| `content-brief` | `content.generate` | — |
| `content-generation-receipt` | `content.generate` | `content.generate (optional)` |
| `content-review` | `content.generate` | — |
| `coverage` | `quality.verify` | — |
| `coverage-matrix` | `business.decide` | — |
| `current-state` | `architecture.decide` | — |
| `delta` | `platform.operate` | — |
| `dependency-log` | `dependency.update` | — |
| `dependency-proof` | `dependency.update` | — |
| `dependency-update` | `dependency.update` | — |
| `direction-image` | `frontend.direction.decide` | — |
| `e2e` | `content.generate` | — |
| `frontend-direction-decision` | `frontend.direction.decide` | `frontend.direction.decide (optional)`, `frontend.presentation.resolve`, `frontend.source.apply`, `frontend.surface.audit` |
| `frontend-presentation-resolution` | `frontend.presentation.resolve` | `frontend.source.apply`, `frontend.surface.audit` |
| `frontend-source-application` | `frontend.source.apply` | `frontend.surface.audit`, `quality.verify (optional)` |
| `frontend-surface-audit` | `frontend.surface.audit` | `frontend.presentation.resolve (optional)`, `quality.verify (optional)`, `uat.verify` |
| `gate-result` | `quality.verify` | — |
| `git-publication` | `git.publish` | — |
| `host` | `frontend.direction.decide`, `frontend.surface.audit` | — |
| `image` | `content.generate` | — |
| `image-prompt` | `content.generate` | — |
| `independent-critique` | `architecture.decide` | — |
| `inventory` | `frontend.presentation.resolve` | — |
| `library-proof` | `library.source.apply` | — |
| `library-source-application` | `library.source.apply` | — |
| `migration-release` | `release.deploy` | — |
| `migration-release-proof` | `release.deploy` | — |
| `model` | `business.decide` | `architecture.decide (optional)`, `backend.source.apply (optional)` |
| `mutations` | `backend.source.apply` | — |
| `platform-operation-receipt` | `platform.operate` | — |
| `probes` | `release.deploy` | — |
| `proof` | `backend.source.apply` | — |
| `quality-verification` | `quality.verify` | `git.publish`, `release.deploy`, `uat.verify` |
| `release-deployment` | `release.deploy` | — |
| `resolved-tree` | `frontend.presentation.resolve` | — |
| `route` | `workspace.bind` | `dependency.update`, `frontend.surface.audit`, `library.source.apply`, `release.deploy (optional)`, `uat.verify` |
| `screenshot` | `frontend.surface.audit`, `uat.verify` | — |
| `sheet` | `uat.verify` | — |
| `stack-model` | `architecture.decide` | — |
| `track` | `content.generate` | — |
| `uat-account` | `platform.operate` | `frontend.surface.audit (optional)`, `uat.verify (optional)` |
| `uat-capture` | `uat.verify` | — |
| `uat-flow-verification` | `uat.verify` | `quality.verify (optional)` |
| `uat-snapshot` | `uat.verify` | — |
| `uat-verdicts` | `uat.verify` | — |
| `ui-coverage` | `frontend.direction.decide` | — |
| `verdicts` | `frontend.surface.audit` | — |
| `workspace-route-binding` | `workspace.bind` | `git.publish` |
| `writes` | `frontend.source.apply` | — |

## Jobs

| Operator | Single job |
| --- | --- |
| `architecture.decide` | Decide one architecture with its tech stack, system boundaries, and data ownership, and prove it against the observed current state, the rejected alternatives, verified compatibility, and an independent critique. |
| `backend.source.apply` | Implement one backend outcome inside a frozen mutation contract, following the observed sibling family, and return the measured conformance and proof receipt that shows the boundary was not widened. |
| `business.decide` | Decide and publish one evidence-backed business promise as durable backend-owned authority, frozen behind a complete promise-to-enforcement coverage matrix, or reconcile that published head against the source that was actually delivered. |
| `content.generate` | Generate or refactor one educational content unit in one linear pass: a teacher brief that constrains everything after it, one written edition per declared language, images made to a stated claim, code and executable checks that actually run, and an independent review that receives the artifacts without the producer's rationale. |
| `dependency.update` | Consume one verified package release by changing only its exact dependency metadata, then prove the unchanged consumer regression and complete declared delivery gates before one session commit. |
| `frontend.direction.decide` | Decide one evidence-backed, implementation-ready frontend direction for one authorized target, and prove it against the business promise, the published Grammar, the observed implementation and a falsification pass that no candidate survives by taste. |
| `frontend.presentation.resolve` | Resolve every application-owned presentation property on one already-composed tree to exactly one published rule, emit its class and its verifiable contract claim, and stop at the smallest owning gap instead of inventing a value. |
| `frontend.source.apply` | Write one already-resolved tree into product source on the session branch, inside a frozen owner ceiling and a declared file set, emitting only values the bound resolution already contains, and account for every byte that entered the repository in one commit. |
| `frontend.surface.audit` | Observe the selected primary surfaces at the served route across their frozen audit matrix, measure every node that carries a claim, and judge each measurement against the published proof rules by the owner of the node it stands on. |
| `git.publish` | Publish one approved Git boundary from the exact commit quality verified, with non-force, fast-forward-only semantics, and stop with a typed failure rather than reaching for a bypass. |
| `library.source.apply` | Repair existing behavior inside one explicitly authorized owner package, prove its regression and package gates, and commit exactly one next-patch delivery on the bound session branch. |
| `platform.operate` | Operate one bounded shared service from exact evidence — observability, Sonar, tunnel, the runtime registry, or the identity a bound route authenticates against: inventory it, converge only the approved delta, prove every check the bound knowledge requires, and stop at the smallest owning gap instead of taking product deployment ownership. |
| `quality.verify` | Verify one bounded delivery by running its declared gates against an unchanged predecessor receipt at one frozen head, and return the exact measured verdict, repairing nothing. |
| `release.deploy` | Deploy one immutable release to one declared target under its declared authorization and prove the steady state it reached, taking the recovery or rollback branch inside the same pass rather than assuming the rollout succeeded. |
| `uat.verify` | Verify one product flow end to end on the running product at the pinned commit, and publish one append-only run record with three independently judged lanes, or stop at the exact unavailability instead of manufacturing a verdict. |
| `workspace.bind` | Resolve one project and role into a verified checkout identity, its exact source head, and the closed runtime binding it may consume, and return that as one typed route receipt. |

## Stop codes

Every code an operator may stop with, merged from `operators/errors.json` (codes several operators share, with a scope list) and each `operators/<id>/errors.json`. A code has exactly one disposition: **terminate** ends the branch blocked; **fallback** performs the named action, records it under `## Fallbacks taken` in `response.md`, and continues. `unless` names the one Requirements param whose value flips the disposition. `domain` is the `routing.json` domain the stop hands to; `self` is the emitting operator's own domain, a resume. A runtime meeting an unlisted code terminates with `UNKNOWN_STOP`.

| Code | Scope | Domain | Disposition | Meaning | Fallback | Unless | Resume |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `EVIDENCE_MISSING` | `*` | `self` | terminate | A claim about the system has no file, line, or head behind it. | — | — | Add the evidence. |
| `INVALID_INPUT` | `*` | `caller` | terminate | request.json fails the gate or the operator's Requirements. | — | — | Correct request.json. |
| `NO_PROGRESS` | `*` | `caller` | terminate | A resume adds no evidence, constraint, inventory, or approval delta. | — | — | Bring a real delta. |
| `SOURCE_DRIFT` | `*` | `workspace` | terminate | The observed checkout head differs from the head request.json froze. | — | — | The orchestrator freezes the head again. |
| `UNKNOWN_STOP` | `*` | `caller` | terminate | The runtime met a code the merged registry does not list. | — | — | Register the code or fix the operator. |
| `BUSINESS_AUTHORITY_REQUIRED` | `architecture.decide` | `business` | terminate | The published business head the architecture must keep is missing or stale. | — | — | Run business.decide first. |
| `CHOICE_REQUIRED` | `architecture.decide` | `caller` | fallback | Several alternatives remain material after assessment. | Select the alternative with the highest score across tradeoffAxes; on a tie, the one that changes the fewest stack components; record the score table under ## Decision. | `selectionPolicy` = `approval-required` → terminate | The person supplies approval. |
| `COMPATIBILITY_UNVERIFIED` | `architecture.decide` | `self` | fallback | A retained stack component has no compatibility evidence on at least one axis. | Mark the component replaced-candidate in the stack delta and list the unverified axes under Handoff as unknown. | — | Add the compatibility evidence. |
| `CONSTRAINT_CONTRADICTION` | `architecture.decide` | `caller` | terminate | Two fixed-intent constraints cannot both hold. | — | — | A person resolves the constraints. |
| `CRITIQUE_UNRESOLVED` | `architecture.decide` | `self` | terminate | An attack on the selected alternative has no resolution. | — | — | Resolve the attack or select differently. |
| `CURRENT_STATE_UNOBSERVED` | `architecture.decide` | `workspace` | terminate | The system today could not be read at the frozen head. | — | — | Fix the route or the checkout. |
| `DATA_OWNERSHIP_UNASSIGNED` | `architecture.decide` | `self` | terminate | A physical store has no owning boundary. | — | — | Assign the owner. |
| `NO_VIABLE_ALTERNATIVE` | `architecture.decide` | `caller` | terminate | No alternative survives the frozen constraints, or the only alternative fails an attack. | — | — | Relax a constraint or stop. |
| `BUSINESS_AUTHORITY_MISSING` | `backend.source.apply` | `business` | terminate | A business question is open and no approved decision settles it. | — | — | Publish the decision and rebind the authority fingerprint. |
| `CONTRACT_UNFROZEN` | `backend.source.apply` | `contract` | terminate | The mutation contract is not frozen, or its fingerprint is stale. | — | — | Bring the frozen contract. |
| `CONTRACT_WIDENED` | `backend.source.apply` | `contract` | terminate | The outcome cannot be reached without a boundary the contract does not carry. | — | — | The contract owner reopens and refreezes the contract, then the same outcome is implemented again. |
| `PATTERN_UNBOUND` | `backend.source.apply` | `backend` | terminate | A touched aspect has no sibling family bound for it. | — | — | Bind the missing pattern; guessing the family from memory is refused. |
| `PROOF_UNAVAILABLE` | `backend.source.apply` | `platform` | terminate | A declared proof could not be executed in this environment. | — | — | Provide a working proof environment; a proof that could not run never becomes a pass. |
| `OWNER_CONFLICT` | `backend.source.apply`, `frontend.presentation.resolve`, `frontend.source.apply` | `caller` | terminate | A node that must be mutated lies outside the mutable owner ceiling, or the owner sets overlap. | — | — | Correct the owner authority. |
| `SESSION_MISSING` | `backend.source.apply`, `frontend.source.apply`, `git.publish` | `caller` | terminate | Source was designed, written or published outside a session: the branch has no step-N/parallel-M under a session folder with state.json and a validated request.json, or the session branch being published carries no done source-application response whose commits contain its head, or a frontend chain with an audit step has no frontend-surface-audit response with its screenshots. | — | — | Create the session first — state.json and step-1/parallel-1/request/request.json, green under validate-request — and run the operators that owe the receipt; a session cannot be reconstructed after the fact. |
| `AUTHORITY_CONFLICT` | `business.decide` | `workspace` | terminate | The head or the businesses root contradicts published authority. | — | — | Correct the authority binding. |
| `CONSUMER_UNPROVEN` | `business.decide` | `business` | terminate | A discovered enforcement consumer has no disposition or no proof. | — | — | Dispose the consumer with positive and negative proof, then publish the promise again. |
| `CONTRADICTION_UNRESOLVED` | `business.decide` | `caller` | terminate | Two claims about the same behaviour disagree and nothing resolves them. | — | — | The owner resolves the contradiction. |
| `COVERAGE_INCOMPLETE` | `business.decide` | `business` | terminate | A declared coverage dimension carries no disposition. | — | — | Add the missing disposition. |
| `LIFECYCLE_TRANSITION_INVALID` | `business.decide` | `caller` | terminate | The requested target state is unreachable from the observed head. | — | — | Ask for a legal transition, or publish the intermediate state first. |
| `RECONCILIATION_DISCREPANCY` | `business.decide` | `backend` | terminate | Delivered source differs from the frozen coverage matrix. | — | — | Correct the source, or revise the matrix. |
| `APPROVAL_REQUIRED` | `business.decide`, `release.deploy` | `caller` | terminate | The transition or the release needs an approval that no request bound. | — | — | A person supplies the approval. |
| `BRIEF_UNBOUND` | `content.generate` | `curriculum` | terminate | The teacher brief cannot be frozen from the bound curriculum and source evidence. | — | — | Supply the missing curriculum or source evidence. |
| `CODE_BUILD_FAILED` | `content.generate` | `content` | terminate | A declared implementation track does not build. | — | — | Repair the track, then build it again. |
| `CONTRACT_WEAKENED` | `content.generate` | `content` | terminate | The executable contract moved during the repair loop, so the proof measures nothing. | — | — | Restore the contract and rerun without touching it. |
| `E2E_FAILED` | `content.generate` | `content` | terminate | A declared executable check still fails when maxE2eIterations is spent. | — | — | Repair the implementation, or approve more iterations. |
| `IMAGE_UNAVAILABLE` | `content.generate` | `engineering` | terminate | A required image cannot be generated to the brief's claims. | — | — | Provide a working generator, or turn the image stage off. |
| `OUTCOME_UNCOVERED` | `content.generate` | `content` | terminate | A declared language edition leaves a published learning outcome uncovered. | — | — | Rewrite the edition, or narrow the brief. |
| `REVIEW_REVISION_REQUIRED` | `content.generate` | `content` | fallback | The independent review returned a revision. | Repair exactly the artifacts the review's findings name, by owning stage, record the round under ## Fallbacks taken, and reopen the review exchange for the next round. | — | Nothing is asked of anyone; the branch revises and reviews again until maxReviewRounds is spent. |
| `REVIEW_ROUNDS_EXHAUSTED` | `content.generate` | `caller` | terminate | maxReviewRounds is spent and the review still returns a revision. | — | — | Approve more rounds, or narrow the unit. |
| `DEPENDENCY_BOUNDARY_REJECTED` | `dependency.update` | `caller` | terminate | The verified release, package identity or exact metadata boundary cannot be proved. | — | — | Supply the verified artifact and a corrected metadata plan; source changes remain with their source owner. |
| `DEPENDENCY_PROOF_FAILED` | `dependency.update` | `self` | terminate | The unchanged consumer regression or a required delivery gate lacks valid evidence at the installed dependency version. | — | — | Repair the owner release or installation, then repeat the unchanged consumer proof. |
| `ARCHITECTURE_REQUIRED` | `frontend.direction.decide` | `architecture` | terminate | The direction changes a system or data boundary nobody decided. | — | — | Run architecture.decide first. |
| `BACKEND_REQUIRED` | `frontend.direction.decide` | `backend` | terminate | The direction changes a data contract nobody delivered. | — | — | Run backend.source.apply first. |
| `BUSINESS_REQUIRED` | `frontend.direction.decide` | `business` | terminate | An actor, promise, permission, adverse outcome or recovery truth the change level requires is unresolved. | — | — | Run business.decide first. |
| `CHANGE_LEVEL_AMBIGUOUS` | `frontend.direction.decide` | `caller` | terminate | The authority for new, reconstruct or refine is unresolved or contradicts the intent. | — | — | State the exact change level. |
| `DIRECTION_CHOICE_REQUIRED` | `frontend.direction.decide` | `caller` | fallback | Under automatic, several candidates survive and the scores prove none dominant. Under approval-required, material tier or direction alternatives await the user's choice; scores inform the recommendation, not the selection. | Among the tied top scorers, select the candidate that introduces the fewest new nodes; the scores stay under ## Scores and the pick under ## Decision. | `selectionPolicy` = `approval-required` → terminate | The person supplies approval naming one candidate. |
| `GRAMMAR_REQUIRED` | `frontend.direction.decide` | `grammar` | terminate | A family component the direction needs is unpublished; a composite is never assembled in its place. | — | — | A person publishes the component, and the same direction runs again. |
| `NO_VIABLE_DIRECTION` | `frontend.direction.decide` | `caller` | terminate | Every candidate contradicts authority or fails a mandatory attack. | — | — | Change the authority or the constraints; cosmetic variants are not a delta. |
| `OWNER_CEILING_INVALID` | `frontend.direction.decide` | `caller` | terminate | The direction needs an owner the declared ceiling does not authorize. | — | — | Correct the owner ceiling. |
| `REFERENCE_EVIDENCE_EXHAUSTED` | `frontend.direction.decide` | `caller` | terminate | Bounded research cannot close the business or interaction question the decision rests on. | — | — | Supply the owning authority or a materially new reference. |
| `REFERENCE_MISSING` | `frontend.direction.decide` | `self` | terminate | A new or reconstruct direction named no reference standard, so the class the surface is aiming at is unstated and the taste lens cannot judge whether it landed there. | — | — | Name at least one standard by class, with what is borrowed from it, and run the same direction again. |
| `SCOPE_UNFROZEN` | `frontend.direction.decide` | `caller` | terminate | The target or the boundary of the surface is incomplete, so the UI contract cannot be closed. | — | — | Freeze the scope. |
| `ROUTE_UNVERIFIED` | `frontend.direction.decide`, `git.publish` | `workspace` | terminate | The project or the routed frontend checkout identity is not verified. | — | — | Bind the route again. |
| `GRAMMAR_UNPUBLISHED` | `frontend.presentation.resolve` | `grammar` | terminate | The Grammar package is unpublished or the bound fingerprint is stale. | — | — | A person publishes the exact Grammar package. |
| `KNOWLEDGE_UNBOUND` | `frontend.presentation.resolve` | `knowledge` | terminate | A presentation property is present in the tree and no knowledge topic is bound for it. | — | — | Bind the missing topic. |
| `RULE_MISSING` | `frontend.presentation.resolve` | `knowledge` | terminate | No published case matches the observed condition on a node. | — | — | The knowledge owner publishes the case, and the tree is resolved again. |
| `UNKNOWN_RULE` | `frontend.presentation.resolve`, `frontend.surface.audit` | `self` | terminate | An identifier outside the bound rule inventory was reached for. | — | — | Bind the topic that publishes it, or correct the identifier. |
| `RESOLUTION_STALE` | `frontend.source.apply` | `resolution` | terminate | The resolution actually read differs from the resolution the request bound. | — | — | Bind the current resolution, or resolve the tree again. |
| `WRITE_REJECTED` | `frontend.source.apply` | `caller` | terminate | A file or a value the write would produce lies outside what was authorized, or the committed tree is not the resolved tree. | — | — | Declare a corrected write set, or publish a resolution that carries the value. |
| `SURFACE_CLASS_MISSING` | `frontend.surface.audit` | `direction` | terminate | The direction decision declares no surface class, or one outside the vocabulary COVERAGE-1 Case 7 publishes, so every banded proof rule is left without a threshold and no topic can be judged. | — | — | Decide the direction again with a declared surface class, then audit at the same commit. |
| `IDENTITY_MISSING` | `frontend.surface.audit`, `uat.verify` | `platform` | terminate | The route requires an identity to reach the surface and no account record exists for this flow yet. It is a hand-off and not a verdict: the operator that owns identity provisions the account, and this branch is re-entered with it. | — | — | The identity operator provisions the flow's account against the registry entry, and this branch runs again with it. |
| `RUNTIME_UNAVAILABLE` | `frontend.surface.audit`, `uat.verify` | `platform` | terminate | The endpoint does not serve the bound route, or the surface never reaches readiness. | — | — | Whoever runs the service serves the bound route; this operator never starts one. |
| `APPROVAL_MISSING` | `git.publish` | `caller` | terminate | No approval covers this exact boundary unit; completion proof is not approval. | — | — | Supply an approval issued for this unit. |
| `DIRTY_OUTSIDE_BOUNDARY` | `git.publish` | `source` | terminate | Something dirty lies outside the declared write roots, so the publish would carry work this boundary does not own. | — | — | Clean the tree, or correct the write roots. |
| `HOOK_BLOCKED` | `git.publish` | `source` | terminate | A Git hook rejected the publication, and no bypass is representable. | — | — | Fix the boundary and bring a new head. |
| `NON_FAST_FORWARD` | `git.publish` | `remote` | terminate | The remote carries commits the local ref does not, so the push is not fast-forward. | — | — | The branch owner reconciles the divergence and a new head arrives. |
| `BRANCH_POLICY_VIOLATION` | `git.publish`, `workspace.bind` | `workspace` | terminate | The checkout is on a branch the routed Git policy forbids for this operation. | — | — | Move to a permitted branch or change the routed policy. |
| `LIBRARY_BOUNDARY_REJECTED` | `library.source.apply` | `caller` | terminate | The package identity, exact write set, behavior-only boundary or session binding cannot be proved. | — | — | Supply corrected owner authority or a bounded plan; product presentation still uses the frontend pipeline. |
| `LIBRARY_PROOF_FAILED` | `library.source.apply` | `self` | terminate | The regression did not fail before and pass after, or a required package gate did not pass on the delivered tree. | — | — | Repair the declared behavior and rerun the complete proof set on the changed tree. |
| `CAPABILITY_MISSING` | `platform.operate` | `caller` | terminate | The capability the service kind requires is absent or names no custody evidence. | — | — | Supply the missing capability handle with its custody. |
| `EFFECT_UNAUTHORIZED` | `platform.operate` | `caller` | terminate | A required effect lies outside the approved effect set or outside the branch. | — | — | Approve the effect, or bring a narrower plan. |
| `INTEGRATION_FAILED` | `platform.operate` | `product` | terminate | serve resolved the merge conflict itself and gated the merged head, and a required gate came back red: the merged head does not pass the delivery gates. The receipt names the failing gate and the resolutions that were made. | — | — | A person or the owning session repairs the session branch and asks to serve again; the merge that produced the failing head is never rebased, forced or abandoned to make it apply. |
| `INVENTORY_DRIFT` | `platform.operate` | `platform` | terminate | A declared resource moved since the inventory was bound, so the plan describes a service that no longer exists. | — | — | Re-observe the inventory; it must arrive with a new fingerprint. |
| `PORT_CONFLICT` | `platform.operate` | `product` | terminate | A claimed port is already held by another declared process, and holding it is not permission to reclaim it. | — | — | Agree a port, or the holder's owner releases it. |
| `PROOF_FAILED` | `platform.operate` | `platform` | terminate | A required check is missing, unreadable, or failed after apply, and an unproved operation is not an operated one. | — | — | Repair the service, then invoke again. |
| `SERVICE_UNAVAILABLE` | `platform.operate` | `provider` | terminate | The shared service or its provider cannot be reached. | — | — | Restore the provider. |
| `AUTHORITY_DRIFT` | `platform.operate`, `uat.verify` | `caller` | terminate | The approval — an approval id, or the environment declaration it references, whose content hash has moved — no longer matches what the operation asked for. | — | — | Bring a fresh approval for this exact operation: a new id, or the declaration's current reference. |
| `PROVISIONING_UNAVAILABLE` | `platform.operate`, `uat.verify` | `control-panel` | terminate | The identity provider, the sealed credential or the store a UAT identity needs cannot be reached, so the account can be neither created nor used. A record that is merely absent is created; this code is for a dependency that is not there at all. | — | — | Restore the provider, the sealed file or the store; never ask a person to sign in or to paste a credential. |
| `DEBT_UNAPPROVED` | `quality.verify` | `caller` | terminate | A declared debt has no live owner approval, or it covers a gate that passed or a boundary-drift failure. | — | — | Supply the unexpired owner approval, or drop the debt. |
| `GATE_UNAVAILABLE` | `quality.verify` | `platform` | terminate | A required gate cannot be executed at all in this environment, and an unmeasurable gate is not a passed one. | — | — | Provide a working gate environment. |
| `PREDECESSOR_MIXED` | `quality.verify` | `caller` | terminate | Two predecessor receipts describe different source heads, so their union is a delivery nobody built. | — | — | Supply one coherent predecessor set on one head. |
| `PREDECESSOR_STALE` | `quality.verify` | `caller` | terminate | A predecessor fingerprint no longer matches the frozen source. | — | — | Bring a refreshed upstream receipt. |
| `ARTIFACT_MISSING` | `release.deploy` | `provider` | terminate | The immutable digest cannot be resolved, and no replacement may be built and called the same release. | — | — | Publish the artifact at that digest. |
| `AUTHORIZATION_MISSING` | `release.deploy` | `approval` | terminate | No declared grant covers this project, environment, target, or the deploy action, or it had expired when the target was observed. | — | — | Supply the declared authorization, still valid. |
| `CONCURRENT_DRIFT` | `release.deploy` | `deployment` | terminate | A release that is neither this one nor its predecessor became active during execution. | — | — | Replan against the new observed state. |
| `CREDENTIAL_UNAVAILABLE` | `release.deploy` | `platform` | terminate | A declared handle cannot be resolved through existing custody. | — | — | Restore the custody; never an inline value. |
| `DOMAIN_UNRECONCILED` | `release.deploy` | `provider` | terminate | Domain or TLS state cannot be brought to the declaration. | — | — | Fix the provider state, or the provider authority. |
| `HOST_UNAVAILABLE` | `release.deploy` | `provider` | terminate | The declared host cannot be prepared. | — | — | Provide a reachable, prepared host. |
| `MANIFEST_INVALID` | `release.deploy` | `caller` | terminate | The validated manifest is pinned to another release, and that substitution is how an unreviewed image reaches a reviewed target. | — | — | Bring a manifest validated against this release. |
| `MIGRATION_BLOCKED` | `release.deploy` | `backend` | terminate | The declared migration cannot be applied safely. | — | — | Approve a migration boundary the backend owner can apply. |
| `RECOVERY_EXHAUSTED` | `release.deploy` | `approval` | fallback | The approved reversible actions ran out. | Take the rollback branch: restore rollbackIdentity by its exact digest, never by tag, and record the restored release under ## Fallbacks taken. | — | Grant rollback authority, or approve an unsafe action. |
| `ROLLBACK_IDENTITY_MISSING` | `release.deploy` | `provider` | terminate | Rollback is required and its exact safe release no longer exists. | — | — | Restore the safe release at its exact digest. |
| `ROLLOUT_FAILED` | `release.deploy` | `deployment` | fallback | The rollout could not place the release on the target. | Take the recovery branch: apply only the approved reversible actions against the same release identity, one at a time, and record each attempt with its outcome under ## Fallbacks taken. | — | Correct the target or the plan and roll out again. |
| `STEADY_STATE_UNPROVEN` | `release.deploy` | `deployment` | terminate | The steady window never closed before the bounded deadline, and an assumed rollout is not a deployment. | — | — | Observe a fresh series after the target recovers. |
| `ADMISSION_MISSING` | `uat.verify` | `quality` | terminate | The surface audit or the quality verification that admits product UAT is absent, or one of them was taken at another commit than the pinned head. | — | — | Re-run the missing admission at the pinned commit. |
| `CANONICAL_WRITE_DENIED` | `uat.verify` | `backend` | terminate | The flow directory cannot be written and read back under the exclusive lease, or the write would have rewritten an existing run record. | — | — | Restore write authority on the flow directory, or publish under a new runId. |
| `EVIDENCE_UNAVAILABLE` | `uat.verify` | `runtime` | terminate | A case produced no capture, no screenshot, or no screenshot whose login field could be masked, so a lane has nothing to be judged on. | — | — | Restore the dependency and run the frozen case again under a new runId. |
| `FIXTURE_VIOLATION` | `uat.verify` | `caller` | terminate | The seed, the run namespace or the cleanup scope could not be satisfied: a seed would have created the outcome under test, or cleanup would have reached outside the namespace. | — | — | Correct the fixture boundary in seed/records.json. |
| `LEASE_INVALID` | `uat.verify` | `control-panel` | terminate | The exclusive lease on the flow directory is expired, foreign, or bound to another run, generation or origin. | — | — | The orchestrator grants the lease again for this run. |
| `CHECKOUT_DIRTY` | `workspace.bind` | `source` | terminate | Something is dirty outside the declared write roots, or the checkout carries any dirt at all while sitting on the mutation branch rather than a session/<sessionId> branch: the mutation branch has no in-progress state of its own, so dirt found there is source written with no session to account for it, session-only policy or not. | — | — | Clean the boundary, or declare the write roots that cover it when the checkout is already on a session/<sessionId> branch; on the mutation branch the repair is to open the session and move the change onto its branch, not to declare a write root over it — this operator never stashes. |
| `ENDPOINT_AUTHORITY_STALE` | `workspace.bind` | `runtime` | terminate | The endpoint binding is not the closed port projection, or its fingerprint is stale. | — | — | Recompute the authority fingerprint at its owner. |
| `IDENTITY_UNVERIFIED` | `workspace.bind` | `identity` | terminate | The machine identity or its encrypted credential roster is missing or stale. | — | — | Verify the machine identity and seal its roster. |
| `ROUTE_MISMATCH` | `workspace.bind` | `workspace` | terminate | The hydrated route disagrees with the closed portable route, or belongs to another Source. | — | — | Correct the hydration. |
| `ROUTE_UNDECLARED` | `workspace.bind` | `workspace` | terminate | No portable declaration names this project and role. | — | — | Declare the route; this operator never repairs one. |
| `ROUTE_UNHYDRATED` | `workspace.bind` | `workspace` | terminate | The declaration exists but no local route projects it onto this machine. | — | — | Hydrate the route on this machine. |
| `RUNTIME_BUSY` | `workspace.bind` | `runtime` | terminate | The integration branch of this route is leased by another session while it merges and restarts, so the head this binding needs is not served yet. | — | — | Wait for the holder to release the lease, then bind again: the same endpoint serves the merged head next. The reason names the holding session, the operation it is in and the queue position. |
| `RUNTIME_NOT_READY` | `workspace.bind` | `runtime` | terminate | The runtime owner registry is missing, stale, or not ready while the caller must consume it. | — | — | Raise one coordination request to the registered owner and wait for a ready generation. |
```

## FILE: .claude/operators/errors.json

SHA-256: fd59e347987522ef0312140ef7c959f36048311435e1dfa6f50850c311ee4431

```json
{
  "schemaVersion": 9,
  "note": "Stop codes shared by more than one operator. `scope` is the list of operator ids that may emit the code, or [\"*\"] for every operator. A code only one operator emits lives in that operator's own operators/<id>/errors.json with the same entry shape and no scope; scripts/errors-registry.mjs merges both into one registry and refuses a code defined twice. A code has exactly one disposition: `terminate` ends the step with response.json status blocked and stop = code; `fallback` performs the named action, records it under `## Fallbacks taken` in response.md, and continues. `unless` is the only way a disposition changes: it names one Requirements param and the value that flips the code to `then`. `domain` is the routing.json domain the code hands to; `self` means the emitting operator's own domain (a resume). A runtime that meets a code the merged registry does not list terminates with UNKNOWN_STOP.",
  "codes": {
    "AUTHORITY_DRIFT": {
      "scope": [
        "platform.operate",
        "uat.verify"
      ],
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "The approval — an approval id, or the environment declaration it references, whose content hash has moved — no longer matches what the operation asked for.",
        "vi": "Phê duyệt — một id phê duyệt, hay bản khai báo môi trường mà nó tham chiếu với hash nội dung đã đổi — không còn khớp với điều thao tác đã yêu cầu."
      },
      "resume": {
        "en": "Bring a fresh approval for this exact operation: a new id, or the declaration's current reference.",
        "vi": "Mang một phê duyệt mới cho đúng thao tác này: một id mới, hoặc tham chiếu hiện hành của bản khai báo."
      }
    },
    "INVALID_INPUT": {
      "scope": [
        "*"
      ],
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "request.json fails the gate or the operator's Requirements.",
        "vi": "request.json không qua gate hoặc bảng Yêu cầu của operator."
      },
      "resume": {
        "en": "Correct request.json.",
        "vi": "Sửa request.json."
      }
    },
    "SOURCE_DRIFT": {
      "scope": [
        "*"
      ],
      "domain": "workspace",
      "disposition": "terminate",
      "meaning": {
        "en": "The observed checkout head differs from the head request.json froze.",
        "vi": "Head quan sát được của checkout khác head mà request.json đã đóng băng."
      },
      "resume": {
        "en": "The orchestrator freezes the head again.",
        "vi": "Orchestrator đóng băng head lại."
      }
    },
    "NO_PROGRESS": {
      "scope": [
        "*"
      ],
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "A resume adds no evidence, constraint, inventory, or approval delta.",
        "vi": "Lần chạy lại không thêm bằng chứng, ràng buộc, inventory hay phê duyệt nào."
      },
      "resume": {
        "en": "Bring a real delta.",
        "vi": "Mang một delta thật."
      }
    },
    "EVIDENCE_MISSING": {
      "scope": [
        "*"
      ],
      "domain": "self",
      "disposition": "terminate",
      "meaning": {
        "en": "A claim about the system has no file, line, or head behind it.",
        "vi": "Một khẳng định về hệ thống không có file, dòng hay head nào đứng sau."
      },
      "resume": {
        "en": "Add the evidence.",
        "vi": "Bổ sung bằng chứng."
      }
    },
    "UNKNOWN_STOP": {
      "scope": [
        "*"
      ],
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "The runtime met a code the merged registry does not list.",
        "vi": "Runtime gặp một mã mà sổ gộp không có."
      },
      "resume": {
        "en": "Register the code or fix the operator.",
        "vi": "Đăng ký mã hoặc sửa operator."
      }
    },
    "OWNER_CONFLICT": {
      "scope": [
        "backend.source.apply",
        "frontend.presentation.resolve",
        "frontend.source.apply"
      ],
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "A node that must be mutated lies outside the mutable owner ceiling, or the owner sets overlap.",
        "vi": "Một node cần sửa nằm ngoài trần owner được sửa, hoặc hai tập owner chồng nhau."
      },
      "resume": {
        "en": "Correct the owner authority.",
        "vi": "Sửa thẩm quyền owner."
      }
    },
    "ROUTE_UNVERIFIED": {
      "scope": [
        "frontend.direction.decide",
        "git.publish"
      ],
      "domain": "workspace",
      "disposition": "terminate",
      "meaning": {
        "en": "The project or the routed frontend checkout identity is not verified.",
        "vi": "Danh tính project hoặc checkout frontend được route chưa được xác minh."
      },
      "resume": {
        "en": "Bind the route again.",
        "vi": "Bind lại route."
      }
    },
    "UNKNOWN_RULE": {
      "scope": [
        "frontend.presentation.resolve",
        "frontend.surface.audit"
      ],
      "domain": "self",
      "disposition": "terminate",
      "meaning": {
        "en": "An identifier outside the bound rule inventory was reached for.",
        "vi": "Một identifier ngoài kho luật đã bind bị với tới."
      },
      "resume": {
        "en": "Bind the topic that publishes it, or correct the identifier.",
        "vi": "Bind topic publish nó, hoặc sửa lại identifier."
      }
    },
    "RUNTIME_UNAVAILABLE": {
      "scope": [
        "frontend.surface.audit",
        "uat.verify"
      ],
      "domain": "platform",
      "disposition": "terminate",
      "meaning": {
        "en": "The endpoint does not serve the bound route, or the surface never reaches readiness.",
        "vi": "Endpoint không phục vụ route đã bind, hoặc bề mặt không bao giờ sẵn sàng."
      },
      "resume": {
        "en": "Whoever runs the service serves the bound route; this operator never starts one.",
        "vi": "Người vận hành dịch vụ cho route đã bind chạy; operator này không bao giờ tự khởi động."
      }
    },
    "APPROVAL_REQUIRED": {
      "scope": [
        "business.decide",
        "release.deploy"
      ],
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "The transition or the release needs an approval that no request bound.",
        "vi": "Chuyển trạng thái hoặc release cần một phê duyệt mà request chưa ràng."
      },
      "resume": {
        "en": "A person supplies the approval.",
        "vi": "Người cấp phê duyệt."
      }
    },
    "SESSION_MISSING": {
      "scope": [
        "backend.source.apply",
        "frontend.source.apply",
        "git.publish"
      ],
      "domain": "caller",
      "disposition": "terminate",
      "meaning": {
        "en": "Source was designed, written or published outside a session: the branch has no step-N/parallel-M under a session folder with state.json and a validated request.json, or the session branch being published carries no done source-application response whose commits contain its head, or a frontend chain with an audit step has no frontend-surface-audit response with its screenshots.",
        "vi": "Nguồn được thiết kế, ghi hay công bố bên ngoài một phiên: nhánh không nằm trong step-N/parallel-M dưới thư mục phiên có state.json và request.json đã hợp lệ, hoặc nhánh phiên đem công bố không có response source-application nào ở trạng thái done mà commits chứa head của nó, hoặc một chuỗi frontend có bước audit lại không có response frontend-surface-audit kèm ảnh chụp."
      },
      "resume": {
        "en": "Create the session first — state.json and step-1/parallel-1/request/request.json, green under validate-request — and run the operators that owe the receipt; a session cannot be reconstructed after the fact.",
        "vi": "Tạo phiên trước — state.json và step-1/parallel-1/request/request.json, xanh dưới validate-request — rồi chạy các operator còn nợ biên nhận; một phiên không thể dựng lại sau khi việc đã xong."
      }
    },
    "BRANCH_POLICY_VIOLATION": {
      "scope": [
        "git.publish",
        "workspace.bind"
      ],
      "domain": "workspace",
      "disposition": "terminate",
      "meaning": {
        "en": "The checkout is on a branch the routed Git policy forbids for this operation.",
        "vi": "Checkout đang ở nhánh mà chính sách Git của route cấm với thao tác này."
      },
      "resume": {
        "en": "Move to a permitted branch or change the routed policy.",
        "vi": "Chuyển sang nhánh được phép hoặc đổi chính sách của route."
      }
    },
    "PROVISIONING_UNAVAILABLE": {
      "scope": [
        "platform.operate",
        "uat.verify"
      ],
      "domain": "control-panel",
      "disposition": "terminate",
      "meaning": {
        "en": "The identity provider, the sealed credential or the store a UAT identity needs cannot be reached, so the account can be neither created nor used. A record that is merely absent is created; this code is for a dependency that is not there at all.",
        "vi": "Không tới được nhà cung cấp danh tính, bí mật niêm phong hay kho dữ liệu mà một danh tính UAT cần, nên tài khoản không tạo được mà cũng không dùng được. Hồ sơ chỉ đơn giản là chưa có thì được tạo ra; mã này dành cho một phụ thuộc hoàn toàn không tồn tại."
      },
      "resume": {
        "en": "Restore the provider, the sealed file or the store; never ask a person to sign in or to paste a credential.",
        "vi": "Khôi phục provider, file niêm phong hay kho dữ liệu; không bao giờ nhờ người đăng nhập hay dán thông tin đăng nhập."
      }
    },
    "IDENTITY_MISSING": {
      "scope": [
        "frontend.surface.audit",
        "uat.verify"
      ],
      "domain": "platform",
      "disposition": "terminate",
      "meaning": {
        "en": "The route requires an identity to reach the surface and no account record exists for this flow yet. It is a hand-off and not a verdict: the operator that owns identity provisions the account, and this branch is re-entered with it.",
        "vi": "Route đòi một danh tính mới tới được bề mặt, mà luồng này chưa có hồ sơ tài khoản nào. Đây là một lần bàn giao, không phải một phán quyết: operator sở hữu danh tính sẽ cấp tài khoản, rồi nhánh này được vào lại cùng nó."
      },
      "resume": {
        "en": "The identity operator provisions the flow's account against the registry entry, and this branch runs again with it.",
        "vi": "Operator danh tính cấp tài khoản của luồng theo entry trong registry, rồi nhánh này chạy lại cùng tài khoản đó."
      }
    }
  }
}
```

