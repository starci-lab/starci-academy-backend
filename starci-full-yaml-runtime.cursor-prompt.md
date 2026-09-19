# Cursor task: finish StarCi YAML authoring and source-built runtime distribution

## Objective

Work in `D:/Repositories/starci-academy-backend/.claude`, the StarCi runtime repository. Read the host `AGENTS.md` and current `SKILL.md` completely before work. Inspect actual files; this prompt describes the target, not proof that any migration is complete.

Finish migrating remaining authored declarative JSON to readable structured YAML. Knowledge has already been migrated: preserve and integrate it, do not redo or regress its content. Build the complete consumable runtime into `.dist`. Generated JSON is compact, one line per file, with a final newline. Users install source and build `.dist` locally. `.dist` must never be tracked or pushed to Git.

This is a runtime migration, not product development. Do not modify Nivo BE/FE, canonical `.starciwork`, live plans/receipts, customer data, databases or infrastructure. Do not mark product workflows done. Do not publish to npm, deploy, or commit/push in this Cursor task; return the tested changes for coordinator review.

## Non-negotiable boundaries

1. Human-authored declarative contracts/configuration use YAML unless a real consumer requires JSON. An existing JSON.parse call is not a reason to retain authored JSON: adapt the consumer/build.
2. Keep executable source as `.mjs`, `.js`, `.ts`, `.tsx`, etc. Do not wrap code in YAML or stringify entire source files as a substitute for executable modules.
3. Keep human documentation such as README and explanatory docs in Markdown. Keep `SKILL.md` and `init/` bootstrap entrypoints in their required native formats. “Full YAML” means declarative source, not converting every file regardless of purpose.
4. The installed agent-facing runtime must resolve contracts, knowledge, schemas, workflow/operator data, supporting docs and executable runtime modules from `.dist`, except explicit entrypoints/bootstrap and necessary installation metadata. Source remains in the repository/package for building and maintenance; it is not a second live runtime authority.
5. Do not weaken validation, approvals, ownership, security checks, completion rules or source identity to make the migration pass.
6. Preserve all pre-existing changes. The worktree is dirty and includes other runtime work. Never reset/clean or broadly stage unrelated files.

## Current handoff — inspect before changing

Recent coordinator edits, not yet committed/pushed:

- `.gitignore` now ignores `/.dist/`.
- Previously tracked `.dist` files were removed from the Git index using `git rm --cached`; local files were retained. Preserve that intention; do not restore tracking.
- `.dist/` was removed from `package.json`'s published files allowlist.
- `bin/starci-skills.mjs` now attempts to build installed source during init/update before recording successful installation. Review this integration, especially preserved local changes and failure handling.
- `scripts/build-workflows.mjs` no longer catches knowledge compilation errors and silently falls back to JSON.
- `scripts/ensure-build.mjs` now rejects a missing/failing knowledge compiler instead of deferred success. Remove obsolete comments/dead deferred-output logic if still present.
- `scripts/compile-knowledge.mjs` rejects authored JSON except the explicit calibration data file; do not reintroduce hybrid fallback.
- Required compiler/example tests fail when artifacts are absent instead of skipping them.
- `schemas/knowledge-source.schema.json` rejects unknown root fields and explicitly lists current topic fields. Some nested payloads remain broadly typed: do not claim the entire schema is strict yet.
- Focused build-entry/knowledge tests passed 24/24 at the coordinator checkpoint. That is historical evidence only; rerun after your changes.

## 1. Inventory and freeze the migration map

Inventory declarative JSON in `ops/`, `workflows/`, `profiles/`, `schemas/`, `specifications/`, `contracts/`, `core/`, `docs/`, `examples/`, `fixtures/`, and root metadata. Inspect other directories only as needed to find real consumers; exclude dependencies, Git internals, worktrees, secrets, local config and generated site caches.

Classify every file as:

- authored declarative source -> YAML;
- generated output -> `.dist` only;
- executable/native code or prose -> preserve native format;
- genuinely required JSON -> retain with a concrete consumer/reason;
- external-format test fixture -> retain only when JSON bytes are the thing being tested.

Record this map and a machine-checkable explicit JSON exception allowlist. Do not allow entire broad directories as a shortcut.

Typical legitimate exceptions: npm `package.json` / `package-lock.json`, JSON-only external tool manifests, exact JSON wire-format fixtures. JSON Schema itself can be authored in YAML and compiled to standard JSON Schema: preserve `$id`, `$ref` and validation semantics. Do not assume every `*.schema.json` must remain authored JSON.

Do not expose or commit `config.json` or secrets. If local configuration format changes, provide an explicit compatibility/migration policy without modifying a user's existing local settings silently.

## 2. Author YAML properly

- Preserve IDs, enum values, contracts, meaning, ordering where meaningful, and public runtime paths unless an explicit compatibility migration is implemented and tested.
- Use mappings/lists and literal block scalars for prose. Do not rename JSON files to YAML while leaving unreadable JSON blobs inside.
- One authored authority per logical document: no YAML/JSON mirrors, JSON fallback, or duplicate generated catalogs outside `.dist`.
- Keep current knowledge rules/examples intact. Multi-file examples remain real native files with YAML manifests.
- Use safe YAML parsing with duplicate-key rejection, bounded input and an explicit policy for aliases, tags, merges and scalar types. Do not allow dates/booleans/numbers to change semantic types unintentionally.
- Validate the parsed object before emitting anything. Unknown fields must not be silently accepted or dropped; model legitimate variants explicitly. Do not broaden schemas merely because parallel outputs differ.
- Preserve the difference between draft proposals and enforced rules.

