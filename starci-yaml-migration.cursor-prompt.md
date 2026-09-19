# Cursor task: StarCi authoring sources, structured knowledge and multi-file examples

## Goal and scope

Refactor the StarCi runtime at `D:/Repositories/starci-academy-backend/.claude` so humans maintain readable, structured sources and agents consume validated generated JSON in `.dist`.

Read the host `AGENTS.md`, then `.claude/SKILL.md` completely and follow the applicable instructions. Inspect Git status and actual build/load paths before changing files. The `.claude` directory is a separate repository; preserve every existing change. Do not reset, overwrite unrelated work, or assume an untracked file is disposable.

This task explicitly authorizes the runtime migration described here. It does NOT authorize edits to Nivo product repositories, canonical `.starciwork`, frozen goals, approvals, historical receipts, task lifecycle state, customer data, deployments or published packages. Other agents may be working in this environment. Keep product delivery separate.

Deliver the working migration, not just a proposal or a few converted examples. Communicate in Vietnamese; maintain knowledge, contracts and code documentation in English. Present a brief scope/inventory first and comply with applicable approval requirements without inventing approvals or unnecessary extra Plans.

## Outcomes

1. Human-authored knowledge, patterns and suitable declarative workflow/operator sources use YAML.
2. Runtime distribution uses generated JSON with stable public contracts and paths wherever feasible.
3. Code examples are cohesive multi-file `.ts`/`.tsx` examples, not escaped strings containing code.
4. There is one authoritative source for each artifact, deterministic compilation and reliable validation.
5. Existing runtime behavior, authority boundaries, workflow selection, completion criteria and public CLI behavior are preserved.
6. Examples and rules support consistent FE/BE code across projects without copying application business behavior or database ownership.

## Format decisions

Use the right format for each responsibility:

- YAML: human-authored structured knowledge, rules and declarative definitions.
- Markdown: SKILL.md, README, explanatory guides and user-facing documentation.
- JSON: JSON Schema, package.json, lockfiles and other tools that require JSON; generated runtime artifacts.
- JavaScript/TypeScript: executable implementation and tooling.
- TypeScript/TSX: actual code examples and their test fixtures.

Do not convert everything indiscriminately. Inventory each candidate as authored source, generated artifact, executable contract or external format first. If JSON is generated from executable code today, either retain that single owner or deliberately migrate its declaration portion to YAML while keeping logic in code. Never add a second authoritative definition. Do not rewrite historical fixtures merely because their file extension is JSON.

Source JSON files may be removed only after their content, references and consumers have been migrated and verified. Avoid leaving editable YAML and JSON mirrors side by side. `.dist` is never edited by hand.

## Target layout

Adapt exact names to existing contracts; this tree expresses ownership, not a requirement to manufacture empty files:

```text
.claude/
├── SKILL.md
├── README.md
├── knowledge/
│   ├── index.yaml
│   ├── patterns/
│   │   ├── be/*.yaml
│   │   ├── fe/*.yaml
│   │   └── enforcement.yaml
│   ├── grammars/**/index.yaml
│   ├── ui/**/*.yaml
│   └── code-examples/
│       ├── index.yaml
│       ├── backend/
│       │   ├── index.yaml
│       │   ├── graphql-command/
│       │   │   ├── index.yaml
│       │   │   ├── example.resolver.ts
│       │   │   ├── example.service.ts
│       │   │   ├── example.command.ts
│       │   │   ├── example.handler.ts
│       │   │   ├── example.handler.spec.ts
│       │   │   ├── example.module.ts
│       │   │   ├── example.module-definition.ts
│       │   │   └── graphql-types/
│       │   │       ├── request.ts
│       │   │       └── response.ts
│       │   └── transactional-service/
│       │       ├── index.yaml
│       │       ├── example.service.ts
│       │       └── example.service.spec.ts
│       └── frontend/
│           ├── index.yaml
│           └── connected-block/
│               ├── index.yaml
│               ├── index.tsx
│               ├── component.tsx
│               ├── classNames.ts
│               ├── index.spec.tsx
│               └── component.spec.tsx
├── workflows/                 # YAML declarations; executable helpers remain code
├── ops/                       # Single owner for each operator declaration
├── schemas/*.schema.json
├── scripts/*.mjs
├── tests/
└── .dist/                     # Generated JSON and bundled example payloads
```

Preserve existing casing/public paths when required for compatibility. A source `index.yaml` may compile to an existing runtime `INDEX.json`; define the mapping explicitly and test it.

## Structured knowledge: not renamed Markdown blobs

Do not merely serialize the current `sections/blocks` Markdown arrays into YAML. Design small schemas appropriate to each knowledge family. Suggested concepts:

- `id`, `title`, `purpose`, `appliesTo`;
- rules with stable IDs, requirement, rationale and applicability;
- required and forbidden structures;
- cases and scoped exceptions;
- code-example references;
- automated verification versus manual review;
- extraction provenance and known limitations;
- proposals clearly separated from enforced requirements.

Not every topic requires every field. Avoid a giant optional-field schema or filling irrelevant sections with placeholders. Use YAML block scalars for genuine prose, not embedded files. Encode comparisons and cases as structured entries instead of Markdown table strings where appropriate.

Keep existing rule IDs and all useful semantics. Distinguish mandatory convention, historical residual/debt, sanctioned exception and proposed improvement. Historical counts must not masquerade as a fresh audit. Record only genuine source observations; never invent versions, hashes or test results.

If the runtime still expects the old presentation shape, generate that compatibility projection from structured YAML. Do not maintain two copies of the same rule.

## Code examples: multi-file, expandable, verified

Each pattern owns a folder with the files needed to demonstrate the complete interaction. Do not compress a resolver/service/handler/module chain into one TypeScript file. Do not create files that add no teaching or verification value.

Each example's `index.yaml` explains:

- purpose and when the example applies;
- related pattern/rule IDs;
- each file's role and the relationships between them;
- entrypoint or usage;
- supported dependencies and package/API assumptions;
- what users must adapt, especially domain names and database connection ownership;
- verification commands and limitations;
- source provenance and any deliberate simplification.

Use a shared verification harness instead of duplicating package/config scaffolding per example. Avoid reliance on absolute developer-machine paths in distributable examples. Distinguish complete runnable examples from focused excerpts, and do not label syntax parsing as typechecking or an integration test.

Prioritize examples grounded in the source scan:

Backend:
- CQRS GraphQL feature: resolver → thin feature service → command/query → handler → module registration.
- Capability service with private readonly EntityManager through the correct named connection decorator.
- Transaction propagation through helpers using the transaction manager, not the outer manager.
- Named AbstractException with metadata and stable error identity.
- Relevant colocated tests and, where supported, isolated database verification.

Frontend:
- Connected `index.tsx` and pure `component.tsx`, with resolved state/data/labels/actions.
- Leaf and page/route examples when they teach distinct rules.
- Verified Grammar components and imports; inspect installed exports rather than inventing APIs.
- Paired connected/pure tests and appropriate data-hook examples.

Reference extraction sources are `starci-academy-backend` and `starci-academy-fe`. Knowledge must spell out the concrete pattern; a generic instruction to consult those repositories is insufficient. Do not copy Academy business policies into examples or turn a Primary connection example into permission to use Primary for instance-owned data.

The currently scanned Grammar entry is `@starci/grammar/common`; verify supported versions. Do not copy stale `@grammar/*` aliases blindly. Keep exceptions such as unresolved legacy tiers out of new canonical examples.

## Compiler and distribution

Implement one shared source-loading/compilation path:

1. Parse YAML safely; reject duplicate keys, unsupported custom tags and ambiguous/unsupported constructs. Bound or reject alias expansion. Validate the resulting value types against the source schema.
2. Validate rules, IDs, example manifests and declarative contracts before generating output.
3. Resolve references safely; reject missing references/files, duplicate IDs, path escapes, unsupported symlinks and output collisions. Never execute example code while parsing manifests.
4. Generate stable JSON runtime projections and include example payloads required by the distribution.
5. Produce deterministic output, manifests and hashes. Stable input yields identical bytes; avoid timestamps and filesystem traversal-order dependence.
6. `build:check` is read-only and detects stale, missing and obsolete generated outputs.
7. Build must not delete arbitrary files outside the validated generated-output scope. Preserve source changes and unrelated artifacts.

Audit actual callers: loaders, compiler/generators, CLI, schema references, tests, documentation builders, init/bootstrap, packaging and example tests. Update source paths versus runtime paths deliberately, not with a blind extension replacement.

Prefer stable `.dist` JSON identities and semantic values. If an incompatible runtime change is genuinely necessary, document it and its migration explicitly; never silently loosen validators, discard fields or alter authority behavior to make the format conversion pass.

## Enforcement and consistency across projects

The scan is the baseline. The objective is consistent coding conventions across many FE/BE repositories, not identical product behavior.

Already-required behavior:
- No lint suppression, severity reduction, ignore expansion, any/cast workaround, dependency alias or facade rename merely to obtain a pass.
- Check effective configuration and exact file/test discovery, not only the rules exported by a package.
- Separate structural conformance, typechecking, behavior tests, database integration and production-transport E2E.
- Legacy violations are not new-file templates.

Propose improvements separately from implemented enforcement: versioned templates, AST checks for renamed facades/transaction overloads/aliased world access, lane-aware config audits, Grammar export checks and cross-repository CI reporting.

Implement the example/build validation needed by this migration. Do not quietly claim external lint packages were repaired, modify their installed node_modules or publish new package versions. Clearly report which guarantees are executable today and which remain proposed or require manual review.

## Execution sequence

1. Inspect current sources, generated ownership, dependencies and dirty state; summarize the migration boundary briefly.
2. Implement one complete vertical slice: structured knowledge → multi-file example → schema → compiler → `.dist` → consumers/tests.
3. Migrate remaining applicable authored sources without losing content or creating dual authority.
4. Repair references, documentation, packaging and compatibility tests.
5. Run verification and inspect final diffs.

Do not stop after one vertical slice or just hand back a plan. Do not inflate the assignment into product architecture changes. If unrelated pre-existing failures exist, identify them accurately and keep progressing where safe; never hide them by skipping assertions.

## Required verification

- Content/semantic parity between old and migrated sources, allowing only explicitly intended presentation improvements.
- Existing runtime/public contracts remain compatible; inspect meaningful parsed values as well as output paths.
- Two builds produce identical bytes.
- Build check detects stale output without writing.
- Invalid YAML, duplicate IDs/keys, missing references, unsafe paths and collisions fail with useful diagnostics.
- Bundled example paths resolve from the packaged distribution, without the author's checkout.
- Example syntax, typecheck, lint and focused tests are distinguished and run where supported.
- Negative fixtures prove validators reject applicable bypasses; documentation keyword tests are not sufficient.
- Full runtime test suite and packaging smoke test using an isolated temporary destination.
- No altered product approvals, canonical Work or product source.

Do not call a migration complete with skipped failures, unresolved broken links or code examples that cannot meet their advertised checks. Record environment limitations honestly rather than inventing a pass.

## Handoff

Report concisely in Vietnamese:
- what changed and the final source tree;
- which files are authored and which are generated;
- how to author a new pattern/example and build it;
- test results, compatibility checks and remaining limitations;
- advanced enforcement proposals, clearly separated from delivered behavior.

Do not commit, push, publish or deploy automatically.