## 3. Compiler and runtime layout

Design the full source -> `.dist` mapping before implementation. Integrate the existing knowledge compiler instead of introducing another authority.

Requirements:

- JSON data in `.dist` is one line per file; no pretty printing and no giant all-in-one prompt bundle.
- Executable runtime stays executable, not JSON-encoded. Native assets preserve their formats.
- Stable deterministic output for identical inputs; no machine paths, timestamps or random ordering in semantic output.
- Resolve all references, imports, example payloads and docs links within the installed layout, allowing only the explicitly documented root entrypoints/configuration where necessary.
- Agent-facing entrypoints resolve to generated runtime paths. Maintenance/build tooling may read authored source; ordinary workflow execution must not silently fall back to it.
- Adapt actual `import.meta.url`/relative-path consumers, CLI entrypoints, lifecycle `SKILL.md` resolution, config lookup, catalogs, validators and installer/doctor behavior. A directory copy alone is insufficient.
- Separate raw operator/compiler representations from public projected catalogs where their shapes differ; do not overwrite one with the other under the same path.
- Runtime code needs no development-only dependency missing from a clean install. Bundle dependencies or declare the genuine runtime requirements.
- Compile into staging and validate before publishing output. A failed build must not leave a partial bundle that appears current. Reject path traversal, symlink escapes and source/output collisions.
- `build:check` is read-only and fails for missing/stale output. Normal installation/build creates output. Never silently run a stale bundle after compiler failure.
- Any cleanup is restricted to verified generated output owned by this build, never workspace roots or user files.

## 4. Git, package and installation

- `.dist` stays ignored and untracked. Do not use `git add -f` for generated runtime.
- Package/installation must work without a pre-existing `.dist`, including on the publisher checkout.
- The user-facing install/update path builds from installed source and verifies output before reporting success. Audit npx init/update and the supported package install path explicitly; document precisely which commands trigger build.
- Do not rely solely on `prepack` building a publisher's `.dist` because users must build their runtime locally.
- Include all required source/compiler dependencies in the package, while excluding local config, secrets, worktrees, caches and generated site output.
- Existing locally modified installed source is preserved according to the documented update policy; a build failure must be reported honestly and must not record a successful new install/version.
- Include recovery guidance for an interrupted/failed install without overwriting unrelated user files.
- Update README, installation docs, source/runtime layout docs, bootstrap links and CLI help together.

## 5. Mandatory regression coverage

Add/run tests that prove:

1. Remaining authored JSON is exactly the justified exception allowlist.
2. YAML conversion preserves semantic values and public schema/contract identities.
3. Invalid YAML, duplicate keys/IDs, unknown fields, unresolved references, traversal/symlink escape and output collisions fail closed.
4. Missing compiler or required example causes failure, never skip/deferred success.
5. Two builds from the same source have byte-identical outputs; generated JSON files have one physical line plus final newline.
6. Missing/stale `.dist` fails check mode without writes; normal build creates it.
7. Clean install and update build a fresh `.dist` from source; injecting invalid source makes install fail rather than reuse an old bundle.
8. Package smoke uses the actual packed artifact installed into a disposable directory, not imports from the checkout or its node_modules.
9. Runtime-only relocation smoke runs CLI validation/routing and imports lifecycle/approval/Work validation modules with authored runtime directories unavailable. Keep only explicitly allowed entrypoints/configuration. All required data resolves inside `.dist`.
10. Existing workflow approval, completion, currentness, evidence/source-identity and package tests still pass. Do not modify expected results merely to hide changed semantics.
11. Multi-file examples remain fully packaged and resolvable. Report syntax, lint and typecheck separately; do not claim unrun verification.
12. `git ls-files .dist` returns no tracked files and installation generates output that remains ignored.

Use disposable directories for destructive/negative tests. Never corrupt the active shared runtime to test failure paths. List actual commands and counts, including skips/failures and reasons.

## 6. Execution and final output

Start with a short scope/approach summary and inspect current state. This is one cohesive migration; do not create repetitive plans for individual file conversions. Work through compiler -> consumers -> installer -> tests/docs with explicit dependency order. Coordinate a single owner for shared compiler/wiring files if using parallel work.

Do not interrupt or rewrite existing product plans, mandates or receipts. Do not fabricate approvals or claim backend product completion from runtime tests.

Return:

- what migrated and the final source/runtime tree;
- exact JSON exceptions and reasons;
- install/build/runtime loading behavior;
- actual test results and isolated package/runtime smoke proof;
- remaining limitations, especially nested schema strictness and example verification;
- confirmation that `.dist` is untracked and no commit/push/npm publication occurred.

Definition of done: YAML is the sole authored declarative authority except explicit required JSON; a clean user installation builds a complete deterministic `.dist`; ordinary runtime use does not depend on authored source directories; all required checks pass without weakened gates or hidden skips.
